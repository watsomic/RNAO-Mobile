(function(scope) {
    
    scope.Application = {
        stageName: 'wrapper',
        
        actions:  [ 'action', 'template', 'render', 'selectors' ],
        
        clickable:  true,
        
        events:   {},
        please:   {},
        settings: {},
        device:   '',
        currentRenderedView: "home",
        
        //
        // Initialize the application.
        // This should be called once to get things up and running
        //
        init: function() {
            var self = this;
            this.reset();
            
            // Helper method for click/touch handlers
            //
            var findAnchorElement = function(element) {
                // BlackBerry 4.6 likes to fire events off of the text inside an anchor.
                // So, we will walk up the DOM tree to see if any parent is an anchor.
                while (!element.href && element.parentNode) { element = element.parentNode; }
                return element;
            };
            
            x$('body').tap(function(e) {
                // Leave if the UI is not clickable
                if (!Application.clickable) return false;
                
                var element = findAnchorElement(e.target);
                var href    = null;
                var hash    = null;
                
                if (element && element.href) {
                    href = element.href;
                    hash = element.href.match(/#.*$/);
                }
                
                // - Fire event if <a> contained a hash
                // - Open browser if network connection available
                //
                if (hash) {
                    // @blackberry4 workaround for render issues that display a white
                    // block that proportional in height to the amount scrolled vertically.
                    if (!Application.is('blackberry4')) {
                        x$(element).addClass('selected');
                    }
                    
                    hash = hash[0].replace('#', '');
                    if (hash !== '') {
                        if (Application.events[hash]) {
                            Application.trigger(hash, element);
                        }
                        else if (Application.is('android') || Application.is('blackberry4')) {
                            document.location.hash = '#' + hash;
                        }
                        else {
                            var $element = x$('a[name='+hash+']');
                            $element     = ($element.length > 0) ? $element : x$('#' + hash);
                            
                            if ($element.length > 0) { $element[0].scrollIntoView(true); }
                        }
                    }
                }
                
                return false;
            });
            
            // Handle external links
            // In order to prevent an external link from opening the browser,
            // we must `return false;` on a click event. Touch does not work.
            //
            x$('body').on('click', function(e) {
                // Leave if the UI is not clickable
                if (!Application.clickable) return this;
                
                var element = findAnchorElement(e.target);
                var href    = null;
                var hash    = null;
                
                if (element && element.href) {
                    href = element.href;
                    hash = element.href.match(/#.*$/);
                }
                
                // - Fire event if <a> contained a URL
                // - Open browser if network connection available
                //
                if (!hash && href) {
                    // Reachability used to enable or disable the external link
                    Application.reachable(function(reachable) {
                        if (reachable) {
                            if (Application.supports.browser.widget) {
                                blackberry.invoke.invoke(
                                    blackberry.invoke.APP_BROWSER,
                                    new blackberry.invoke.BrowserArguments(href));
                            }
                            else if (Application.supports.browser.android) {
                                window.android.loadExternalUrl(href);
                            }
                            else {
                                document.location = href;
                            }
                        }
                        else {
                            navigator.notification.alert(Const.MSG_CANNOT_OPEN_PAGE,
                                                         function() {},
                                                         Const.MSG_CANNOT_OPEN_PAGE_TITLE);
                        }
                    });
                }
                
                return false;
            });
            
            // Resize the viewport if the orientation changes
            // Useful for the BlackBerry, because it's min viewport is smaller than the...well..viewport
            if (window.onorientationchange) { window.onorientationchange = this.updateSize; }

            if (Application.is('android')) {
                // Bind hardware search button to toggle search modal
                KeyEvent.prototype.searchTrigger = function() {
                    if (x$('#search-input').length > 0) {
                        Application.trigger('closeSearch', null);
                    }
                    else {
                        Application.trigger('search', null);
                    }
                }

                // Bind hardware back button
                window.BackButton.override();
                KeyEvent.prototype.backTrigger = function() {
                    if (scope.Application.currentRenderedView=="list")
                        Application.trigger('home', null);
                    else if (scope.Application.currentRenderedView=="page")
                        Application.trigger('list', x$('#blist')[0]);
                    else
                        window.android.finish();
                }
            }
        },
        
        //
        // Clears all states of the application.
        //
        reset: function() {
            this.events = {};
            this.please = {};
            this.device = this.findDevice();
            
            var $stage = x$(document.createElement('div')).attr('id', this.stageName);
            document.body.appendChild($stage[0]);
            
            x$('body').attr('id', this.device);
            
            this.updateSize();
        },
        
        //
        // Update Stage Height
        //
        updateSize: function() {
            // Previously screen.height (blackberry). Add conditional if BlackBerry does not
            // work with window.innerHeight (supported by iOS and Android)
            x$('html').setStyle('height', this.height() + 'px');
            x$('body').setStyle('height', this.height() + 'px');
            x$('#' + this.stageName).setStyle('height', this.height() + 'px');
        },
        
        //
        // Like binding an event.
        //
        // @param {DOMString} name of the event.
        // @param {Object}    actions to run when event is triggered.
        //
        on: function(name, actions) {
            var self = this;
            this.events[name] = actions;
            
            // Some event sugar
            //
            switch(name) {
                case 'init':
                    // Use 'load' instead of 'DOMContentLoaded' to support BlackBerry 4.6
                    window.addEventListener('load', function(e) {
                        self.trigger('init', e);
                    }, false);
                    break;
                case 'ready':
                    document.addEventListener('deviceready', function(e) {
                        self.trigger('ready', e);
                    }, false);
                    break;
            };
            
            return this;
        },
        
        //
        // Fire an event that was binded in 'on'
        //
        // @param {DOMString} name of the event to fire
        // @param {Object}    data to be passed to the event
        //
        trigger: function(name, data) {
            var that = this;
            
            if (!that.events[name]) {
                return that.render(name, data);
            }
            
            // If HTMLElement, use attributes as the data
            if (data && data.nodeName) {
                var attr = {};
                for (var i = 0; i < data.attributes.length; i++) {
                    attr[data.attributes[i].name] = data.attributes[i].value;
                }
                data = attr;
            }
            
            // Get event and a copy of the list of actions
            var event   = that.events[name];
            var actions = that.actions.slice(0);
            
            if (typeof event === 'function') {
                event.call(event, data);
            }
            else {
                that._runActions(name, event, actions, data, data);
            }
            
            return this;
        },
        
        //
        // Clickable UI
        //
        // @param {Boolean} clickable if the UI can be selected
        //
        isClickable: function(clickable) {
            this.clickable = clickable;
        },
        
        //
        // Run the actions of an event
        //
        // @param {DOMString} name of the event
        // @param {Object}    event containing the actions to run
        // @param {Array}     actions remaining to run
        // @param {Object}    originalData provided by trigger call
        // @param {data}      data returned by previous action
        //
        _runActions: function(name, event, actions, originalData, data) {
            var action = actions.shift();
            var self   = this;
            
            if (action === 'action') {
                if (!event.action) { return this; }
                event.action.call(event, data, function(data) {
                    self.dispatch(function() {
                        self._runActions(name, event, actions, originalData, data);
                    });
                });
            }
            else if (action === 'template') {
                if (!event.template) { return this; }
                var template = event.template.call(event, data);
                self._runActions(name, event, actions, originalData, template);
            }
            else if (action === 'render') {
                var $element = this.render(name, data);
                self._runActions(name, event, actions, originalData, $element);
            }
            else if (action === 'selectors') {
                for(var key in event.selectors) {
                    if (event.selectors.hasOwnProperty(key)) {
                        var fn = event.selectors[key];

                        fn.call(originalData, x$(key));
                    }
                }
            }
            
            return this;
        },
        
        //
        // Render the template data using whatever template system you want
        //
        // @param {DOMString} name of the template to use
        // @param {Object}    data that describes the view
        //
        render: function(name, data) {
            var $template = x$('#' + name + '-template');
            var data      = data || {};
            var $element  = null;
            var html      = Mustache.to_html($template.html(), data);
			var that = this;

            if ($template.hasClass('view')) {
                $element = x$('#' + this.stageName);
                $element.html(html);
                
				that.currentRenderedView = name;

                // Hide any modal elements because we're changing views
                x$('body > div.modal').remove();
                
                // A setTimeout is required for the BlackBerry 6 to properly render
                // the next view. Normally, it cuts off the header.
                if (Application.supports.browser.widget)
                    Application.dispatch(function() { window.scrollTo(0, 0); });
                else
                    window.scrollTo(0, 0);
            }
            else if ($template.hasClass('modal')) {
                $element = x$(document.createElement('div')).attr('id', name).addClass('modal');
                $element.setStyle('height', this.height() + 'px');
                $element.html(html);
                
                // Append modal to the body, so it remains between view transitions
                x$('body')[0].appendChild($element[0]);
                x$('#' + this.stageName + ' .selected').removeClass('selected');
                
                // See comment in above block.
                if (Application.supports.browser.widget)
                    Application.dispatch(function() { window.scrollTo(0, 0); });
                else
                    window.scrollTo(0, 0);
            }
            else if ($template.hasClass('partial')) {
                $element = x$('#' + data.target);
                $element.html(html);
            }
            else {
                console.log('Template: unknown class');
            }
            
            return $element;
        },
        
        //
        // Device Check
        //
        // @param  {DOMString} name is the name to check against.
        // @return {Boolean}
        // @see    findDevice
        //
        is: function(name) {
            return (name === this.device);
        },
        
        //
        // Find the current device
        //
        // @return {{DomString}} 'blackberry', 'desktop', or 'ios'
        //
        findDevice: function() {
            var userAgent = navigator.userAgent;

            if (userAgent.match(/browzr/i))               return 'blackberry4';
            if (userAgent.match(/blackberry\d*\/4\..*/i)) return 'blackberry4';
            if (userAgent.match(/blackberry\d*\/5\..*/i)) return 'blackberry5';
            if (userAgent.match(/android/i))              return 'android';
            if (userAgent.match(/blackberry\d*\/6\..*/i)) return 'webkit';
            if (userAgent.match(/webkit/i))               return 'webkit';

            return 'desktop';
        },
        
        //
        // Simple Reachability
        //
        // @param {Function} callback function
        //
        reachable: function(callback) {
            navigator.network.isReachable(Const.DOMAIN, function(reachability) {
                // PhoneGap-BlackBerry-Widget returns a string instead of a number
                // Must be done because I feel safer using === than implicitly
                // inferring the value using the == operator.
                reachability = (typeof reachability === 'number') ? reachability : parseInt(reachability);
                callback( (reachability !== NetworkStatus.NOT_REACHABLE) );
            });
        },

        //
        // Dispatch a function asynchronously
        //
        // This will push the process onto a new
        // execution stack and allocate a new memory
        // heap. This is very useful for BlackBerry5,
        // which runs into memory issues on deep
        // callback stacks. It is important to understand
        // that dispatch will only fire after the current
        // execution thread ends.
        //
        // @param {Function} function to dispatch. Accepts no args.
        //
        dispatch: function(fn) {
            setTimeout(fn, 10);
        },
        
        //
        // Get the document height
        //
        // This is the entire height of the body element
        //
        // @return {Number} pixel height of the document
        //
        height: function() {
            // Finding the maximum height of the document is different for each platform.
            //
            // BlackBerry 5:
            //  - window.innerHeight
            //  - document.body.scrollHeight
            //  - document.documentElement.scrollHeight
            //
            // BlackBerry 6:
            //  - document.body.scrollHeight
            //  - document.documentElement.scrollHeight
            //
            // Add new platform, try:
            // alert(document.body.clientHeight);
            // alert(document.documentElement.clientHeight);
            // alert(document.body.offsetHeight);
            // alert(document.documentElement.offsetHeight);
            // alert(document.body.scrollHeight);
            // alert(document.documentElement.scrollHeight);
            // alert(screen.height);
            // alert(window.innerHeight);
            // var stage = x$('#' + this.stageName)[0];
            // alert(stage.clientHeight);
            // alert(stage.offsetHeight);
            
            return document.body.scrollHeight || window.innerHeight;
        }
    };
    
    scope.Application.init.call(Application);
    
    // Stub out the console log if it is not defined
    if (typeof console === 'undefined') {
        window.console = {
            log: function(str) {}
        };
    }
    
})(window);
