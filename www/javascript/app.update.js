Application.update = {};

//
// Run the update
//
Application.update.start = function() {
    this.stop();
    
    Application.update.state = {
        list:  [],
        total: 0,
        timestamps: {},
        saveGlobalTimestamps: function() {}
    };
    
    //
    // XHR Global Timestamps
    // Lawnchair Global Timestamps
    // Store timestamps in state
    //
    // If global view timestamp > stored global view timestamp
    //     inventory views
    // If global node timestamp > stored global node timestamp
    //      inventory nodes
    //
    // Set total nodes to update
    // Begin updating items
    //
    Application.update._globalTimestamps(function() {
        Application.update._inventoryViews(function() {
            Application.update._inventoryNodes(function() {
                Application.update.state['total'] = Application.update.state['list'].length;
                Application.update._nextItem();
            });
        });
    });
};

//
// Stop the update and clean up resources
//
Application.update.stop = function() {
    if (Application.update.state) {
        delete Application.update.state;
    }
};

//
// Find Global Timestamps for Local and Server
//
// @param {Function} callback completetion function.
//
Application.update._globalTimestamps = function(callback) {
    var url = Const.DOMAIN + Const.URL_VIEW_GLOBAL;
    
    var parseTimestamps = function(json) {
        var data = (json && json.data) ? json.data : [];
        
        // The server API returns an Array that contains
        // the global timestamps for the views (0) and nodes (1)
        var INDEX = { 'view': 0, 'node': 1 };
        
        // Return the timestamp value or 0ms (oldest possible timestamp)
        return {
            'view': (typeof data[INDEX.view] !== 'undefined') ? data[INDEX.view].timestamp : 0,
            'node': (typeof data[INDEX.node] !== 'undefined') ? data[INDEX.node].timestamp : 0
        };
    };
    
    var serverTimestamps = function(callback) {
        Application.please.xhr(url, {
            readCache:  false,
            writeCache: false,
            success:    function(json) {
                Application.update.state.saveGlobalTimestamps = function(callback) {
                    var key = Application.please.generateKey(url);
                    Application.cache.write(key, json, callback);
                };
                      
                var timestamps = parseTimestamps(json);
                
                Application.dispatch(function() {
                    callback(timestamps);
                });
            }
        });
    };
    
    var localTimestamps = function(callback) {
        Application.cache.find(Application.please.generateKey(url), {
            success: function(json) {
                var timestamps = parseTimestamps(json);
                Application.dispatch(function() {
                    callback(timestamps);
                });
            },
            fail: function() {
                var timestamps = parseTimestamps({});
                Application.dispatch(function() {
                    callback(timestamps);
                });
            }
        });    
    };
    
    localTimestamps(function(local) {
        serverTimestamps(function(server) {
            Application.update.state.timestamps.local  = local;
            Application.update.state.timestamps.server = server;
            Application.dispatch(callback);
        });
    });
};

//
// Find outdated lists
//
// @param {Number}   localTimestamp is the global timestamp stored locally
// @param {Number}   serverTimestamp is the global timestamp from the server
// @param {Function} callback completion function
//
Application.update._inventoryViews = function(callback) {
    // Short-circuit if everything is up-to-date
    if (!Application.update._isExpired(Application.update.state.timestamps.local.view, Application.update.state.timestamps.server.view)) {
        Application.dispatch(callback);
        return;
    }
    
    Application.trigger('update-progress', { status: Const.PROGRESS_MSG_INVENTORY_VIEWS });
    
    Application.please.xhr(Const.DOMAIN + Const.URL_VIEW_TIMESTAMPS, {
        readCache:  false,
        writeCache: false,
        success:    function(json) {
            // Build list of outdated views
            for (var i = 0, l = json.data.length; i < l; i++) {
                // Home or list view
                var url = (json.data[i].arg === '') ? Const.DOMAIN + Const.URL_HOME : Const.DOMAIN + Const.URL_VIEW2 + json.data[i].arg;
                
                Application.update.state['list'].push({
                    timestamp: json.data[i].timestamp,
                    url:       url
                });
            }
            
            delete json;
            Application.dispatch(callback);
        }
    });
};

