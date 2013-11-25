//
// XmlHttpRequest (XHR)
//
// The XHR does a lot.
//   - Sends XHR request to RNAO server (supports WebKit, BB 4.6, BB 5.0)
//   - Parses the response
//   - Caches the response
//   - Fires a callback
//
// @param url is the fully qualified URL to send a request to
// @param onComplete is a callback function that accepts a JSON object
//
Application.please.xhr = function(url, options) {
    this.extend(options, {
        success:    function(json) { console.log('XHR success consumed.'); },
        fail:       function()     { Application.trigger('network-error', { url:url, options:options }); },
        readCache:  true,
        writeCache: true
    });
    
    var key = this.generateKey(url);
    
    Application.settings.xhr.failureAttempt = 0;
    
    var robustFailure = function() {
        Application.settings.xhr.failureAttempt++;
        console.log('Robust failure activated');
        
        if (Application.settings.xhr.failureAttempt > Const.MAX_XHR_FAILURE) {
            options.fail();
        }
        else {
            prepareXHR();
        }
    };
    
    var prepareXHR = function() {
        Application.reachable(function(reachable) {
            (reachable) ? sendXHR() : robustFailure();
        });
    };
    
    var sendXHR = function() {
        var normalizeResponse = function(response) {
            response = Application.please._normalizeResponse(response, options);
            
            // Cache the final response
            if (options.writeCache) {
                Application.cache.write(key, response, function() { options.success(response); });
            }
            else {
                options.success(response);
            }
        };
        
        Application.please._xhr(url, {
            success: normalizeResponse,
            fail:    robustFailure
        });
    };
    
    // Push the XHR onto a new "thread"
    Application.dispatch(function() {
        Application.cache.find(key, {
            readCache: options.readCache,
            success:   options.success,
            fail:      prepareXHR
        });
    });
};

//
// Private XHR Implementation
//
// @param {DOMString} url to send request
// @param {Object}    options hash
//
Application.please._xhr = function(url, options) {
    this.extend(options, {
        success:    function(json) { console.log('_XHR success consumed.'); },
        fail:       function()     { console.log('_XHR fail consumed.'); },
        readCache:  true,
        writeCache: true
    });
    
    if (Application.supports.network.XHR) {
        navigator.network.XHR(url, null, function(response) {
            if (!response || response['error']) {
                options.fail();
                return;
            }
            
            options.success(response);
        });
    }
    else {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Cache-Control', 'no-cache');
        xhr.setRequestHeader('Content-type',  'text/plain;charset=UTF-8');
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                clearTimeout(xhrTimeout);
                options.success(xhr.responseText);
            }
        };
        xhr.send();
        
        var xhrTimeout = null;
        
        // This is a big issue with BlackBerry 6.
        // The setTimeout fires immediately.
        // However, setTimeout in simple scenarios will work fine.
        // It seems that when the function stack is deep, the setTimeout
        // fails.
        // For now, BlackBerry 6 does not get a timeout.
        //
        if (!navigator.userAgent.match(/blackberry\d*\/6\..*/i)) {
            xhrTimeout = setTimeout(function() {
                xhr.abort();
                options.fail();
            }, Application.settings.xhr.timeout);
        }
    }
};

//
// Normalize the XHR Response
//
// @param {Object} response from the XHR
// @param {Object} options with callbacks
//
Application.please._normalizeResponse = function(response, options) {
    this.extend(options, {
        success: function(json) { console.log('_noramlizeResponse success consumed.'); },
        fail:    function()     { console.log('_normalizeResponse error consumed.'); }
    });
    
    if (!response) {
        options.fail();
        return;
    }
    else if (typeof response === 'string') {
        response = response.replace(/#data/gi, 'data').replace(/#error/gi, 'error');
    }
    else if (response['#data']) {
        response.data  = response['#data'];
        response.error = response['#error'];
        delete response['#data'];
        delete response['#error'];
    }
    
    // Convert the response to a JSON object (if it is not already)
    //
    if (typeof response === 'string') {
        response = eval('(' + response + ')');
    }
    
    if (typeof response !== 'object') {
        options.fail();
        return;
    }
    
    // Replace all relative <a href> and <img src> with absolute URLs
    //
    if (response.data && response.data.body) {
        response.data.body = response.data.body.replace(
            /\<\ *(a|img)[^\>]*(href|src)\ *=\ *['"]([^\"\'\ >]*)['"][^\>]*\>/gi,
            function(tag, tagName, tagType, tagURL) {
                return tag.replace(tagURL, Application.please.generateAbsoluteURL(tagURL));
            }
        );
    }
    
    return response;
};