//
// Database Creation
//
// @param {Function} callback
//
Application.please.createDatabase = function(callback) {
    if (typeof Lawnchair === 'undefined') { callback(); return; };
    if (Application.settings.database.adaptor === 'blackberry' && !navigator.store) { callback(); return; }
    
    // Dispatch the database creation
    // Required to fix the BlackBerry 5 loading screen, which will sometimes
    // not close unless the Database (Gears) is disconnected from the onload event
    Application.dispatch(function() {
        try {
            new Lawnchair(Application.settings.database, function() {
                Application.database = this;

                Application.please.migrateDatabase({
                    using:     Application.please.restoreDatabase,
                    completed: callback
                });
            });
        }
        catch(e) {
            console.log('Exception while creating new Lawnchair: ' + e);
            
            // Flag the database as null so the application can gracefully step over it
            Application.database = null;
            Application.dispatch(callback);
        }
    });
};

//
// Database Migration
//
// The database is outdated if:
//   - creation_date record does not exist in the database
//   - creation_date value is an invalid date
//   - creation_date is older than the hardcoded creationDate value
//
// @param {Object} migratation callbacks
//   - using:     {Function}
//   - completed: {Function}
//
Application.please.migrateDatabase = function(migrate) {
    var isOutdated = function(r) {
        if (!r || !r.creation_date) { return true; }

        var creationDate = new Date(r.creation_date);
        var backupDate   = Application.settings.database.created;
        
        if (!creationDate.getTime()) { return true; }
        if (creationDate.getTime() < backupDate.getTime()) { return true; }

        return false;
    };

    Application.database.get(Const.DB_INFO, function(r) {
        if (isOutdated(r) || Application.settings.database.backup) {
            migrate.using(migrate.completed);
        }
        else {
            migrate.completed();
        }
    });
};

//
// Restore Database from File
//
// @param {Function} callback
//
Application.please.restoreDatabase = function(callback) {
    // This notification is expecting to block the execution thread.
    // The alert provided by PhoneGap-BlackBerry-Widget is a non-blocking alert.
    // So for now, use the built-in alert.
    // navigator.notification.alert(Const.MSG_INSTALL_DB);
    navigator.notification.alert(Const.MSG_INSTALL_DB, function() {
        Application.database.nuke(function() {
            var addTimestamp = function() {
                var today = new Date();
                Application.database.save({ key:Const.DB_INFO, creation_date:today.getTime() }, function() {
                    callback();
                });
            };

            // When backing up the database, we want to nuke the database and add a timestamp,
            // but not restore the existing database.
            if (Application.settings.database.backup) {
                addTimestamp();
            }
            else {
                Application.please.restore(addTimestamp);
            }
        });
    }, Const.TITLE_INSTALL_DB);
}

//
// Write Database to File
//
Application.please.backupDatabase = function(completionCallback) {
    if (!Application.settings.database.backup) {
        completionCallback();
        return;
    };
    
    var callback = {
        success: function(event) { alert('Success: ' + event.target.fileName + ' ' + event.type); completionCallback(); },
        fail:    function(e)     { alert('Failed to write the file: ' + e); completionCallback(); }
    };
    
    if (Application.supports.file.writer) {
        try {
            var file = new FileWriter(Application.settings.database.backupPath, false);
            
            file.onwriteend = callback['success'];
            
            Application.database.all(function(records) {
                file.write(JSON.stringify(records));
            });
        }
        catch(e) {
            callback.fail(e);
        }
    }
    else if (Application.supports.store.backup) {
        window.plugins.store.backup(callback['success'], callback['fail']);
    }
};
