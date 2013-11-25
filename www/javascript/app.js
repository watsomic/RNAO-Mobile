//
// Preload the loading screen image.
// This is required for slower BlackBerry devices
// So that the image will immediately appear when
// referenced by CSS
//
(function() {
    var image    = new Image();
    image.onload = function () { delete image; };
    image.src    = 'style/loading_foreground.png';
})();

//
// DOM Loaded
//
// @param e is the event object from the 'load' event
//
Application.on('init', function(e) {
    Application.trigger('splashScreen', {});
});

//
// PhoneGap Ready
//
// @param e is the event object from the deviceready event
//
Application.on('ready', function(e) {
    var imageList = [
        'style/bg_black.png',
        'style/icon_arrow.png',
        'style/loader/default.gif',
        'style/loader/small.gif',
        'style/loader/white.gif',
        'style/loader/grey.gif',
        'style/sprites.png'
    ];
    
    Application.please.preloadImages(imageList, function() {
        Application.please.loadSettings();
        Application.please.detectFeatures();
        Application.please.createDatabase(function() {
            Application.trigger('home', { skipLoading: true });
        });
    });
});

//
// SPLASH SCREEN
//
Application.on('splashScreen', {
    action: function(data, template) {
        template(data);
    },
    
    template: function(data) {
        return {};
    },
    
    selectors: {
        '#wrapper': function($element) {
            // Previously screen.height (blackberry). Add conditional if BlackBerry does not
            // work with window.innerHeight (supported by iOS and Android)
            x$('#splashScreen').setStyle('height', window.innerHeight + 'px');
        }
    }
});

//
// HOME
//
Application.on('home', {
    action: function(data, template) {
        Application.isClickable(false);
        
        // Skip showing the loading indicator.
        // Useful when the application is first launched
        if (data && !data.skipLoading) {
            Application.trigger('loading', { title: 'Home' });
        }
        
        Application.please.xhr(Const.DOMAIN + Const.URL_HOME, {
            success: function(json) {
                template(json.data);
            }
        });
    },
    
    template: function(data) {
        var template = {
            last_label: '',
            
            items: data,

            header: function() {
                return this[Const.TERM_DATA_NAME];
            },

            has_label: function() {
                return (template.last_label !== template.header.call(this)[0]);
            },

            label_title: function() {
                var title = template.header.call(this)[0];

                template.last_label = title;
                return title
            }
        };
        
        return template;
    },
    
    selectors: {
        '#wrapper': function($element) {
            $element.removeClass('double');
            
            Application.isClickable(true);
            
            // Lazy way to hide the screen everytime the home page is shown
            if (Application.supports.splashScreen.hide) {
                window.plugins.splashScreen.hide();
            }
        },
        
        '.ellipsis': function($element) {
            $element.each(function(element) {
                Application.please.ellipsis(element);
            });
        }
    }
});

//
// LIST
//
Application.on('list', {
    action: function(data, template) {
        Application.isClickable(false);
        
        Application.trigger('loading', { title: data.header });
        
        Application.please.xhr(Const.DOMAIN + Const.URL_VIEW2 + data.tid, {
            success: function(json) {
                json.data.current_title = data.header;
                json.data.current_id    = data.tid;
                template(json.data);
            }
        });
    },
    
    template: function(data) {
        var template = {
            last_label: '',
            
            items: data,
            
            current_id: data.current_id,

            header: function() {
                return this.node_title;
            },

            has_label: function() {
                return (template.last_label !== this[Const.TERM_DATA_NAME]);
            },

            label_title: function() {
                var title = this[Const.TERM_DATA_NAME]

                template.last_label = title;
                return title
            },
            
            current_title: data.current_title
        };
        
        return template;
    },
    
    selectors: {
        '#wrapper': function($element) {
            $element.addClass('double');
            Application.isClickable(true);
        },

        '.ellipsis': function($element) {
            $element.each(function(element) {
                Application.please.ellipsis(element);
            });
        }
    }
});

