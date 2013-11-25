xui.extend({
    tap: function(callback, options) {
        var android  = navigator.userAgent.match(/android/i);
        var defaults = {
            activeClass:   'active',
            selectedClass: 'selected',
            threshold:     (android) ? { x: 15, y: 15 } : { x: 5, y: 5 },
            timeout:       35,
        };
        
        options = (typeof options === 'undefined') ? {} : options;
        
        for (var key in defaults)
            if (typeof options[key] === 'undefined') options[key] = defaults[key];
        
        // Touch support detection
        try {
            // Slow Android devices running OS 2.x have a lot of trouble with touchmove
            if (android) {
                options.type = { start:'touchstart', move:null, end:'touchend' };
            }
            else {
                document.createEvent('TouchEvent');
                options.type = { start:'touchstart', move:'touchmove', end:'touchend' };
            }
        }
        catch(e) {
            options.type = { start:'mousedown', move:'mousemove', end:'mouseup' };
        }
        
        // Helper method for click/touch handlers
        var findAnchorElement = function(element) {
            // BlackBerry 4.6 likes to fire events off of the text inside an anchor.
            // So, we will walk up the DOM tree to see if any parent is an anchor.
            while (!element.href && element.parentNode) { element = element.parentNode; }
            return element;
        };
        
        return this.each(function() {
            var $element = x$(this);
            var touch    = {
                start:   {},
                end:     {},
                delta:   {},
                timeout: null
            };
            
            var updateTouchDelta = function(e) {
                if (typeof touch.start.x === 'undefined') return false;
                
                if (typeof e.changedTouches !== 'undefined' && e.changedTouches.length > 0) {
                    touch.end.x = e.changedTouches[0].pageX;
                    touch.end.y = e.changedTouches[0].pageY;
                }
                else if (typeof e.pageX !== 'undefined') {
                    touch.end.x = e.pageX;
                    touch.end.y = e.pageY;
                }
                
                touch.delta.x = Math.abs(touch.end.x - touch.start.x);
                touch.delta.y = Math.abs(touch.end.y - touch.start.y);
                
                if (touch.delta.x > options.threshold.x || touch.delta.y > options.threshold.y) return false;
                
                return true;
            };
            
            var cancelTouch = function() {
                $element.un(options.type.move);
                clearTimeout(touch.timeout);
                x$('.active').removeClass('active');
            };
            
            $element.on(options.type.start, function(e) {
                cancelTouch();
                
                touch.timeout = setTimeout(function() {
                    if (!android) x$(findAnchorElement(e.target)).addClass('active');
                }, options.timeout);
                
                delete touch.start.x;
                delete touch.start.y;
                
                if (typeof e.changedTouches !== 'undefined' && e.changedTouches.length > 0) {
                    touch.start.x = e.changedTouches[0].pageX;
                    touch.start.y = e.changedTouches[0].pageY;
                }
                else if (typeof e.pageX !== 'undefined') {
                    touch.start.x = e.pageX;
                    touch.start.y = e.pageY;
                }
                
                if (options.type.move) {
                    $element.on(options.type.move, function(e) {
                        if (!updateTouchDelta(e)) cancelTouch();
                    });
                }
            });
            
            $element.on(options.type.end, function(e) {
                cancelTouch();
                
                // Leave if touch-enabled and there was movement (i.e. not a tap)
                if (!updateTouchDelta(e)) {
                    $element.un('touchmove');
                    return false;
                }
                
                return callback(e);
            });
        });
    }
});