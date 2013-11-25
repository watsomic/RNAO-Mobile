if ( navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i) ) {
    // iOS will run the update with the web app
}
else if ( navigator.userAgent.match(/browzr/i) ) {
    
    var StorePlugin = function() {
    };
    
    // StorePlugin.prototype.getKeys = function(onSuccess, onError) {                
    //     return PhoneGap.execAsync(onSuccess, onError, 'ca.rnao.bpg.plugins.Store', 'getKeys', []);
    // };
    
    // StorePlugin.prototype.all = function(onSuccess, onError) {                
    //     return PhoneGap.execAsync(onSuccess, onError, 'ca.rnao.bpg.plugins.Store', 'all', []);
    // };

    StorePlugin.prototype.backup = function(onSuccess, onError) {                
        return PhoneGap.execAsync(onSuccess, onError, 'ca.rnao.bpg.plugins.Store', 'backup', []);
    };
    
    StorePlugin.prototype.restore = function(onSuccess, onError) {
        return PhoneGap.execAsync(onSuccess, onError, 'ca.rnao.bpg.plugins.Store', 'restore', []);
    };
    
    StorePlugin.prototype.search = function(query, callback) {
        var onError = function() {};
        return PhoneGap.execAsync(callback, onError, 'ca.rnao.bpg.plugins.Store', 'search', [query]);
    };
    
    PhoneGap.addPlugin('store', new StorePlugin());
}
