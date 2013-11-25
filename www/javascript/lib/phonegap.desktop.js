x$(window).on('load', function() {
    setTimeout(function() {
        console.log('fire deviceready');
        x$(document).fire('deviceready');
    }, 10);
});

navigator.notification = {
    alert: function(message, callback, title) {
        alert(message);
        callback();
    }
}
window.plugins = {
    splashScreen: {
        hide: function() {
            console.log('window.plugins.splashScreen.hide();');
        }
    },
    
    urlCacheManager: {
        getCachedImage: function(url, success, error) {
            success(url, url);
        }
    },
    
    updater: {
        updateNodes: function(keys, onSuccess, onFail) {
            onSuccess();
        }
    }
};

debug = {
    log: function(string) {
        console.log(string);
    }
}

NetworkStatus = {
    NOT_REACHABLE: 0,
    REACHABLE_VIA_CARRIER_DATA_NETWORK: 1,
    REACHABLE_VIA_WIFI_NETWORK: 2
};

navigator.network = {
    isReachable: function(domain, callback) {
        callback(NetworkStatus.REACHABLE_VIA_WIFI_NETWORK);
    }
};

if (typeof console === 'undefined') {
    console = {
        log: function(string) {}
    };
}