//
// Find the nodes that need to be updated
//
// @param {Number}   localTimestamp is the global timestamp stored locally
// @param {Number}   serverTimestamp is the global timestamp from the server
// @param {Function} callback completion function.
//
Application.update._inventoryNodes = function(callback) {
    // Push nodes onto the outdated list
    var generateNodeList = function(json) {
        for (var i = 0, l = json.data.length; i < l; i++) {
            Application.update.state['list'].push({
                timestamp: json.data[i].changed,
                url:       Const.DOMAIN + Const.URL_PAGE + json.data[i].nid
            });
        }
        
        delete json;
        Application.dispatch(callback);
    };
    
    // Short-circuit if everything is up-to-date
    if (!Application.update._isExpired(Application.update.state.timestamps.local.node, Application.update.state.timestamps.server.node)) {
        Application.dispatch(callback);
        return;
    }
    
    Application.trigger('update-progress', { status: Const.PROGRESS_MSG_INVENTORY_NODES });
     
    Application.please.xhr(Const.DOMAIN + Const.URL_NODE_TIMESTAMPS, {
        readCache:  false,
        writeCache: false,
        success:    function(json) {
            if (!Application.supports.update.findExpired) {
                generateNodeList(json);
            }
            else {
                Application.trigger('update-progress', { status: Const.PROGRESS_MSG_BB_FIND_EXPIRED });
                
                window.plugins.update.findExpired(
                    Application.please.generateKey(Const.DOMAIN + Const.URL_PAGE),
                    json,
                    function(response) {
                        generateNodeList(response.message);
                    }
                );
            }
        }
    });
};

//
// Start updating
//
Application.update._nextItem = function() {
    Application.update._progress();
    
    if (!Application.update.state || Application.update.state['list'].length <= 0) {
        return;
    }
    
    var item = Application.update.state['list'].shift();
    var key  = Application.please.generateKey(item.url);
    
    var message = (item.url.indexOf(Const.URL_PAGE)) ? Const.PROGRESS_MSG_NODES : Const.PROGRESS_MSG_VIEWS;
    Application.trigger('update-progress', { status: message });
    
    Application.cache.find(key, {
        success: function(json) {
            if (Application.update._isExpired(json.timestamp, item.timestamp)) {
                Application.update._updateItem(item);
            }
            else {
                Application.dispatch(function() {
                    Application.update._nextItem();
                });
            }
        },
        fail: function() {
            Application.update._updateItem(item);
        }
    });
};

//
// Download and Store an Item
//
// @param {Object} item from update state
//
Application.update._updateItem = function(item) {
    Application.please.xhr(item.url, {
        readCache:  false,
        writeCache: true,
        success:    function(json) {
            json.timestamp = item.timestamp;
            var key = Application.please.generateKey(item.url);
            Application.cache.write(key, json, function() {
                Application.dispatch(Application.update._nextItem);
            });
        }
    });
};

//
// Timestamp Comparison
//
// @param  {Number}  localTime  is the time to compare against
// @param  {Number}  remoteTime is the time to compare to
// @return {Boolean}
//
Application.update._isExpired = function(localTime, remoteTime) {
    return (!localTime || !remoteTime || parseInt(localTime) < parseInt(remoteTime));
};

//
// Update the progress
//
Application.update._progress = function() {
    if (!Application.update.state) { return; }
    
    var remainingItems = Application.update.state['list'].length;
    
    if (remainingItems > 0) {
        var percentage = parseInt(Math.round((1 - (remainingItems / Application.update.state['total'])) * 100));
        
        Application.trigger('update-progress', { percentage: percentage });
    }
    else {
        Application.please.backupDatabase(function() {
            if (Application.update.state && Application.update.state['saveGlobalTimestamps']) {
                Application.update.state.saveGlobalTimestamps(function() {
                    navigator.notification.alert(Const.MSG_SYNC_COMPLETE, function() {
                        Application.trigger('update-close');
                    }, Const.TITLE_SYNC_COMPLETE);
                });
            }
        });
    }
};