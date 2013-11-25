//
// Settings
//
Application.please.loadSettings = function() {
    var lawnchairAdaptor = {
        'webkit':      'webkit',
        'blackberry4': 'blackberry',
        'blackberry5': 'gears',
		'android': 	   'webkit'
    };
    
    Application.settings = {
        fontSizeIndex: 0,
        
        database: {
            backup:     false,
            backupPath: Application.please.getStoragePath() + 'database.json',
            table:      'offline',
            name:       'rnao',
            adaptor:    lawnchairAdaptor[Application.device],
            max:        Application.is('android') ? 50 * 1024 * 1024 : 1024 * 6, // Strange Android issue (use DroidGap::MAX_QUOTA)
            created:    new Date(1302210124870)                                  // April 7, 2010 @ 2:02pm
        },
        
        xhr: {
            timeout: Const.IPHONE.NETWORK_TIMEOUT_DURATION
        }
    };
};

//
// Detect Browser Features
//
Application.please.detectFeatures = function() {
    var e = document.createElement('a');
    
    Application.supports = {
        browser: {
            widget:  !!(typeof blackberry !== 'undefined' && blackberry.invoke && blackberry.invoke.BrowserArguments),
            android: !!(typeof android !== 'undefined' && android.loadExternalUrl)
        },
        
		database: {
			sqliteGears:  (Application.settings.database.adaptor === 'gears'),
			sqliteWebkit: (Application.settings.database.adaptor === 'webkit'),
			sqlite:       (Application.settings.database.adaptor === 'webkit' || Application.settings.database.adaptor === 'gears')
		},
		
        ellipsis: (typeof e.style.textOverflow !== 'undefined'),
        
        splashScreen: {
            hide: !!(window.plugins && window.plugins.splashScreen && window.plugins.splashScreen.hide)
        },
        
        network: {
            // BlackBerry defines XMLHttpRequest, so we cannot check for it
            XHR: !!(navigator.network && navigator.network.XHR)
        },
        
        event: {
            orientationChange: (window && window.orientationchange !== 'undefined')
        },
        
        file: {
            reader: (typeof FileReader !== 'undefined'),
            writer: (typeof FileWriter !== 'undefined')
        },
        
        store: {
            backup:  !!(window.plugins && window.plugins.store && window.plugins.store.backup),
            restore: !!(window.plugins && window.plugins.store && window.plugins.store.restore),
            search:  !!(window.plugins && window.plugins.store && window.plugins.store.search)
        },
        
        update: {
            findExpired: !!(window.plugins && window.plugins.update && window.plugins.update.findExpired)
        },
        
        urlCacheManager: {
            getCachedImage: !!(window.plugins && window.plugins.urlCacheManager && window.plugins.urlCacheManager.getCachedImage)
        }
    };
    
    delete e;
}

//
// Preload Images
//
// The images are preloaded into the DOM and then removed.
//
// @param {DOMString} imgSources is an array of image URLs to preload
//
Application.please.preloadImages = function(imgSources, callback) {
    var img = null;
    
    var preloadNextImage = function() {
        if (img !== null) delete img;
        if (imgSources.length <= 0) { Application.dispatch(callback); return; }
        
        img        = new Image();
        img.onload = preloadNextImage;
        img.src    = imgSources.pop();
    }
    
    preloadNextImage();
};

//
// Ellipsis Support
//
// @param  {DOMElement} DOM element to apply ellipsis to
//
Application.please.ellipsis = function(element) {
    if (Application.supports.ellipsis) return;
    
    var $element = x$(element);
    var length   = 0;
    
    if ($element.attr('id')[0] === 'title') {
        length = Const.ELLIPSIS_TITLE;
    }
    else if ($element.hasClass('label')) {
        length = Const.ELLIPSIS_LABEL;
    }
    else if ($element.attr('id')[0] === 'loading-title') {
        length = Const.ELLIPSIS_LOADING;
    }
    else {
        length = Const.ELLIPSIS_BREAD;
    }

    var string = element.innerHTML;
    
    if (element.innerHTML.length > length) {
        element.innerHTML = element.innerHTML.substring(0, length) + '...';
    }
};

//
// Generate Database Key from URL
//
// Remove from URL beginning: http://  www.
// Remove from URL end: / => e.g. helloworld.com/
//                      & => e.g. helloworld.com/name=nitobi&location=Vancouver&
//
// @param  {DOMString} url to generate key
// @return {DOMString} normalized database key
//
Application.please.generateKey = function(url) {
    return url.replace(/^http:\/\//, '').replace(/^www./, '').replace(/[\/&]$/, '');
};

//
// Construct the fully qualified domain.
// 
// @param  {DOMString} url The absolute or relative URL
// @return {DOMString} Absolute URL
//
Application.please.generateAbsoluteURL = function(url) {
    if (url.search(/^http:\/\//) >= 0 || url.search(/^www./) >= 0 || url[0] === '#') {
        return url;
    }
    else {
        return Const.DOMAIN + '/' + url.replace(/^\//, '');
    }
};

//
// Extend an object
//
// @param {Object} obj to extend
// @param {Object} defaults to extend obj with
//
Application.please.extend = function(obj, defaults) {
    for (var key in defaults) {
        if (typeof obj[key] === 'undefined') {
            obj[key] = defaults[key];
        }
    }
};

//
// Get Path to App Storage
//
Application.please.getStoragePath = function() {
    var storagePath = '';

    if (typeof navigator !== 'undefined' && navigator.fileMgr) {
        var rootPaths = navigator.fileMgr.getRootPaths();
        
        for (var i = 0; i < rootPaths.length; i++) {
            // iOS workaround. For some reason it returns an invalid path on the simulator.
            if (rootPaths[i].match(/document/i)) {
                storagePath = './../Documents/';
                break;
            }
            // BlackBerry / Android
            else if (rootPaths[i].match(/sdcard/i)) {
                storagePath = rootPaths[i];
                break;
            }
        }
    }
    
    return storagePath;
};