//
// PAGE
//
Application.on('page', {
    action: function(data, template) {
        Application.isClickable(false);
        
        Application.trigger('loading', { title: data.header });
        
        Application.please.xhr(Const.DOMAIN + Const.URL_PAGE + data.nid, {
            success: function(json) {
                json.data.current_title = data.header;
                json.data.current_id    = data.nid;
                
                for (var key in json.data.taxonomy) {
                    var tax = json.data.taxonomy[key];
                    if (tax['vid'] === '1') {
                        json.data.tax = tax;
                        break;
                    }
                }
                
                template(json.data);
            }
        });
    },
    
    template: function(data) {
        var template = {
            tax: {
                id: data.tax.tid.toString(),
                
                full_name: data.tax.name,
                
                short_name: function() {
                    return data.tax.name;
                }
            },
            
            current_title: data.current_title,
            
            current_id: data.current_id,
            
            parent_id: data.tax.tid,
            
            content: data.body
        };
        
        return template;
    },
    
    selectors: {
        '#wrapper': function($element) {
            $element.addClass('double');
            Application.isClickable(true);
        },
        
        '.ellipsis': function($element) {
            $element.each(function(element) {
                Application.please.ellipsis(element);
            });
        }
    }
});

//
// NAVIGATE LEFT or RIGHT
//
Application.on('next', {
    action: function(data, complete) {
        var left = (data.direction === 'left');
        var type = (data.tid) ? 'tid' : 'nid';
        var id   = data[type];
        var url  = Const.DOMAIN + ( (data.parentid) ? Const.URL_VIEW2 + data.parentid : Const.URL_HOME );
        
        Application.isClickable(false);;
        Application.please.xhr(url, {
            success: function(json) {
                for (var i = 0; i < json.data.length; i++) {
                    if (json.data[i][type] === id) {
                        var request = {};
                        var index = 0;
                    
                        if (i <= 0 && left) {
                            index = json.data.length - 1;
                        }
                        else if (i >= json.data.length - 1 && !left) {
                            index = 0;
                        }
                        else {
                            index = i + (left ? -1 : 1);
                        }
                
                        var request    = json.data[index];
                        request.header = request.node_title || request[Const.TERM_DATA_NAME];
                    
                        var target = (data.tid) ? 'list' : 'page';
                        Application.trigger(target, request);
                        complete();
                    
                        break;
                    }
                }
            }
        });
    }
});

//
// UPDATE
//
Application.on('update', {
    action: function(data, template) {
        // Short-circuit if there is no database
        if (!Application.database) {
            navigator.notification.alert(Const.MSG_SYNC_NO_DATABASE, function() {}, Const.TITLE_SYNC_NO_DATABASE);
            x$('.selected').removeClass('selected');    // @TODO reword Application object to handle this better
            return;
        }
        
        Application.reachable(function(reachable) {
            if (reachable) {
                Application.update.start();
                template();
            }
            else {
                navigator.notification.alert(Const.MSG_CANNOT_UPDATE, function() {}, Const.TITLE_CANNOT_UPDATE);
                x$('.selected').removeClass('selected');    // @TODO reword Application object to handle this better
            }
        });
    },
    
    template: function(data) {
        return {};
    },
    
    selectors: {
        '#progress-modal': function($element) {
        },
        '.selected': function($element) {
            $element.removeClass('selected');
        }
    }
});

//
// UPDATE THE PROGRESS
//
Application.on('update-progress', function(data) {
    if (!x$('#update')[0]) { return; }
    // if (Application.is('blackberry4')) { return; }
    
    if (data.percentage) {
        var percentInt = data.percentage;

        if (percentInt > 100) percentInt = 100;
        if (percentInt < 0)   percentInt = 0;

        var str = percentInt.toString() + '%';
        x$('.progress-status').html(str);
        x$('.progress-bar').setStyle('width', str);
    }
    
    if (data.status) {
        x$('#progress_message').html(data.status);
    }
});

