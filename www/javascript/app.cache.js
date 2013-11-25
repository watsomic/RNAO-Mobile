Application.cache = Application.cache || {};

//
// Find in cache
//
// @param {DOMString} key to look up
// @param {Object}    options object
//
Application.cache.find = function(key, options) {
    Application.please.extend(options, {
        readCache: true,
        success:   function(json) { console.log('Consumed cache find success.'); },
        fail:      function()     { console.log('Consumed cache find fail.'); }
    });
    
    if (!Application.database || !options.readCache) {
        options.fail();
        return;
    }
    
    Application.database.get(key, function(r) {
        if (!r) {
            options.fail();
            return;
        }
        
        // For an unknown reason, the final element of the data array is
        // a mysterious JavaScript function. This only happens on the BlackBerry.
        // Since the length of the data is widely used, we just remove the function
        // element - if it exists.
        if (Application.is('blackberry4')) {
            var data = r['data'] || r['#data'];
            if (typeof data[data.length - 1] === 'function') {
                data.pop();
            }
        }

        options.success(r.data);
    });    
};

//
// Cache the JSON response and embedded images.
//
// @param {String}   key for the database
// @param {Object}   response to write to the database
// @param {Function} callback to fire when done
//
Application.cache.write = function(key, response, callback) {
    var saveCache = function() {
        // Push Lawnchair write onto a new execution stack.
        // This solves a problem on BlackBerry 5 where variables cannot
        // be instantiated (e.g. mustache would fault on an undefined object).
        Application.dispatch(function() {
            (Application.database) ? Application.database.save({key:key, data:response}, callback) : callback();
        });
    };
    
    // Skip caching if unsupported
    if (!Application.supports.urlCacheManager.getCachedImage) { return saveCache(); }
    
    // Only cache images for response with a body property
    //
    if (response.data && response.data.body) {
        
        var imageCache = {
            'uri':           {},    // uri[<remote URL>] = <local URI>
            'requestCount':  0,
            'responseCount': 0
        };
        
        var cacheImage = function(url, attempt) {
            window.plugins.urlCacheManager.getCachedImage(
                // remote image URL to retrieve
                url,

                // onSuccess callback
                function(remoteURL, localURI) {
                    imageCache.uri[remoteURL] = localURI;
                    imageCache.responseCount++;
                },

                // onError callback
                function(remoteURL, errorMessage) {
                    if (attempt < Const.MAX_XHR_FAILURE) {
                        cacheImage(url, ++attempt);
                    }
                    else {
                        // navigator.notification.alert('Could not cache ' + remoteURL + ':' + errorMessage);

                        imageCache.uri[remoteURL] = remoteURL;
                        imageCache.responseCount++;
                    }
                }
            );
        };
        
        // Find all images that need to be cached
        // and send an image cache request
        //
        response.data.body.replace(
            // RegEx to find each img tag and address as a param
            /\<\ *img[^\>]*src\ *=\ *['"]([^\"\'\ >]*)['"][^\>]*>/ig,
            
            // Send a cache request for each image URL
            //
            // @param {String} imageTag is the entire <img .... /> tag
            // @param {String} imageURL is the src attribute value. It is an absolute
            //                          URL because XHR sets all <a> and <img> to absolute.
            //
            function(imageTag, imageURL) {
                imageCache.requestCount++;
                cacheImage(imageURL, 0);
        
               return imageTag;
            }
        );
        
        // Wait until all of the images are retrieved
        // and replace all remote urls with local urls.
        //
        var intervalID = setInterval(
            function() {
                if (imageCache.responseCount < imageCache.requestCount) return;
                
                clearInterval(intervalID);
                
                // Replace URLs
                response.data.body = response.data.body.replace(
                    // RegEx to find each img tag and address as a param
                    /\<\ *img[^\>]*src\ *=\ *['"]([^\"\'\ >]*)['"][^\>]*>/ig,
                    
                    // Replace each image's remote URL with a localURI
                    //
                    // @param {String} imageTag is the entire <img .... /> tag
                    // @param {String} imageURL is the src attribute value. It is an absolute
                    //                          URL because XHR sets all <a> and <img> to absolute.
                    //
                    function(imageTag, imageURL) {
                        var localURI = imageCache.uri[imageURL];
                        
                        // Workaround for the URLCache Plugin.
                        if (typeof(localURI) === 'object') { localURI = localURI['url']; }
                        
                        imageTag = imageTag.replace(imageURL, localURI);
                        
                        return imageTag;
                    }
                );
                
                saveCache();
            },
            300
        );
    }
    else {
        saveCache();
    }
};