//
// CLOSE THE PROGRESS
//
Application.on('update-close', function(data) {
    Application.update.stop();
    
    if (x$('#update')[0]) {
        x$('#update').remove();
    }
});

//
// FONT SCALE
//
Application.on('fontScale', function(e) {
    Application.settings.fontSizeIndex++;
    
    if (Application.settings.fontSizeIndex >= Const.FONT_SIZES.length)
        Application.settings.fontSizeIndex = 0;
    
    var fontSize = Const.FONT_SIZES[Application.settings.fontSizeIndex].toString() + 'px';
    
    document.body.style.fontSize = fontSize;
    
    // Android uses the selected state to indicate that the button was pressed.
    // Since font resizing is instant, we can add a slight delay to the removal
    // of '.selected' to animate the button.
    setTimeout(function() { x$('.selected').removeClass('selected'); }, 300);
});

//
// OPEN SEARCH
//
Application.on('search', {
    action: function(data, template) {
        template(null);
    },
    
    template: function(data) {
        return {};
    },
    
    selectors: {
        '#search-input': function($element) {
            $element[0].focus();
            $element[0].onkeypress = function(e) {
                // Carriage Return (iPhone) || Linefeed (iPod)
                if (e.keyCode === 13 || e.keyCode === 10) {
                    Application.trigger('searchResults');
                }
            }
        }
    }
});

//
// CLOSE SEARCH
//
Application.on('closeSearch', function(e) {
    x$('#search').remove();
});

//
// SEARCH QUERY
//
Application.on('searchResults', {
    action: function(data, template) {
        var query = x$('#search-input')[0].value;
        Application.trigger('searchLoader', { query: query });

        query     = encodeURIComponent(query);
        var url   = Const.DOMAIN + Const.URL_SEARCH + query;

        Application.please.xhr(url, {
            readCache:  false,
            writeCache: false,
            
            success: function(json) {
                template(json);
            },
            
            fail: function() {
                Application.please.searchOffline(query, template);
            }
        });
    },
    
    template: function(json) {
        // Switch things around if no results were found
        if (json.error) {
            json.error = { message: json.data };
            json.data  = '';
        }
        
        return {
            target: 'result',
            
            error: json.error,
            
            results: json.data,
            
            nid: function() { return this.node; }
        };
    },
    
    selectors: {
        '#search-input': function($element) {
            $element[0].blur();
        },
        '#bt-start-search': function($element) {
            $element.removeClass('selected');
        }
    }
});

//
// LOADING SEARCH RESULTS
//
Application.on('searchLoader', {
    action: function(data, template) {
        template(data)
    },
    
    template: function(json) {
        return {
            target: 'result',
            query:  json.query
        };
    }
});

//
// NETWORK DIALOG
//
Application.on('network-error', {
    action: function(data, template) {
        Application.isClickable(true);
        template(data);
    },
    
    template: function(json) {
        return {};
    },
    
    selectors: {
        '#bt-retry': function($element) {
            var self = this;
            $element.click(function(e) {
                Application.please.xhr(self.url, self.options);
                x$('#network-error').remove();
            });
        },
        
        '#bt-retry-close': function($element) {
            $element.click(function(e) {
                x$('#network-error').remove();
            });
        }
    }
});

//
// LOADING
//
// Helps provide some loading feedback for legacy devices.
//   - BlackBerry 4.6.x cannot animate GIFs referenced by CSS
//   - BlackBerry 5.x cannot dynamically update background-image
//
Application.on('loading', {
    action: function(data, template) {
        if (Application.is('blackberry4') || Application.is('blackberry5')) {
            data = data || {}
            template(data);
        }
        else {
            delete this;
        }
    },
    
    template: function(data) {
        return { title: function() { return data.title || ''; } };
    },
    
    selectors: {
        '.ellipsis': function($element) {
            $element.each(function(element) {
                Application.please.ellipsis(element);
            });
        }
    }
});
