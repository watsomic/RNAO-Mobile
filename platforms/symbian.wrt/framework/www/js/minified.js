(function () {
/**
	Base
	====

	Includes functionality used to manipulate the xui object collection; things like iteration and set operations are included here.

*/
var undefined,
    xui,
    window     = this,
    string     = new String('string'), // prevents Goog compiler from removing primative and subsidising out allowing us to compress further
    document   = window.document,      // obvious really
    simpleExpr = /^#?([\w-]+)$/,   // for situations of dire need. Symbian and the such        
    idExpr     = /^#/,
    tagExpr    = /<([\w:]+)/, // so you can create elements on the fly a la x$('<img href="/foo" /><strong>yay</strong>')
    slice      = function (e) { return [].slice.call(e, 0); };
    try { var a = slice(document.documentElement.childNodes)[0].nodeType; }
    catch(e){ slice = function (e) { var ret=[]; for (var i=0; e[i]; i++) ret.push(e[i]); return ret; }; }

window.x$ = window.xui = xui = function(q, context) {
    return new xui.fn.find(q, context);
};

// patch in forEach to help get the size down a little and avoid over the top currying on event.js and dom.js (shortcuts)
if (! [].forEach) {
    Array.prototype.forEach = function(fn) {
        var len = this.length || 0,
            i = 0,
            that = arguments[1]; // wait, what's that!? awwww rem. here I thought I knew ya!
                                 // @rem - that that is a hat tip to your thats :)

        if (typeof fn == 'function') {
            for (; i < len; i++) {
                fn.call(that, this[i], i, this);
            }
        }
    };
}
/*
 * Array Remove - By John Resig (MIT Licensed) 
 */
function removex(array, from, to) {
    var rest = array.slice((to || from) + 1 || array.length);
    array.length = from < 0 ? array.length + from: from;
    return array.push.apply(array, rest);
}

xui.fn = xui.prototype = {

/**
	extend
	------

	Allows extension of xui's prototype with the members/methods of the provided object.

	### syntax ###

		xui.extend( object );

	Call extend on the xui object to extend all xui instances with functionality and/or members of the passed-in object.

	### arguments ###

	- object:object a JavaScript object whose members will be incorporated into xui's prototype
 
	### example ###

	Given:

		var thing = {
		    first : function() { return this[ 0 ]; },
		    last : function() { return this[ this.length - 1 ]; }
		}

	We can extend xui's prototype with these methods by using `extend`:

		xui.extend( thing );

	Now we can use `first` and `last` in all instances of xui:

		var f = x$( '.someClass' ).first();
		var l = x$( '.differentClass' ).last();
*/
    extend: function(o) {
        for (var i in o) {
            xui.fn[i] = o[i];
        }
    },

/**
	find
	----

	Finds matching elements based on a query string. The global xui entry `x$` function is a reference to the `find` function.

	### syntax ###

		x$(window).find( selector [, context] );

	### arguments ###

	- selector:string a CSS selector string to match elements to.
	- context:HTMLElement an html element to use as the "root" element to search from.
 
	### example ###

	Given the following markup:

		<ul id="first">
		    <li id="one">1</li>
		    <li id="two">2</li>
		</ul>
		<ul id="second">
		    <li id="three">3</li>
		    <li id="four">4</li>
		</ul>

	We can select only specific list items by using `find`, as opposed to selecting off the document root:

		x$('li'); // returns all four list item elements.
		x$('#second').find('li'); // returns list items "three" and "four"
*/
    find: function(q, context) {
        var ele = [], tempNode;
            
        if (!q) {
            return this;
        } else if (context == undefined && this.length) {
            ele = this.each(function(el) {
                ele = ele.concat(slice(xui(q, el)));
            }).reduce(ele);
        } else {
            context = context || document;
            // fast matching for pure ID selectors and simple element based selectors
            if (typeof q == string) {
              if (simpleExpr.test(q) && context.getElementById && context.getElementsByTagName) {
                  ele = idExpr.test(q) ? [context.getElementById(q.substr(1))] : context.getElementsByTagName(q);
                  // nuke failed selectors
                  if (ele[0] == null) { 
                    ele = [];
                  }
              // match for full html tags to create elements on the go
              } else if (tagExpr.test(q)) {
                  tempNode = document.createElement('i');
                  tempNode.innerHTML = q;
                  slice(tempNode.childNodes).forEach(function (el) {
                    ele.push(el);
                  });
              } else {
                  // one selector, check if Sizzle is available and use it instead of querySelectorAll.
                  if (window.Sizzle !== undefined) {
                    ele = Sizzle(q, context);
                  } else {
                    ele = context.querySelectorAll(q);
                  }
              }
              // blanket slice
              ele = slice(ele);
            } else if (q instanceof Array) {
                ele = q;
            } else if (q.toString() == '[object NodeList]') {
                ele = slice(q);
            } else if (q.nodeName || q === window) { // only allows nodes in
                // an element was passed in
                ele = [q];
            }
        }
        // disabling the append style, could be a plugin (found in more/base):
        // xui.fn.add = function (q) { this.elements = this.elements.concat(this.reduce(xui(q).elements)); return this; }
        return this.set(ele);
    },

/**
	set
	---

	Sets the objects in the xui collection.

	### syntax ###

		x$(window).set( array );
*/
    set: function(elements) {
        var ret = xui();
        ret.cache = slice(this.length ? this : []);
        ret.length = 0;
        [].push.apply(ret, elements);
        return ret;
    },

/**
	reduce
	---

	Reduces the set of elements in the xui object to a unique set.

	### syntax ###

		x$(someSelector).reduce( [ elements [, toIndex ]] );

	The elements parameter is optional - if not specified, will reduce the elements in the current xui object.

	### arguments ###

	- elements:Array an array of elements to reduce (optional)
	- toIndex:Number last index of elements to include in the reducing operation.
*/
    reduce: function(elements, b) {
        var a = [],
        elements = elements || slice(this);
        elements.forEach(function(el) {
            // question the support of [].indexOf in older mobiles (RS will bring up 5800 to test)
            if (a.indexOf(el, 0, b) < 0)
            a.push(el);
        });

        return a;
    },

/**
	has
	---

	Has modifies the elements array and returns all the elements that match (has) a CSS selector.

	### syntax ###

		x$(someSelector).has( query );

	Behind the scenes, actually calls the filter method.

	### arguments ###

	- query:string a CSS selector that will match all children of originally-selected xui collection

	### example ###

	Given

		<div>
		    <div class="gotit">these ones</div>
		    <div class="gotit">have an extra class</div>
		</div>
	
	We can use xui like so

		var divs = x$('div'); // we've got all four divs from above.
		var someDivs = divs.has('.gotit'); // we've now got only the two divs with the class
*/
     has: function(q) {
         var list = xui(q);
         return this.filter(function () {
             var that = this;
             var found = null;
             list.each(function (el) {
                 found = (found || el == that);
             });
             return found;
         });
     },
/**
	filter
	------

	Both an internal utility function, but also allows developers to extend xui using custom filters

	### syntax ###

		x$(someSelector).filter( functionHandle );

	The `functionHandle` function will get invoked with `this` being the element being iterated on,
	and the index passed in as a parameter.

	### arguments ###

	- functionHandle:Function a function reference that evaluates to true/false, determining which elements get included in the xui collection.

	### example ###

	Perhaps we'd want to filter input elements that are disabled:

		x$('input').filter(function(i) {
		    return this.checked;
		});
*/
    filter: function(fn) {
        var elements = [];
        return this.each(function(el, i) {
            if (fn.call(el, i)) elements.push(el);
        }).set(elements);
    },

/**
	not
	---

	Not modifies the elements array and returns all the elements that DO NOT match a CSS Query - the opposite of has

	### syntax ###

		x$(someSelector).not( someOtherSelector );

	### arguments ###

	- someOtherSelector:string a CSS selector that elements should NOT match to.

	### example ###

	Given

		<div>
		    <div class="gotit">these ones</div>
		    <div class="gotit">have an extra class</div>
		</div>

	We can use xui like so

		var divs = x$('div'); // we've got all four divs from above.
		var someDivs = divs.not('.gotit'); // we've now got only the two divs _without_ the class "gotit"	
*/
    not: function(q) {
        var list = slice(this);
        return this.filter(function(i) {
            var found;
            xui(q).each(function(el) {
                return found = list[i] != el;
            });
            return found;
        });
    },

/**
	each
	----

	Element iterator (over the xui collection).

	### syntax ###

		x$(window).each( functionHandle )

	### arguments ###

	- functionHandle:Function callback function that will execute with each element being passed in as the `this` object and first parameter to callback

	### example ###

		x$(someSelector).each(function(element, index, xui) {
		    alert("Here's the " + index + " element: " + element);
		});	
*/
    each: function(fn) {
        // we could compress this by using [].forEach.call - but we wouldn't be able to support
        // fn return false breaking the loop, a feature I quite like.
        for (var i = 0, len = this.length; i < len; ++i) {
            if (fn.call(this[i], this[i], i, this) === false)
            break;
        }
        return this;
    }
};

xui.fn.find.prototype = xui.fn;
xui.extend = xui.fn.extend;
/**
	DOM
	===

	Set of methods used for manipulating the Document Object Model (DOM).

*/
xui.extend({
/**
	html
	---

	For manipulating HTML in the DOM.

	### syntax ###

		x$(window).html( location, html );

	or this method will accept just an html fragment with a default behavior of inner.

		x$(window).html( html );

	or you can use shorthand syntax by using the location name argument (see below) as the function name.

		x$(window).outer( html );
		x$(window).before( html );

	### arguments ###

	- location:string can be one of: inner, outer, top, bottom, remove, before or after.
	- html:string any string of html markup or an HTMLElement.

	### example ###

		x$('#foo').html( 'inner', '<strong>rock and roll</strong>' );
		x$('#foo').html( 'outer', '<p>lock and load</p>' );
		x$('#foo').html( 'top', '<div>bangers and mash</div>');
		x$('#foo').html( 'bottom','<em>mean and clean</em>');
		x$('#foo').html( 'remove');
		x$('#foo').html( 'before', '<p>some warmup html</p>');
		x$('#foo').html( 'after', '<p>more html!</p>');

	or

		x$('#foo').html( '<p>sweet as honey</p>' );
		x$('#foo').outer( '<p>free as a bird</p>' );
		x$('#foo').top( '<b>top of the pops</b>' );
		x$('#foo').bottom( '<span>bottom of the barrel</span>' );
		x$('#foo').before( '<pre>first in line</pre>' );
		x$('#foo').after( '<marquee>better late than never</marquee>' );
*/
    html: function(location, html) {
        clean(this);

        if (arguments.length == 0) {
            return this[0].innerHTML;
        }
        if (arguments.length == 1 && arguments[0] != 'remove') {
            html = location;
            location = 'inner';
        }
        if (location != 'remove' && html && html.each !== undefined) {
            if (location == 'inner') {
                var d = document.createElement('p');
                html.each(function(el) {
                    d.appendChild(el);
                });
                this.each(function(el) {
                    el.innerHTML = d.innerHTML;
                });
            } else {
                var that = this;
                html.each(function(el){
                    that.html(location, el);
                });
            }
            return this;
        }
        return this.each(function(el) {
            var parent, 
                list, 
                len, 
                i = 0;
            if (location == "inner") { // .html
                if (typeof html == string || typeof html == "number") {
                    el.innerHTML = html;
                    list = el.getElementsByTagName('SCRIPT');
                    len = list.length;
                    for (; i < len; i++) {
                        eval(list[i].text);
                    }
                } else {
                    el.innerHTML = '';
                    el.appendChild(html);
                }
            } else if (location == "outer") { // .replaceWith
                el.parentNode.replaceChild(wrapHelper(html, el), el);
            } else if (location == "top") { // .prependTo
                el.insertBefore(wrapHelper(html, el), el.firstChild);
            } else if (location == "bottom") { // .appendTo
                el.insertBefore(wrapHelper(html, el), null);
            } else if (location == "remove") {
                el.parentNode.removeChild(el);
            } else if (location == "before") { // .insertBefore
                el.parentNode.insertBefore(wrapHelper(html, el.parentNode), el);
            } else if (location == "after") { // .insertAfter
                el.parentNode.insertBefore(wrapHelper(html, el.parentNode), el.nextSibling);
            }
        });
    },

/**
	attr
	---

	For getting or setting attributes on elements.

	### syntax (and examples) ###

		x$(window).attr( attribute, value );

	To retrieve an attribute value, simply don't provide the optional second parameter:

		x$('.someClass').attr( 'class' );

	To set an attribute, use both parameters:

		x$('.someClass').attr( 'disabled', 'disabled' );

	### arguments ###

	- attribute:string the name of the element's attribute to set or retrieve.
	- html:string if retrieving an attribute value, don't specify this parameter. Otherwise, this is the value to set the attribute to.
*/
    attr: function(attribute, val) {
        if (arguments.length == 2) {
            return this.each(function(el) {
                (attribute=='checked'&&(val==''||val==false||typeof val=="undefined"))?el.removeAttribute(attribute):el.setAttribute(attribute, val);
            });
        } else {
            var attrs = [];
            this.each(function(el) {
                var val = el.getAttribute(attribute);
                if (val != null)
                attrs.push(val);
            });
            return attrs;
        }
    }
});
"inner outer top bottom remove before after".split(' ').forEach(function (method) {
  xui.fn[method] = function(where) { return function (html) { return this.html(where, html); }; }(method);
});
// private method for finding a dom element
function getTag(el) {
    return (el.firstChild === null) ? {'UL':'LI','DL':'DT','TR':'TD'}[el.tagName] || el.tagName : el.firstChild.tagName;
}

function wrapHelper(html, el) {
  return (typeof html == string) ? wrap(html, getTag(el)) : html;
}

// private method
// Wraps the HTML in a TAG, Tag is optional
// If the html starts with a Tag, it will wrap the context in that tag.
function wrap(xhtml, tag) {

    var attributes = {},
        re = /^<([A-Z][A-Z0-9]*)([^>]*)>([\s\S]*)<\/\1>/i,
        element,
        x,
        a,
        i = 0,
        attr,
        node,
        attrList,
        result;
        
    if (re.test(xhtml)) {
        result = re.exec(xhtml);
        tag = result[1];

        // if the node has any attributes, convert to object
        if (result[2] !== "") {
            attrList = result[2].split(/([A-Z]*\s*=\s*['|"][A-Z0-9:;#\s]*['|"])/i);

            for (; i < attrList.length; i++) {
                attr = attrList[i].replace(/^\s*|\s*$/g, "");
                if (attr !== "" && attr !== " ") {
                    node = attr.split('=');
                    attributes[node[0]] = node[1].replace(/(["']?)/g, '');
                }
            }
        }
        xhtml = result[3];
    }

    element = document.createElement(tag);

    for (x in attributes) {
        a = document.createAttribute(x);
        a.nodeValue = attributes[x];
        element.setAttributeNode(a);
    }

    element.innerHTML = xhtml;
    return element;
}


/*
* Removes all erronious nodes from the DOM.
* 
*/
function clean(collection) {
    var ns = /\S/;
    collection.each(function(el) {
        var d = el,
            n = d.firstChild,
            ni = -1,
            nx;
        while (n) {
            nx = n.nextSibling;
            if (n.nodeType == 3 && !ns.test(n.nodeValue)) {
                d.removeChild(n);
            } else {
                n.nodeIndex = ++ni; // FIXME not sure what this is for, and causes IE to bomb (the setter) - @rem
            }
            n = nx;
        }
    });
}
/**
	Event
	=====

	A good old fashioned yet new skool event handling system.

	- click
	- load
	- touchstart
	- touchmove
	- touchend
	- touchcancel
	- gesturestart
	- gesturechange
	- gestureend
	- orientationchange
	
*/
xui.events = {}; var cache = {};
xui.extend({

/**
	on
	--

	Registers a callback function to a DOM event on the element collection.

	For more information see:

	- http://developer.apple.com/webapps/docs/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/chapter_7_section_1.html#//apple_ref/doc/uid/TP40006511-SW1

	### syntax ###

		x$('button').on( 'click', function(e){ alert('hey that tickles!') });

	or...

		x$('a.save').click(function(e){ alert('tee hee!') });

	### arguments ###

	- type:string the event to subscribe to click|load|etc
	- fn:function a callback function to execute when the event is fired

	### example ###

		x$(window).load(function(e){
		  x$('.save').touchstart( function(evt){ alert('tee hee!') }).css(background:'grey');
		});
*/
    on: function(type, fn, details) {
        return this.each(function (el) {
            if (xui.events[type]) {
                var id = _getEventID(el), 
                    responders = _getRespondersForEvent(id, type);
                
                details = details || {};
                details.handler = function (event, data) {
                    xui.fn.fire.call(xui(this), type, data);
                };
                
                // trigger the initialiser - only happens the first time around
                if (!responders.length) {
                    xui.events[type].call(el, details);
                }
            } 
            el.addEventListener(type, _createResponder(el, type, fn), false);
        });
    },

/**
	un
	--

	Unregisters a specific callback, or if no specific callback is passed in, 
	unregisters all event callbacks of a specific type.

	### syntax ###

		x$('button').un('click', specificCallback);

	The above unregisters only the `specificCallback` function on all button elements.

		x$('button').un('click');

	The above unregisters all callbacks assigned to all button elements.

	### arguments ###

	- type:string the event to unsubscribe from click|load|etc
	- fn:function callback function to unsubscribe (optional)

	### example ###

		x$('button').on('click',function(){alert('hi!');}); // callback subscribed to click.
		x$('button').un('click'); // No more callbacks fired on click of button elements!

	or ...

		var funk = function() { alert('yo!'); }
		x$('button').on('click', funk); // callback subscribed to click.
		x$('button').on('click', function(){ alert('hi!'); });
		x$('button').un('click', funk); // When buttons are clicked, the 'hi!' alert will pop up but not the 'yo!' alert.
*/
    un: function(type, fn) {
        return this.each(function (el) {
            var id = _getEventID(el), responders = _getRespondersForEvent(id, type), i = responders.length;

            while (i--) {
                if (fn === undefined || fn.guid === responders[i].guid) {
                    el.removeEventListener(type, responders[i], false);
                    removex(cache[id][type], i, 1);
                }
            }

            if (cache[id][type].length === 0) delete cache[id][type];
            for (var t in cache[id]) {
                return;
            }
            delete cache[id];
        });
    },

/**
	fire
	----

	Fires a specific event on the xui collection.

	### syntax ###

		x$('button').fire('click', {some:'data'});

	Fires an event with some specific data attached to the event's `data` property.

	### arguments ###

	- type:string the event to fire, click|load|etc
	- data:object JavaScript object to attach to the event's `data` property.

	### example ###

        x$('button#reset').fire('click', {died:true});
        x$('.target').fire('touchstart');
*/
    fire: function (type, data) {
        return this.each(function (el) {
            if (el == document && !el.dispatchEvent)
                el = document.documentElement;

            var event = document.createEvent('HTMLEvents');
            event.initEvent(type, true, true);
            event.data = data || {};
            event.eventName = type;
          
            el.dispatchEvent(event);
  	    });
  	}
});

"click load submit touchstart touchmove touchend touchcancel gesturestart gesturechange gestureend orientationchange".split(' ').forEach(function (event) {
  xui.fn[event] = function(action) { return function (fn) { return fn ? this.on(action, fn) : this.fire(action); }; }(event);
});

// patched orientation support - Andriod 1 doesn't have native onorientationchange events
xui(window).on('load', function() {
    if (!('onorientationchange' in document.body)) {
      (function (w, h) {
        xui(window).on('resize', function () {
          var portraitSwitch = (window.innerWidth < w && window.innerHeight > h) && (window.innerWidth < window.innerHeight),
              landscapeSwitch = (window.innerWidth > w && window.innerHeight < h) && (window.innerWidth > window.innerHeight);
          if (portraitSwitch || landscapeSwitch) {
            window.orientation = portraitSwitch ? 0 : 90; // what about -90? Some support is better than none
            xui('body').fire('orientationchange'); // will this bubble up?
            w = window.innerWidth;
            h = window.innerHeight;
          }
        });
      })(window.innerWidth, window.innerHeight);
    }
});

// this doesn't belong on the prototype, it belongs as a property on the xui object
xui.touch = (function () {
  try{
    return !!(document.createEvent("TouchEvent").initTouchEvent)
  } catch(e) {
    return false;
  };
})();

// lifted from Prototype's (big P) event model
function _getEventID(element) {
    if (element._xuiEventID) return element._xuiEventID;
    return element._xuiEventID = ++_getEventID.id;
}

_getEventID.id = 1;

function _getRespondersForEvent(id, eventName) {
    var c = cache[id] = cache[id] || {};
    return c[eventName] = c[eventName] || [];
}

function _createResponder(element, eventName, handler) {
    var id = _getEventID(element), r = _getRespondersForEvent(id, eventName);

    var responder = function(event) {
        if (handler.call(element, event) === false) {
            event.preventDefault();
            event.stopPropagation();
        } 
    };
    
    responder.guid = handler.guid = handler.guid || ++_getEventID.id;
    responder.handler = handler;
    r.push(responder);
    return responder;
}
/**
	Effects
	=======

	Animations, transforms and transitions for getting the most out of hardware accelerated CSS.

*/

xui.extend({

/**
	Tween
	-----

	Tween is a method for transforming a css property to a new value.

	### syntax ###

		x$(selector).tween(obj, callback);

	### arguments ###

	- properties: object an object literal of element css properties to tween or an array containing object literals of css properties to tween sequentially.
	- callback (optional): function to run when the animation is complete

	### example ###

		x$('#box').tween({ left:'100px', backgroundColor:'blue' });
		x$('#box').tween({ left:'100px', backgroundColor:'blue' }, function() { alert('done!'); });
		x$('#box').tween([{ left:'100px', backgroundColor:'green', duration:.2 }, { right:'100px' }]); 
*/
	// options: duration, after, easing
	tween: function( props, callback ) {
	    
	    // creates an options obj for emile
	    var emileOpts = function(o) {
	        var options = {};
    		"duration after easing".split(' ').forEach( function(p) {
        		if (props[p]) {
        		    options[p] = props[p];
        		    delete props[p];
        		}
    		});
    		return options;
	    }
	    
	    // serialize the properties into a string for emile
	    var serialize = function(props) {
		    var serialisedProps = [], key;
    		if (typeof props != string) {
      		    for (key in props) {
                    serialisedProps.push(key + ':' + props[key]);
    		    }
      		    serialisedProps = serialisedProps.join(';');
    		} else {
    		    serialisedProps = props;
    		}
    		return serialisedProps;
		};
	    
		// queued animations
		if (props instanceof Array) {
		    // animate each passing the next to the last callback to enqueue
		    props.forEach(function(a){
		        
		    });
		}

	    // this branch means we're dealing with a single tween
	    var opts = emileOpts(props);
	    var prop = serialize(props);
		
		return this.each(function(e){
			emile(e, prop, opts, callback);
		});
	}
});
/**
	Style
	=====

	Anything related to how things look. Usually, this is CSS.

*/
function hasClass(el, className) {
    return getClassRegEx(className).test(el.className);
}

// Via jQuery - used to avoid el.className = ' foo';
// Used for trimming whitespace
var rtrim = /^(\s|\u00A0)+|(\s|\u00A0)+$/g;

function trim(text) {
  return (text || "").replace( rtrim, "" );
}

xui.extend({
/**
	setStyle
	--------

	Sets a single CSS property to a new value.

	### syntax ###

		x$(selector).setStyle(property, value);

	### arguments ###

	- property:string the property to modify
	- value:string the property value to set

	### example ###

		x$('.txt').setStyle('color', '#000');
*/
    setStyle: function(prop, val) {
        prop = prop.replace(/\-[a-z]/g,function(m) { return m[1].toUpperCase(); });
        return this.each(function(el) {
            el.style[prop] = val;
        });
    },

/**
	getStyle
	--------

	Retuns a single CSS property. Can also invoke a callback to perform more specific processing tasks related to the property value.

	### syntax ###

		x$(selector).getStyle(property, callback);

	### arguments ###

	- property:string a css key (for example, border-color NOT borderColor)
	- callback:function (optional) a method to call on each element in the collection 

	### example ###

		x$('ul#nav li.trunk').getStyle('font-size');
		
		x$('a.globalnav').getStyle( 'background', function(prop){ prop == 'blue' ? 'green' : 'blue' });
*/
    getStyle: function(prop, callback) {
        // shortcut getComputedStyle function
        var s = function(el, p) {
            // this *can* be written to be smaller - see below, but in fact it doesn't compress in gzip as well, the commented
            // out version actually *adds* 2 bytes.
            // return document.defaultView.getComputedStyle(el, "").getPropertyValue(p.replace(/([A-Z])/g, "-$1").toLowerCase());
            return document.defaultView.getComputedStyle(el, "").getPropertyValue(p.replace(/[A-Z]/g, function(m) { return '-'+m.toLowerCase(); }));
        }
        return (callback === undefined) ?
        
            s(this[0], prop) :
            
            this.each(function(el) {
                callback(s(el, prop));
            });
    },

/**
	addClass
	--------

	Adds the classname to all the elements in the collection.

	### syntax ###

		$(selector).addClass(className);

	### arguments ###

	- className:string the name of the CSS class to apply

	### example ###

		$('.foo').addClass('awesome');
*/
    addClass: function(className) {
        return this.each(function(el) {
            if (hasClass(el, className) === false) {
              el.className = trim(el.className + ' ' + className);
            }
        });
    },

/**
	hasClass
	--------

	Checks to see if classname is one the element. If a callback isn't passed, hasClass expects only one element in collection - but should it?

	### syntax ###

		$(selector).hasClass('className');
		$(selector).hasClass('className', function(element) {});	 

	### arguments ###

	- className:string the name of the CSS class to apply

	### example ###

		$('#foo').hasClass('awesome'); // returns true or false
		$('.foo').hasClass('awesome',function(e){}); // returns XUI object
*/
    hasClass: function(className, callback) {
        var self = this;
        return this.length && (function() {
                var hasIt = false;
                self.each(function(el) {
                    if (hasClass(el, className)) {
                        hasIt = true;
                        if (callback) callback(el);
                    }
                });
                return hasIt;
            })();
    },

/**
	removeClass
	-----------

	Removes the classname from all the elements in the collection.

	### syntax ###

		x$(selector).removeClass(className);

	### arguments ###

	- className:string the name of the CSS class to remove.

	### example ###

		x$('.bar').removeClass('awesome');
*/
    removeClass: function(className) {
        if (className === undefined) {
            this.each(function(el) {
                el.className = '';
            });
        } else {
            var re = getClassRegEx(className);
            this.each(function(el) {
                el.className = trim(el.className.replace(re, '$1'));
            });
        }
        return this;
    },


/**
	css
	---

	Set a number of CSS properties at once.

	### syntax ###

		x$(selector).css(object);

	### arguments ###

	- an object literal of css key/value pairs to set.

	### example ###

		x$('h2.fugly').css({ backgroundColor:'blue', color:'white', border:'2px solid red' });
*/
    css: function(o) {
        for (var prop in o) {
            this.setStyle(prop, o[prop]);
        }
        return this;
    }
});

// RS: now that I've moved these out, they'll compress better, however, do these variables
// need to be instance based - if it's regarding the DOM, I'm guessing it's better they're
// global within the scope of xui

// -- private methods -- //
var reClassNameCache = {},
    getClassRegEx = function(className) {
        var re = reClassNameCache[className];
        if (!re) {
            // Preserve any leading whitespace in the match, to be used when removing a class
            re = new RegExp('(^|\\s+)' + className + '(?:\\s+|$)');
            reClassNameCache[className] = re;
        }
        return re;
    };
/**
	XHR
	===

	Remoting methods and utils.

 */
xui.extend({	
/**
	xhr
	---

	The classic Xml Http Request sometimes also known as the Greek God: Ajax. Not to be confused with AJAX the cleaning agent.
	This method has a few new tricks. It is always invoked on an element collection and follows the identical behaviour as the
	`html` method. If there no callback is defined the response text will be inserted into the elements in the collection.

	### syntax ###

		xhr(location, url, options)

	or this method will accept just a url with a default behavior of inner...

		xhr(url, options);

	### options ###

	- method {String} [get|put|delete|post] Defaults to 'get'.
	- async {Boolean} Asynchronous request. Defaults to false.
	- data {String} A url encoded string of parameters to send.
	- callback {Function} Called on 200 status (success)

	### response ###

	- The response available to the callback function as 'this', it is not passed in.
	- `this.reponseText` will have the resulting data from the file.

	### example ###

		x$('#status').xhr('inner', '/status.html');
		x$('#status').xhr('outer', '/status.html');
		x$('#status').xhr('top',   '/status.html');
		x$('#status').xhr('bottom','/status.html');
		x$('#status').xhr('before','/status.html');
		x$('#status').xhr('after', '/status.html');

	or

		x$('#status').xhr('/status.html');

		x$('#left-panel').xhr('/panel', {callback:function(){ alert("All Done!") }});

		x$('#left-panel').xhr('/panel', function(){ alert(this.responseText) }); 
*/
    xhr:function(location, url, options) {

      // this is to keep support for the old syntax (easy as that)
		if (!/^(inner|outer|top|bottom|before|after)$/.test(location)) {
            options = url;
            url = location;
            location = 'inner';
        }

        var o = options ? options : {};
        
        if (typeof options == "function") {
            // FIXME kill the console logging
            // console.log('we been passed a func ' + options);
            // console.log(this);
            o = {};
            o.callback = options;
        };
        
        var that   = this,
            req    = new XMLHttpRequest(),
            method = o.method || 'get',
            async  = o.async || false,           
            params = o.data || null,
            i = 0;

        req.queryString = params;
        req.open(method, url, async);

        if (o.headers) {
            for (; i<o.headers.length; i++) {
              req.setRequestHeader(o.headers[i].name, o.headers[i].value);
            }
        }

        req.handleResp = (o.callback != null) ? o.callback : function() { that.html(location, this.responseText); };
        req.handleError = (o.error && typeof o.error == 'function') ? o.error : function () {};
        function hdl(){ 
            if(req.readyState==4) {
                delete(that.xmlHttpRequest);
                if(req.status===0 || req.status==200) req.handleResp(); 
                if((/^[45]/).test(req.status)) req.handleError();
            }
        }
        if(async) {
            req.onreadystatechange = hdl;
            this.xmlHttpRequest = req;
        }
        req.send(params);
        if(!async) hdl();

        return this;
    }
});
// emile.js (c) 2009 Thomas Fuchs
// Licensed under the terms of the MIT license.

(function(emile, container){
  var parseEl = document.createElement('div'),
    props = ('backgroundColor borderBottomColor borderBottomWidth borderLeftColor borderLeftWidth '+
    'borderRightColor borderRightWidth borderSpacing borderTopColor borderTopWidth bottom color fontSize '+
    'fontWeight height left letterSpacing lineHeight marginBottom marginLeft marginRight marginTop maxHeight '+
    'maxWidth minHeight minWidth opacity outlineColor outlineOffset outlineWidth paddingBottom paddingLeft '+
    'paddingRight paddingTop right textIndent top width wordSpacing zIndex').split(' ');

  function interpolate(source,target,pos){ return (source+(target-source)*pos).toFixed(3); }
  function s(str, p, c){ return str.substr(p,c||1); }
  function color(source,target,pos){
    var i = 2, j, c, tmp, v = [], r = [];
    while(j=3,c=arguments[i-1],i--)
      if(s(c,0)=='r') { c = c.match(/\d+/g); while(j--) v.push(~~c[j]); } else {
        if(c.length==4) c='#'+s(c,1)+s(c,1)+s(c,2)+s(c,2)+s(c,3)+s(c,3);
        while(j--) v.push(parseInt(s(c,1+j*2,2), 16)); }
    while(j--) { tmp = ~~(v[j+3]+(v[j]-v[j+3])*pos); r.push(tmp<0?0:tmp>255?255:tmp); }
    return 'rgb('+r.join(',')+')';
  }
  
  function parse(prop){
    var p = parseFloat(prop), q = prop.replace(/^[\-\d\.]+/,'');
    return isNaN(p) ? { v: q, f: color, u: ''} : { v: p, f: interpolate, u: q };
  }
  
  function normalize(style){
    var css, rules = {}, i = props.length, v;
    parseEl.innerHTML = '<div style="'+style+'"></div>';
    css = parseEl.childNodes[0].style;
    while(i--) if(v = css[props[i]]) rules[props[i]] = parse(v);
    return rules;
  }  
  
  container[emile] = function(el, style, opts, after){
    el = typeof el == 'string' ? document.getElementById(el) : el;
    opts = opts || {};
    var target = normalize(style), comp = el.currentStyle ? el.currentStyle : getComputedStyle(el, null),
      prop, current = {}, start = +new Date, dur = opts.duration||200, finish = start+dur, interval,
      easing = opts.easing || function(pos){ return (-Math.cos(pos*Math.PI)/2) + 0.5; };
    for(prop in target) current[prop] = parse(comp[prop]);
    interval = setInterval(function(){
      var time = +new Date, pos = time>finish ? 1 : (time-start)/dur;
      for(prop in target)
        el.style[prop] = target[prop].f(current[prop].v,target[prop].v,easing(pos)) + target[prop].u;
      if(time>finish) { clearInterval(interval); opts.after && opts.after(); after && setTimeout(after,1); }
    },10);
  }
})('emile', this);
/*!
 * Sizzle CSS Selector Engine - v1.0
 *  Copyright 2009, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */
(function(){

var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
	done = 0,
	toString = Object.prototype.toString,
	hasDuplicate = false,
	baseHasDuplicate = true;

// Here we check if the JavaScript engine is using some sort of
// optimization where it does not always call our comparision
// function. If that is the case, discard the hasDuplicate value.
//   Thus far that includes Google Chrome.
[0, 0].sort(function(){
	baseHasDuplicate = false;
	return 0;
});

var Sizzle = function(selector, context, results, seed) {
	results = results || [];
	context = context || document;

	var origContext = context;

	if ( context.nodeType !== 1 && context.nodeType !== 9 ) {
		return [];
	}
	
	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	var parts = [], m, set, checkSet, extra, prune = true, contextXML = Sizzle.isXML(context),
		soFar = selector, ret, cur, pop, i;
	
	// Reset the position of the chunker regexp (start from head)
	do {
		chunker.exec("");
		m = chunker.exec(soFar);

		if ( m ) {
			soFar = m[3];
		
			parts.push( m[1] );
		
			if ( m[2] ) {
				extra = m[3];
				break;
			}
		}
	} while ( m );

	if ( parts.length > 1 && origPOS.exec( selector ) ) {
		if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
			set = posProcess( parts[0] + parts[1], context );
		} else {
			set = Expr.relative[ parts[0] ] ?
				[ context ] :
				Sizzle( parts.shift(), context );

			while ( parts.length ) {
				selector = parts.shift();

				if ( Expr.relative[ selector ] ) {
					selector += parts.shift();
				}
				
				set = posProcess( selector, set );
			}
		}
	} else {
		// Take a shortcut and set the context if the root selector is an ID
		// (but not if it'll be faster if the inner selector is an ID)
		if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
				Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1]) ) {
			ret = Sizzle.find( parts.shift(), context, contextXML );
			context = ret.expr ? Sizzle.filter( ret.expr, ret.set )[0] : ret.set[0];
		}

		if ( context ) {
			ret = seed ?
				{ expr: parts.pop(), set: makeArray(seed) } :
				Sizzle.find( parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML );
			set = ret.expr ? Sizzle.filter( ret.expr, ret.set ) : ret.set;

			if ( parts.length > 0 ) {
				checkSet = makeArray(set);
			} else {
				prune = false;
			}

			while ( parts.length ) {
				cur = parts.pop();
				pop = cur;

				if ( !Expr.relative[ cur ] ) {
					cur = "";
				} else {
					pop = parts.pop();
				}

				if ( pop == null ) {
					pop = context;
				}

				Expr.relative[ cur ]( checkSet, pop, contextXML );
			}
		} else {
			checkSet = parts = [];
		}
	}

	if ( !checkSet ) {
		checkSet = set;
	}

	if ( !checkSet ) {
		Sizzle.error( cur || selector );
	}

	if ( toString.call(checkSet) === "[object Array]" ) {
		if ( !prune ) {
			results.push.apply( results, checkSet );
		} else if ( context && context.nodeType === 1 ) {
			for ( i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && Sizzle.contains(context, checkSet[i])) ) {
					results.push( set[i] );
				}
			}
		} else {
			for ( i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
					results.push( set[i] );
				}
			}
		}
	} else {
		makeArray( checkSet, results );
	}

	if ( extra ) {
		Sizzle( extra, origContext, results, seed );
		Sizzle.uniqueSort( results );
	}

	return results;
};

Sizzle.uniqueSort = function(results){
	if ( sortOrder ) {
		hasDuplicate = baseHasDuplicate;
		results.sort(sortOrder);

		if ( hasDuplicate ) {
			for ( var i = 1; i < results.length; i++ ) {
				if ( results[i] === results[i-1] ) {
					results.splice(i--, 1);
				}
			}
		}
	}

	return results;
};

Sizzle.matches = function(expr, set){
	return Sizzle(expr, null, null, set);
};

Sizzle.find = function(expr, context, isXML){
	var set;

	if ( !expr ) {
		return [];
	}

	for ( var i = 0, l = Expr.order.length; i < l; i++ ) {
		var type = Expr.order[i], match;
		
		if ( (match = Expr.leftMatch[ type ].exec( expr )) ) {
			var left = match[1];
			match.splice(1,1);

			if ( left.substr( left.length - 1 ) !== "\\" ) {
				match[1] = (match[1] || "").replace(/\\/g, "");
				set = Expr.find[ type ]( match, context, isXML );
				if ( set != null ) {
					expr = expr.replace( Expr.match[ type ], "" );
					break;
				}
			}
		}
	}

	if ( !set ) {
		set = context.getElementsByTagName("*");
	}

	return {set: set, expr: expr};
};

Sizzle.filter = function(expr, set, inplace, not){
	var old = expr, result = [], curLoop = set, match, anyFound,
		isXMLFilter = set && set[0] && Sizzle.isXML(set[0]);

	while ( expr && set.length ) {
		for ( var type in Expr.filter ) {
			if ( (match = Expr.leftMatch[ type ].exec( expr )) != null && match[2] ) {
				var filter = Expr.filter[ type ], found, item, left = match[1];
				anyFound = false;

				match.splice(1,1);

				if ( left.substr( left.length - 1 ) === "\\" ) {
					continue;
				}

				if ( curLoop === result ) {
					result = [];
				}

				if ( Expr.preFilter[ type ] ) {
					match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );

					if ( !match ) {
						anyFound = found = true;
					} else if ( match === true ) {
						continue;
					}
				}

				if ( match ) {
					for ( var i = 0; (item = curLoop[i]) != null; i++ ) {
						if ( item ) {
							found = filter( item, match, i, curLoop );
							var pass = not ^ !!found;

							if ( inplace && found != null ) {
								if ( pass ) {
									anyFound = true;
								} else {
									curLoop[i] = false;
								}
							} else if ( pass ) {
								result.push( item );
								anyFound = true;
							}
						}
					}
				}

				if ( found !== undefined ) {
					if ( !inplace ) {
						curLoop = result;
					}

					expr = expr.replace( Expr.match[ type ], "" );

					if ( !anyFound ) {
						return [];
					}

					break;
				}
			}
		}

		// Improper expression
		if ( expr === old ) {
			if ( anyFound == null ) {
				Sizzle.error( expr );
			} else {
				break;
			}
		}

		old = expr;
	}

	return curLoop;
};

Sizzle.error = function( msg ) {
	throw "Syntax error, unrecognized expression: " + msg;
};

var Expr = Sizzle.selectors = {
	order: [ "ID", "NAME", "TAG" ],
	match: {
		ID: /#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
		CLASS: /\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
		NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,
		ATTR: /\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,
		TAG: /^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,
		CHILD: /:(only|nth|last|first)-child(?:\((even|odd|[\dn+\-]*)\))?/,
		POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,
		PSEUDO: /:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/
	},
	leftMatch: {},
	attrMap: {
		"class": "className",
		"for": "htmlFor"
	},
	attrHandle: {
		href: function(elem){
			return elem.getAttribute("href");
		}
	},
	relative: {
		"+": function(checkSet, part){
			var isPartStr = typeof part === "string",
				isTag = isPartStr && !/\W/.test(part),
				isPartStrNotTag = isPartStr && !isTag;

			if ( isTag ) {
				part = part.toLowerCase();
			}

			for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
				if ( (elem = checkSet[i]) ) {
					while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}

					checkSet[i] = isPartStrNotTag || elem && elem.nodeName.toLowerCase() === part ?
						elem || false :
						elem === part;
				}
			}

			if ( isPartStrNotTag ) {
				Sizzle.filter( part, checkSet, true );
			}
		},
		">": function(checkSet, part){
			var isPartStr = typeof part === "string",
				elem, i = 0, l = checkSet.length;

			if ( isPartStr && !/\W/.test(part) ) {
				part = part.toLowerCase();

				for ( ; i < l; i++ ) {
					elem = checkSet[i];
					if ( elem ) {
						var parent = elem.parentNode;
						checkSet[i] = parent.nodeName.toLowerCase() === part ? parent : false;
					}
				}
			} else {
				for ( ; i < l; i++ ) {
					elem = checkSet[i];
					if ( elem ) {
						checkSet[i] = isPartStr ?
							elem.parentNode :
							elem.parentNode === part;
					}
				}

				if ( isPartStr ) {
					Sizzle.filter( part, checkSet, true );
				}
			}
		},
		"": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck, nodeCheck;

			if ( typeof part === "string" && !/\W/.test(part) ) {
				part = part.toLowerCase();
				nodeCheck = part;
				checkFn = dirNodeCheck;
			}

			checkFn("parentNode", part, doneName, checkSet, nodeCheck, isXML);
		},
		"~": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck, nodeCheck;

			if ( typeof part === "string" && !/\W/.test(part) ) {
				part = part.toLowerCase();
				nodeCheck = part;
				checkFn = dirNodeCheck;
			}

			checkFn("previousSibling", part, doneName, checkSet, nodeCheck, isXML);
		}
	},
	find: {
		ID: function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? [m] : [];
			}
		},
		NAME: function(match, context){
			if ( typeof context.getElementsByName !== "undefined" ) {
				var ret = [], results = context.getElementsByName(match[1]);

				for ( var i = 0, l = results.length; i < l; i++ ) {
					if ( results[i].getAttribute("name") === match[1] ) {
						ret.push( results[i] );
					}
				}

				return ret.length === 0 ? null : ret;
			}
		},
		TAG: function(match, context){
			return context.getElementsByTagName(match[1]);
		}
	},
	preFilter: {
		CLASS: function(match, curLoop, inplace, result, not, isXML){
			match = " " + match[1].replace(/\\/g, "") + " ";

			if ( isXML ) {
				return match;
			}

			for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
				if ( elem ) {
					if ( not ^ (elem.className && (" " + elem.className + " ").replace(/[\t\n]/g, " ").indexOf(match) >= 0) ) {
						if ( !inplace ) {
							result.push( elem );
						}
					} else if ( inplace ) {
						curLoop[i] = false;
					}
				}
			}

			return false;
		},
		ID: function(match){
			return match[1].replace(/\\/g, "");
		},
		TAG: function(match, curLoop){
			return match[1].toLowerCase();
		},
		CHILD: function(match){
			if ( match[1] === "nth" ) {
				// parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
				var test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(
					match[2] === "even" && "2n" || match[2] === "odd" && "2n+1" ||
					!/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

				// calculate the numbers (first)n+(last) including if they are negative
				match[2] = (test[1] + (test[2] || 1)) - 0;
				match[3] = test[3] - 0;
			}

			// TODO: Move to normal caching system
			match[0] = done++;

			return match;
		},
		ATTR: function(match, curLoop, inplace, result, not, isXML){
			var name = match[1].replace(/\\/g, "");
			
			if ( !isXML && Expr.attrMap[name] ) {
				match[1] = Expr.attrMap[name];
			}

			if ( match[2] === "~=" ) {
				match[4] = " " + match[4] + " ";
			}

			return match;
		},
		PSEUDO: function(match, curLoop, inplace, result, not){
			if ( match[1] === "not" ) {
				// If we're dealing with a complex expression, or a simple one
				if ( ( chunker.exec(match[3]) || "" ).length > 1 || /^\w/.test(match[3]) ) {
					match[3] = Sizzle(match[3], null, null, curLoop);
				} else {
					var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);
					if ( !inplace ) {
						result.push.apply( result, ret );
					}
					return false;
				}
			} else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
				return true;
			}
			
			return match;
		},
		POS: function(match){
			match.unshift( true );
			return match;
		}
	},
	filters: {
		enabled: function(elem){
			return elem.disabled === false && elem.type !== "hidden";
		},
		disabled: function(elem){
			return elem.disabled === true;
		},
		checked: function(elem){
			return elem.checked === true;
		},
		selected: function(elem){
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			elem.parentNode.selectedIndex;
			return elem.selected === true;
		},
		parent: function(elem){
			return !!elem.firstChild;
		},
		empty: function(elem){
			return !elem.firstChild;
		},
		has: function(elem, i, match){
			return !!Sizzle( match[3], elem ).length;
		},
		header: function(elem){
			return (/h\d/i).test( elem.nodeName );
		},
		text: function(elem){
			return "text" === elem.type;
		},
		radio: function(elem){
			return "radio" === elem.type;
		},
		checkbox: function(elem){
			return "checkbox" === elem.type;
		},
		file: function(elem){
			return "file" === elem.type;
		},
		password: function(elem){
			return "password" === elem.type;
		},
		submit: function(elem){
			return "submit" === elem.type;
		},
		image: function(elem){
			return "image" === elem.type;
		},
		reset: function(elem){
			return "reset" === elem.type;
		},
		button: function(elem){
			return "button" === elem.type || elem.nodeName.toLowerCase() === "button";
		},
		input: function(elem){
			return (/input|select|textarea|button/i).test(elem.nodeName);
		}
	},
	setFilters: {
		first: function(elem, i){
			return i === 0;
		},
		last: function(elem, i, match, array){
			return i === array.length - 1;
		},
		even: function(elem, i){
			return i % 2 === 0;
		},
		odd: function(elem, i){
			return i % 2 === 1;
		},
		lt: function(elem, i, match){
			return i < match[3] - 0;
		},
		gt: function(elem, i, match){
			return i > match[3] - 0;
		},
		nth: function(elem, i, match){
			return match[3] - 0 === i;
		},
		eq: function(elem, i, match){
			return match[3] - 0 === i;
		}
	},
	filter: {
		PSEUDO: function(elem, match, i, array){
			var name = match[1], filter = Expr.filters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			} else if ( name === "contains" ) {
				return (elem.textContent || elem.innerText || Sizzle.getText([ elem ]) || "").indexOf(match[3]) >= 0;
			} else if ( name === "not" ) {
				var not = match[3];

				for ( var j = 0, l = not.length; j < l; j++ ) {
					if ( not[j] === elem ) {
						return false;
					}
				}

				return true;
			} else {
				Sizzle.error( "Syntax error, unrecognized expression: " + name );
			}
		},
		CHILD: function(elem, match){
			var type = match[1], node = elem;
			switch (type) {
				case 'only':
				case 'first':
					while ( (node = node.previousSibling) )	 {
						if ( node.nodeType === 1 ) { 
							return false; 
						}
					}
					if ( type === "first" ) { 
						return true; 
					}
					node = elem;
				case 'last':
					while ( (node = node.nextSibling) )	 {
						if ( node.nodeType === 1 ) { 
							return false; 
						}
					}
					return true;
				case 'nth':
					var first = match[2], last = match[3];

					if ( first === 1 && last === 0 ) {
						return true;
					}
					
					var doneName = match[0],
						parent = elem.parentNode;
	
					if ( parent && (parent.sizcache !== doneName || !elem.nodeIndex) ) {
						var count = 0;
						for ( node = parent.firstChild; node; node = node.nextSibling ) {
							if ( node.nodeType === 1 ) {
								node.nodeIndex = ++count;
							}
						} 
						parent.sizcache = doneName;
					}
					
					var diff = elem.nodeIndex - last;
					if ( first === 0 ) {
						return diff === 0;
					} else {
						return ( diff % first === 0 && diff / first >= 0 );
					}
			}
		},
		ID: function(elem, match){
			return elem.nodeType === 1 && elem.getAttribute("id") === match;
		},
		TAG: function(elem, match){
			return (match === "*" && elem.nodeType === 1) || elem.nodeName.toLowerCase() === match;
		},
		CLASS: function(elem, match){
			return (" " + (elem.className || elem.getAttribute("class")) + " ")
				.indexOf( match ) > -1;
		},
		ATTR: function(elem, match){
			var name = match[1],
				result = Expr.attrHandle[ name ] ?
					Expr.attrHandle[ name ]( elem ) :
					elem[ name ] != null ?
						elem[ name ] :
						elem.getAttribute( name ),
				value = result + "",
				type = match[2],
				check = match[4];

			return result == null ?
				type === "!=" :
				type === "=" ?
				value === check :
				type === "*=" ?
				value.indexOf(check) >= 0 :
				type === "~=" ?
				(" " + value + " ").indexOf(check) >= 0 :
				!check ?
				value && result !== false :
				type === "!=" ?
				value !== check :
				type === "^=" ?
				value.indexOf(check) === 0 :
				type === "$=" ?
				value.substr(value.length - check.length) === check :
				type === "|=" ?
				value === check || value.substr(0, check.length + 1) === check + "-" :
				false;
		},
		POS: function(elem, match, i, array){
			var name = match[2], filter = Expr.setFilters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			}
		}
	}
};

var origPOS = Expr.match.POS,
	fescape = function(all, num){
		return "\\" + (num - 0 + 1);
	};

for ( var type in Expr.match ) {
	Expr.match[ type ] = new RegExp( Expr.match[ type ].source + (/(?![^\[]*\])(?![^\(]*\))/.source) );
	Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source.replace(/\\(\d+)/g, fescape) );
}

var makeArray = function(array, results) {
	array = Array.prototype.slice.call( array, 0 );

	if ( results ) {
		results.push.apply( results, array );
		return results;
	}
	
	return array;
};

// Perform a simple check to determine if the browser is capable of
// converting a NodeList to an array using builtin methods.
// Also verifies that the returned array holds DOM nodes
// (which is not the case in the Blackberry browser)
try {
	Array.prototype.slice.call( document.documentElement.childNodes, 0 )[0].nodeType;

// Provide a fallback method if it does not work
} catch(e){
	makeArray = function(array, results) {
		var ret = results || [], i = 0;

		if ( toString.call(array) === "[object Array]" ) {
			Array.prototype.push.apply( ret, array );
		} else {
			if ( typeof array.length === "number" ) {
				for ( var l = array.length; i < l; i++ ) {
					ret.push( array[i] );
				}
			} else {
				for ( ; array[i]; i++ ) {
					ret.push( array[i] );
				}
			}
		}

		return ret;
	};
}

var sortOrder;

if ( document.documentElement.compareDocumentPosition ) {
	sortOrder = function( a, b ) {
		if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return a.compareDocumentPosition ? -1 : 1;
		}

		var ret = a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( "sourceIndex" in document.documentElement ) {
	sortOrder = function( a, b ) {
		if ( !a.sourceIndex || !b.sourceIndex ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return a.sourceIndex ? -1 : 1;
		}

		var ret = a.sourceIndex - b.sourceIndex;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( document.createRange ) {
	sortOrder = function( a, b ) {
		if ( !a.ownerDocument || !b.ownerDocument ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return a.ownerDocument ? -1 : 1;
		}

		var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
		aRange.setStart(a, 0);
		aRange.setEnd(a, 0);
		bRange.setStart(b, 0);
		bRange.setEnd(b, 0);
		var ret = aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
}

// Utility function for retreiving the text value of an array of DOM nodes
Sizzle.getText = function( elems ) {
	var ret = "", elem;

	for ( var i = 0; elems[i]; i++ ) {
		elem = elems[i];

		// Get the text from text nodes and CDATA nodes
		if ( elem.nodeType === 3 || elem.nodeType === 4 ) {
			ret += elem.nodeValue;

		// Traverse everything else, except comment nodes
		} else if ( elem.nodeType !== 8 ) {
			ret += Sizzle.getText( elem.childNodes );
		}
	}

	return ret;
};

// Check to see if the browser returns elements by name when
// querying by getElementById (and provide a workaround)
(function(){
	// We're going to inject a fake input element with a specified name
	var form = document.createElement("div"),
		id = "script" + (new Date()).getTime();
	form.innerHTML = "<a name='" + id + "'/>";

	// Inject it into the root element, check its status, and remove it quickly
	var root = document.documentElement;
	root.insertBefore( form, root.firstChild );

	// The workaround has to do additional checks after a getElementById
	// Which slows things down for other browsers (hence the branching)
	if ( document.getElementById( id ) ) {
		Expr.find.ID = function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ? [m] : undefined : [];
			}
		};

		Expr.filter.ID = function(elem, match){
			var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
			return elem.nodeType === 1 && node && node.nodeValue === match;
		};
	}

	root.removeChild( form );
	root = form = null; // release memory in IE
})();

(function(){
	// Check to see if the browser returns only elements
	// when doing getElementsByTagName("*")

	// Create a fake element
	var div = document.createElement("div");
	div.appendChild( document.createComment("") );

	// Make sure no comments are found
	if ( div.getElementsByTagName("*").length > 0 ) {
		Expr.find.TAG = function(match, context){
			var results = context.getElementsByTagName(match[1]);

			// Filter out possible comments
			if ( match[1] === "*" ) {
				var tmp = [];

				for ( var i = 0; results[i]; i++ ) {
					if ( results[i].nodeType === 1 ) {
						tmp.push( results[i] );
					}
				}

				results = tmp;
			}

			return results;
		};
	}

	// Check to see if an attribute returns normalized href attributes
	div.innerHTML = "<a href='#'></a>";
	if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
			div.firstChild.getAttribute("href") !== "#" ) {
		Expr.attrHandle.href = function(elem){
			return elem.getAttribute("href", 2);
		};
	}

	div = null; // release memory in IE
})();

if ( document.querySelectorAll ) {
	(function(){
		var oldSizzle = Sizzle, div = document.createElement("div");
		div.innerHTML = "<p class='TEST'></p>";

		// Safari can't handle uppercase or unicode characters when
		// in quirks mode.
		if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
			return;
		}
	
		Sizzle = function(query, context, extra, seed){
			context = context || document;

			// Only use querySelectorAll on non-XML documents
			// (ID selectors don't work in non-HTML documents)
			if ( !seed && context.nodeType === 9 && !Sizzle.isXML(context) ) {
				try {
					return makeArray( context.querySelectorAll(query), extra );
				} catch(e){}
			}
		
			return oldSizzle(query, context, extra, seed);
		};

		for ( var prop in oldSizzle ) {
			Sizzle[ prop ] = oldSizzle[ prop ];
		}

		div = null; // release memory in IE
	})();
}

(function(){
	var div = document.createElement("div");

	div.innerHTML = "<div class='test e'></div><div class='test'></div>";

	// Opera can't find a second classname (in 9.6)
	// Also, make sure that getElementsByClassName actually exists
	if ( !div.getElementsByClassName || div.getElementsByClassName("e").length === 0 ) {
		return;
	}

	// Safari caches class attributes, doesn't catch changes (in 3.2)
	div.lastChild.className = "e";

	if ( div.getElementsByClassName("e").length === 1 ) {
		return;
	}
	
	Expr.order.splice(1, 0, "CLASS");
	Expr.find.CLASS = function(match, context, isXML) {
		if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
			return context.getElementsByClassName(match[1]);
		}
	};

	div = null; // release memory in IE
})();

function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 && !isXML ){
					elem.sizcache = doneName;
					elem.sizset = i;
				}

				if ( elem.nodeName.toLowerCase() === cur ) {
					match = elem;
					break;
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 ) {
					if ( !isXML ) {
						elem.sizcache = doneName;
						elem.sizset = i;
					}
					if ( typeof cur !== "string" ) {
						if ( elem === cur ) {
							match = true;
							break;
						}

					} else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
						match = elem;
						break;
					}
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

Sizzle.contains = document.compareDocumentPosition ? function(a, b){
	return !!(a.compareDocumentPosition(b) & 16);
} : function(a, b){
	return a !== b && (a.contains ? a.contains(b) : true);
};

Sizzle.isXML = function(elem){
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833) 
	var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

var posProcess = function(selector, context){
	var tmpSet = [], later = "", match,
		root = context.nodeType ? [context] : context;

	// Position selectors must be done after the filter
	// And so must :not(positional) so we move all PSEUDOs to the end
	while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
		later += match[0];
		selector = selector.replace( Expr.match.PSEUDO, "" );
	}

	selector = Expr.relative[selector] ? selector + "*" : selector;

	for ( var i = 0, l = root.length; i < l; i++ ) {
		Sizzle( selector, root[i], tmpSet );
	}

	return Sizzle.filter( later, tmpSet );
};

// EXPOSE

window.Sizzle = Sizzle;

})();
})();
if (typeof(DeviceInfo) != 'object')
    DeviceInfo = {};

/**
 * 
 */
window.addEventListener('load', function() {
	var e = document.createEvent('Events');
	e.initEvent('deviceready');
	document.dispatchEvent(e);
}, false);

/**
 * This represents the PhoneGap API itself, and provides a global namespace for accessing
 * information about the state of PhoneGap.
 * @class
 */
PhoneGap = {
    queue: {
        ready: true,
        commands: [],
        timer: null
    },
    _constructors: []
};

/**
 * Boolean flag indicating if the PhoneGap API is available and initialized.
 */
PhoneGap.available = DeviceInfo.uuid != undefined;

/**
 * Execute a PhoneGap command in a queued fashion, to ensure commands do not
 * execute with any race conditions, and only run when PhoneGap is ready to
 * recieve them.
 * @param {String} command Command to be run in PhoneGap, e.g. "ClassName.method"
 * @param {String[]} [args] Zero or more arguments to pass to the method
 */
PhoneGap.exec = function() {
    PhoneGap.queue.commands.push(arguments);
    if (PhoneGap.queue.timer == null)
        PhoneGap.queue.timer = setInterval(PhoneGap.run_command, 10);
};
/**
 * Internal function used to dispatch the request to PhoneGap.  This needs to be implemented per-platform to
 * ensure that methods are called on the phone in a way appropriate for that device.
 * @private
 */
PhoneGap.run_command = function() {
};

/**
 * This class contains acceleration information
 * @constructor
 * @param {Number} x The force applied by the device in the x-axis.
 * @param {Number} y The force applied by the device in the y-axis.
 * @param {Number} z The force applied by the device in the z-axis.
 */
function Acceleration(x, y, z) {
	/**
	 * The force applied by the device in the x-axis.
	 */
	this.x = x;
	/**
	 * The force applied by the device in the y-axis.
	 */
	this.y = y;
	/**
	 * The force applied by the device in the z-axis.
	 */
	this.z = z;
	/**
	 * The time that the acceleration was obtained.
	 */
	this.timestamp = new Date().getTime();
}

/**
 * This class specifies the options for requesting acceleration data.
 * @constructor
 */
function AccelerationOptions() {
	/**
	 * The timeout after which if acceleration data cannot be obtained the errorCallback
	 * is called.
	 */
	this.timeout = 10000;
}
/**
 * This class provides access to device accelerometer data.
 * @constructor
 */
function Accelerometer() {
	/**
	 * The last known acceleration.
	 */
	this.lastAcceleration = null;
}

/**
 * Asynchronously aquires the current acceleration.
 * @param {Function} successCallback The function to call when the acceleration
 * data is available
 * @param {Function} errorCallback The function to call when there is an error 
 * getting the acceleration data.
 * @param {AccelerationOptions} options The options for getting the accelerometer data
 * such as timeout.
 */

Accelerometer.prototype.getCurrentAcceleration = function(successCallback, errorCallback, options) {
	// If the acceleration is available then call success
	// If the acceleration is not available then call error
	
	try {
		if (!this.serviceObj) 
			this.serviceObj = this.getServiceObj();
		
		if (this.serviceObj == null) 
			throw {
				name: "DeviceErr",
				message: "Could not initialize service object"
			};
		
		//get the sensor channel
		var SensorParams = {
			SearchCriterion: "AccelerometerAxis"
		};
		var returnvalue = this.serviceObj.ISensor.FindSensorChannel(SensorParams);
		var error = returnvalue["ErrorCode"];
		var errmsg = returnvalue["ErrorMessage"];
		if (!(error == 0 || error == 1012)) {
			var ex = {
				name: "Unable to find Sensor Channel: " + error,
				message: errmsg
			};
			throw ex;
		}
		var channelInfoMap = returnvalue["ReturnValue"][0];
		var criteria = {
			ChannelInfoMap: channelInfoMap,
			ListeningType: "ChannelData"
		};
		
		if (typeof(successCallback) != 'function') 
			successCallback = function(){
			};
		if (typeof(errorCallback) != 'function') 
			errorCallback = function(){
			};
		
		this.success_callback = successCallback;
		this.error_callback = errorCallback;
		//create a closure to persist this instance of Accelerometer into the RegisterForNofication callback
		var obj = this;
		
		// TODO: this call crashes WRT, but there is no other way to read the accel sensor
		// http://discussion.forum.nokia.com/forum/showthread.php?t=182151&highlight=memory+leak
		this.serviceObj.ISensor.RegisterForNotification(criteria, function(transId, eventCode, result){
			try {
				var criteria = {
					TransactionID: transId
				};
				obj.serviceObj.ISensor.Cancel(criteria);
				
				var accel = new Acceleration(result.ReturnValue.XAxisData, result.ReturnValue.YAxisData, result.ReturnValue.ZAxisData);
				Accelerometer.lastAcceleration = accel;
				
				obj.success_callback(accel);
				
			} 
			catch (ex) {
				obj.serviceObj.ISensor.Cancel(criteria);
				obj.error_callback(ex);
			}
			
		});
	} catch (ex) {
		errorCallback(ex);
	}

};


/**
 * Asynchronously aquires the acceleration repeatedly at a given interval.
 * @param {Function} successCallback The function to call each time the acceleration
 * data is available
 * @param {Function} errorCallback The function to call when there is an error 
 * getting the acceleration data.
 * @param {AccelerationOptions} options The options for getting the accelerometer data
 * such as timeout.
 */

Accelerometer.prototype.watchAcceleration = function(successCallback, errorCallback, options) {
	this.getCurrentAcceleration(successCallback, errorCallback, options);
	// TODO: add the interval id to a list so we can clear all watches
 	var frequency = (options != undefined)? options.frequency : 10000;
	return setInterval(function() {
		navigator.accelerometer.getCurrentAcceleration(successCallback, errorCallback, options);
	}, frequency);
};

/**
 * Clears the specified accelerometer watch.
 * @param {String} watchId The ID of the watch returned from #watchAcceleration.
 */
Accelerometer.prototype.clearWatch = function(watchId) {
	clearInterval(watchId);
};

//gets the Acceleration Service Object from WRT
Accelerometer.prototype.getServiceObj = function() {
	var so;
	
    try {
        so = device.getServiceObject("Service.Sensor", "ISensor");
    } catch (ex) {
		throw {
			name: "DeviceError",
			message: "Could not initialize accel service object (" + ex.name + ": " + ex.message + ")"
		};
    }		
	return so;
};

if (typeof navigator.accelerometer == "undefined") navigator.accelerometer = new Accelerometer();/**
 * This class provides access to the device media, interfaces to both sound and video
 * @constructor
 */
function Audio(src, successCallback, errorCallback) {
	this.src = src;
	this.successCallback = successCallback;
	this.errorCallback = errorCallback;												
}

Audio.prototype.record = function() {
};

Audio.prototype.play = function() {
try {
	if (document.getElementById('gapsound'))
		document.body.removeChild(document.getElementById('gapsound'));
	var obj;
	obj = document.createElement("embed");
	obj.setAttribute("id", "gapsound");
	obj.setAttribute("type", "audio/x-mpeg");
	obj.setAttribute("width", "0");
	obj.setAttribute("width", "0");
	obj.setAttribute("hidden", "true");
	obj.setAttribute("autostart", "true");
	obj.setAttribute("src", this.src);
	document.body.appendChild(obj);
} catch (ex) { debug.log(ex.name + ": " + ex.message); }
};

Audio.prototype.pause = function() {
};

Audio.prototype.stop = function() {
	document.body.removeChild(document.getElementById('gapsound'));
};
/**
 * This class provides access to the device camera.
 * @constructor
 */
function Camera() {
	this.success_callback = null;
	this.error_callback = null;
}

/**
 * We use the Platform Services 2.0 API here. So we must include a portion of the
 * PS 2.0 source code (camera API). 
 * @param {Function} successCallback
 * @param {Function} errorCallback
 * @param {Object} options
 */
Camera.prototype.getPicture = function(successCallback, errorCallback, options){
	try {
		if (!this.serviceObj) {
			this.serviceObj = com.nokia.device.load("", "com.nokia.device.camera", "");
		}
		if (!this.serviceObj) {
			throw {
				name: "CameraError",
				message: "could not load camera service"
			};
		}
		var obj = this;
		
		obj.success_callback = successCallback;
		obj.error_callback = errorCallback;
		this.serviceObj.startCamera( function(transactionID, errorCode, outPut) { 
			//outPut should be an array of image urls (local), or an error code
			if (errorCode == 0) {
				obj.success_callback(outPut);
			}
			else {
				obj.error_callback({
					name: "CameraError",
					message: errorCode
				});
			}
		});
		
	} catch (ex) {
		errorCallback.call(ex);
	}
	
};

if (typeof navigator.camera == "undefined") navigator.camera = new Camera();/*
Copyright © 2009 Nokia. All rights reserved.
Code licensed under the BSD License:
Software License Agreement (BSD License) Copyright © 2009 Nokia.
All rights reserved.
Redistribution and use of this software in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. 
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution. 
Neither the name of Nokia Corporation. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission of Nokia Corporation. 
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

version: 1.0
*/


// utility.js
//
// This file contains some utility functions for S60 providers


// Start an application and wait for it to exit

//TBD: Get rid of this global, use closures instead

DeviceError.prototype = new Error(); //inheritance occurs here
DeviceError.prototype.constructor = DeviceError; //If this not present then, it uses default constructor of Error

//constructor for DeviceError.
function DeviceError(message,code) 
{
	this.toString = concatenate;
	this.code = code;
	this.name = "DeviceException";//we can even overwrite default name "Error"
	this.message=message; 
}

function concatenate()
{
	return (this.name+":"+" "+this.message+" "+this.code);
}

function splitErrorMessage(errmessage)
{
	if(errmessage.search(/:/)!=-1)
	{
		if((errmessage.split(":").length)==2)
		{
			return errmessage.split(":")[1];
		}
		if((errmessage.split(":").length)>2)
		{
			return errmessage.split(":")[2];
		}
	}
	return errmessage;
}


var __s60_start_and_wait_cb;

function __s60_on_app_exit(){
  widget.onshow = null;
  if(__s60_start_and_wait_cb != null){
    __s60_start_and_wait_cb();
  }
}

function __s60_on_app_start(){
  widget.onhide = null;
  widget.onshow = __s60_on_app_exit;
}

// This function cannot actually force JS to wait,
// but it does supply a callback the apps can use
// to continue processing on return from the app.
// Apps should take care not to reinvoke this and
// should be careful about any other processing
// that might happen while the app is running.

function __s60_start_and_wait(id, args, app_exit_cb){
  __s60_start_and_wait_cb = app_exit_cb;
  widget.onhide = __s60_on_app_start;
  widget.openApplication(id, args);
}

function __s60_api_not_supported(){
  throw(err_ServiceNotSupported);
}

function __s60_enumerate_object(object, namespace, func, param){
    var key;
    for(key in object){
       
        var propname;
       	if(namespace){
	    propname = namespace + "." + key;
	}
	else{
	    propname = key;
	}
        var value = object[key];
        if(typeof value == "object"){
	  __s60_enumerate_object(value, propname, func, param);
	}
	else {
	  func(propname,value, param);
	}
    }
}
/*
Copyright © 2009 Nokia. All rights reserved.
Code licensed under the BSD License:
Software License Agreement (BSD License) Copyright © 2009 Nokia.
All rights reserved.
Redistribution and use of this software in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. 
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution. 
Neither the name of Nokia Corporation. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission of Nokia Corporation. 
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

version: 1.0
*/


var __device_debug_on__ = true;
var err_missing_argument = 1003;
var event_cancelled = 3;
var err_bad_argument = 1002;
var err_InvalidService_Argument = 1000;
var err_ServiceNotReady = 1006;
var err_ServiceNotSupported = 1004;

function __device_debug(text){
  //if(__device_debug_on__) alert(text);
}

function __device_handle_exception(e, text){
	__device_debug(text);
	throw(e);
}

function __device_typeof(value)
{
	// First check to see if the value is undefined.
	if (value == undefined) {
        return "undefined";
    }
	// Check for objects created with the "new" keyword.
	if (value instanceof Object) {
		// Check whether it's a string object.
		if (value instanceof String) {
			return "String";
		}
		// Check whether it's an array object/array literal.
		else 
			if (value instanceof Array) {
				return "Array";
			}
	}
	// dealing with a literal.
		if (typeof value) {
			if (typeof value == "object") {
				if (typeof value == "object" && !value) {
					return "null";
				}
			}
           // if not null check for other types
			
				// Check if it's a string literal.
			else if (typeof value == "string") {
					return "string";
				}
		}	 
}


// The top-level service object. It would be nice to use a namespace here 
// (com.nokia.device.service), but emulating namespaces still allows name clashes.
/*
var sp_device = {
        //services: null; // TBD: Make the services list a member of this object?
	load: __device_service_load,
        listServices: __device_service_list,
        listInterfaces: __device_service_interfaces,
        version: "0.1",
        info: "device prototype"
};
*/

if(undefined == com)
    var com={};

if( typeof com != "object")
    throw("com defined as non object");

if(undefined == com.nokia)
    com.nokia = {};

if( typeof com.nokia != "object")
    throw("com.nokia defined as non object");

if(undefined == com.nokia.device)
    com.nokia.device = {
        load: __device_service_load,
        listServices: __device_service_list,
        listInterfaces: __device_service_interfaces,
        version: "0.1",
        info: "device prototype"
        };
else
    throw("com.nokia.device already defined");

com.nokia.device.SORT_ASCENDING = 0;
com.nokia.device.SORT_DESCENDING = 1;

com.nokia.device.SORT_BY_DATE = 0;
com.nokia.device.SORT_BY_SENDER = 1;

com.nokia.device.STATUS_READ = 0;
com.nokia.device.STATUS_UNREAD = 1;


// Configure the services offered.

var __device_services_inited = false;

var __device_services = [

  // For now, the only service is the base "device"" service
  {
    "name":"com.nokia.device",
    "version": 0.1, 
    "interfaces": []
  }
];

// Initialize the configured services.

function __device_services_init(){
  if(__device_services_inited){
    return;
  }
  __device_services_inited = true;

  // Get the service-specific service entries. Note that these
  // need to be individually wrapped by try/catch blocks so that the
  // interpreter gracefully handles missing services. 

  try {
    __device_services[0].interfaces.push(__device_geolocation_service_entry);
  }catch (e){
    __device_debug("Missing library implementation: " + e);
  }
  try {
    __device_services[0].interfaces.push(__device_camera_service_entry);
  }catch (e){
    __device_debug("Missing library implementation: " + e);
  }
  try {
    __device_services[0].interfaces.push(__device_media_service_entry);
  }catch (e){
//    __device_debug("Missing library implementation: " + e);
  }
  try {
    __device_services[0].interfaces.push(__device_contacts_service_entry);
  }catch (e){
//    __device_debug("Missing library implementation: " + e);
  }
 try {
    __device_services[0].interfaces.push(__device_messaging_service_entry);
  }catch (e){
      __device_debug("Missing library implementation: " + e);
  }
  try {
    __device_services[0].interfaces.push(__device_calendar_service_entry);
  }catch (e){
      __device_debug("Missing library implementation: " + e);
  }
  try {
    __device_services[0].interfaces.push(__device_landmarks_service_entry);
  }catch (e){
      __device_debug("Missing library implementation: " + e);
  }
  try {
    __device_services[0].interfaces.push(__device_event_service_entry);
  }catch (e){
      __device_debug("Missing library implementation: " + e);
  }
  try {
    __device_services[0].interfaces.push(__device_sysinfo_service_entry);
  }catch (e){
      __device_debug("Missing library implementation: " + e);
  }
  try {
    __device_services[0].interfaces.push(__device_sensors_service_entry);
  }catch (e){
      __device_debug("Missing library implementation: " + e);
  }

}

function __device_get_implementation(i){
  //__device_debug("get_implementation: " + i);
  return  new i.proto(new(i.providers[0].instance));
}

function __device_get_descriptor(i){
  //__device_debug("get_descriptor: " + i);
  return new i.descriptor(new(i.providers[0].descriptor));
}

function __device_get_interface(s, interfaceName, version){
  //__device_debug("get_interface: " + s + " " + interfaceName);
  var i = s.interfaces;
  if((interfaceName == null) || (interfaceName == '')){
    // Interface name not specified, get first interface, ignoring version
    return __device_get_implementation(i[0]);
  }

  // Find first match of name and version
  for (var d in i){
  
    if(i[d].name == null){
      __device_update_descriptor(i[d]);
    }
    if(i[d].name == undefined){
      continue;
    }
    if (i[d].name == interfaceName){
      // Match version if specified
      if ((version == null) || (version == '') || (i[d].version >= version)){
	return __device_get_implementation(i[d]);
      }
    }
  }
  return null;
}

// Implemention of the load method

function __device_service_load(serviceName, interfaceName, version){

  __device_services_init();
  
  // Service name is specified
   if ((serviceName != null) && (serviceName != '') &&(serviceName != "*")){
    for(var s in __device_services){
      if (serviceName == __device_services[s].name){
	return __device_get_interface(__device_services[s], interfaceName, version);
      }
    }
  // Service name not specified, get first implementation 
  } else {
    //__device_debug("Trying to get interface implementations: ");
    for(var s in __device_services){
      //__device_debug("service_load: " + s + ":" +  __device_services[s].name + ": " + interfaceName);
      var i = __device_get_interface(__device_services[s], interfaceName, version);
      if (i != null){
	return i;
      }
    }
  }
  return null;
}

// Lazily fill in the descriptor table

function __device_update_descriptor(i){
  var d = __device_get_descriptor(i);
  i.name = d.interfaceName;
  i.version = d.version;  
}
// Get an array of interface descriptors for a service

function __device_interface_list(s){
  var retval = new Array();
  for(var i in s.interfaces){
    if(s.interfaces[i].name == null){
      __device_update_descriptor(s.interfaces[i]);
    }
    if(s.interfaces[i].name == undefined){
      continue;
    }
    retval[i] = new Object();
    retval[i].name = s.interfaces[i].name;
    retval[i].version = s.interfaces[i].version;
  }  
  return retval;
}

// Get a service description

function __device_service_descriptor(s){
  this.name = s.name;
  this.version = s.version;
  this.interfaces = __device_interface_list(s);
  this.toString = __device_service_descriptor_to_string;
}

function __device_service_descriptor_to_string(){
  var is = "\nInterfaces(s): ";

  for (i in this.interfaces){
    is += "\n" + this.interfaces[i].name + " " + this.interfaces[0].version;
  }
  return ("Service: " + this.name + is);
}

// Implement the listServices method 

function __device_service_list(serviceName, interfaceName, version){
  //__device_debug("__device_service_list: " + serviceName + " " + interfaceName);
  __device_services_init();
  var retval = new Array();
  var n = 0;
  
  //Treat empty service and interface names as wildcards
  if ((serviceName == null)|| (serviceName == '')/* || (serviceName == undefined)*/){
    serviceName = ".*"; 
  }
  if ((interfaceName == null) || (interfaceName == '') /*|| (serviceName == undefined)*/){
    interfaceName = ".*";
  }
 
  if ((typeof serviceName != "string") || (typeof interfaceName != "string")) {
  	return retval;
  }
  
  // This method does regular expression matching of service and interface

  var sregx = new RegExp(serviceName);
  var iregx = new RegExp(interfaceName);
 
  for(var s in __device_services){
   //__device_debug (serviceName + "==" + __device_services[s].name + "?:" + sregx.test(__device_services[s].name));
    if (sregx.test(__device_services[s].name)){
      // Find the first matching interface 
        
      for(var i in __device_services[s].interfaces){
        if(__device_services[s].interfaces[i].name == null){
          __device_update_descriptor(__device_services[s].interfaces[i]);
	}
        if(__device_services[s].interfaces[i].name == undefined){
	  continue;
	}
	//__device_debug (interfaceName + "==" + __device_services[s].interfaces[i].name + "?:" + iregx.test(__device_services[s].interfaces[i].name));
	if (iregx.test(__device_services[s].interfaces[i].name)){
	  if ((version == null) || (version == '') || (__device_services[s].interfaces[i].version >= version)){
            // An interface matched, we're done.
            retval[n] = new __device_service_descriptor(__device_services[s]);
            break; 
	  }
	}
      }
    }
    ++n;
  }
  return retval;
}

// Implement the listInterfaces method
    
function __device_service_interfaces(serviceName){
  __device_services_init();
  if(serviceName==null||serviceName==undefined||serviceName==''){
  	throw new DeviceError("Framework: listInterfaces: serviceName is missing", err_missing_argument);
  }
  for (var s in __device_services){
    if(__device_services[s].name == serviceName){
      return __device_interface_list(__device_services[s]);
    }
  }
  return null;
}

function modifyObjectBaseProp(obj){
  for (pro in obj) {
    if(typeof obj[pro] == "function" )
      obj[pro] = 0;
    }
};
/*
Copyright © 2009 Nokia. All rights reserved.
Code licensed under the BSD License:
Software License Agreement (BSD License) Copyright © 2009 Nokia.
All rights reserved.
Redistribution and use of this software in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. 
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution. 
Neither the name of Nokia Corporation. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission of Nokia Corporation. 
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

version: 1.0
*/


// S60 sp-based camera provider

function __sp_camera_descriptor(){
  //__device_debug("sp_camera_descriptor");
  //Read-only properties
  this.interfaceName = "com.nokia.device.camera";
  this.version = "0.1";
  //Class-static properties 
}

// TBD make local to closure funcs
var __sp_camera_start_date;

function __sp_camera_instance(){
  //__device_debug("sp_camera_instance");
  //Descriptor
  this.descriptor = new __sp_camera_descriptor();
  //Core methods
  this.startCamera = __sp_startCamera;
  this.stopViewfinder = __s60_api_not_supported;
  //Extended methods
  this.takePicture = __s60_api_not_supported;
  //Private data
}

var CAMERA_APP_ID = 0x101f857a;

//Apps should take care that this is not reinvoked
//while the viewfinder is running. 

function __sp_startCamera(camera_cb){

	//If callback is null , then return missing argument error
    if( camera_cb == null )
        throw new DeviceError("Camera:startCamera:callback is missing", err_missing_argument);
        
	//If the callback is not a function, then return bad type error
	if( typeof(camera_cb) != "function" )
	    throw new DeviceError("Camera:startCamera:callback is a non-function", err_bad_argument);

  var finished = function (){
    var invoker = function (arg1, arg2, arg3){
      //__device_debug("invoker with: " + camera_cb);
      var it = arg3.ReturnValue;
      var item;
      var items = new Array();
      while (( item = it.getNext()) != undefined){
          var d = new Date(Date.parse(item.FileDate));
          //__device_debug(item.FileName + " " + d );
          // Items returned in reverse date order, so stop iterating before
          // reaching initial date. (Should be able to do this more efficiently
          // with sp filter, but that doesn't seem to work right now.)
          if (d > __sp_camera_start_date) {
              var pathname = item.FileNameAndPath.replace(/\\/g, "/");
              var fileScheme = "file:///";
              //Non-patched builds don't allow file scheme TBD: change this for patched builds
              items.unshift(fileScheme + pathname);
          }
      }
      var dummyTransID = 0;
      var dummyStatusCode = 0;
      camera_cb(dummyTransID, dummyStatusCode, items);
    };

    
    //When camera returns, get the image(s) created
    try {
      var mso = device.getServiceObject("Service.MediaManagement", "IDataSource");
    }
    catch(e) {
      __device_handle_exception (e, "media service not available : " + e);
    }
    
    var criteria = new Object();
	modifyObjectBaseProp(criteria);
    criteria.Type = 'FileInfo';
    criteria.Filter = new Object();
	modifyObjectBaseProp(criteria.Filter);
    criteria.Filter.FileType = 'Image';
    //criteria.Filter.Key = 'FileDate';
    //criteria.Filter.StartRange = null;
    //criteria.Filter.EndRange = null;
    criteria.Sort = new Object();
	modifyObjectBaseProp(criteria.Sort);
    criteria.Sort.Key = 'FileDate';
    criteria.Sort.Order = 'Descending';
    
    try {
      var rval = mso.IDataSource.GetList(criteria, invoker);
    }
    catch (e) {
      __device_handle_exception (e, "media service GetList failed: " + e);
    }
  };

  __sp_camera_start_date = new Date();
  __s60_start_and_wait(CAMERA_APP_ID, "", finished);
  var dummyTid = 0;
  return dummyTid;
}


/*
Copyright © 2009 Nokia. All rights reserved.
Code licensed under the BSD License:
Software License Agreement (BSD License) Copyright © 2009 Nokia.
All rights reserved.
Redistribution and use of this software in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. 
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution. 
Neither the name of Nokia Corporation. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission of Nokia Corporation. 
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

version: 1.0
*/


// Camera service interface

var __device_camera_service_entry =  {"name": null, 
					 "version": null,
					 "proto": __device_camera,
					 "descriptor": __device_camera_descriptor,
					 "providers": [{"descriptor": __sp_camera_descriptor, "instance": __sp_camera_instance}]
					};

function __device_camera_descriptor(provider){
  this.interfaceName = provider.interfaceName;
  this.version = provider.version;
}


// Private camera  prototype: called from service factory
function __device_camera(provider){
  //Private properties
  this.provider = provider;
  //Read-only properties
  this.interfaceName = provider.descriptor.interfaceName;
  this.version = provider.descriptor.version;
 // this.supportedMediaTypes = provider.supportedMediaTypes;
 // this.supportedSizes = provider.supportedSizes;
  //Core methods
  this.startCamera = __device_camera_startCamera;
  this.stopViewfinder = __device_camera_stopViewfinder;
  //Extended methods
  this.takePicture = __device_camera_takePicture;
}


//Why bother to define these methods? Because the camera
//object defines the contract for providers!

function __device_camera_startCamera(camera_cb){
  return this.provider.startCamera(camera_cb);
}

function __device_camera_stopViewfinder(){
  this.provider.stopViewfinder();
}

function __device_camera_takePicture(format){
  this.provider.takePicture(format);
}
/**
 * This class provides access to the device contacts.
 * @constructor
 */

function Contacts() {
	
}

function Contact() {
	this.id = null;
	this.name = { 
		formatted: "",
		givenName: "",
		familyName: ""
	};
    this.phones = [];
    this.emails = [];
}

Contact.prototype.displayName = function()
{
    // TODO: can be tuned according to prefs
	return this.givenName + " " + this.familyName;
};

/*
 * @param {ContactsFilter} filter Object with filter properties. filter.name only for now.
 * @param {function} successCallback Callback function on success
 * @param {function} errorCallback Callback function on failure
 * @param {object} options Object with properties .page and .limit for paging
 */

Contacts.prototype.find = function(filter, successCallback, errorCallback, options) {
	try {
		this.contactsService = device.getServiceObject("Service.Contact", "IDataSource");
		if (typeof options == 'object')
			this.options = options;
		else
			this.options = {};
		
		var criteria = new Object();
		criteria.Type = "Contact";
		if (filter && filter.name) {
			var searchTerm = '';
			if (filter.name.givenName && filter.name.givenName.length > 0) {
				searchTerm += filter.name.givenName;
			}
			if (filter.name.familyName && filter.name.familyName.length > 0) {
				searchTerm += searchTerm.length > 0 ? ' ' + filter.name.familyName : filter.name.familyName;
			}
			if (!filter.name.familyName && !filter.name.givenName && filter.name.formatted) {
				searchTerm = filter.name.formatted;
			}
			criteria.Filter = { SearchVal: searchTerm };
		}
		
		if (typeof(successCallback) != 'function') 
			successCallback = function(){};
		if (typeof(errorCallback) != 'function') 
			errorCallback = function(){};
		if (isNaN(this.options.limit))
			this.options.limit = 200;
		if (isNaN(this.options.page))
			this.options.page = 1;
		
		//need a closure here to bind this method to this instance of the Contacts object
		this.global_success = successCallback;
		var obj = this;
		
		//WRT: result.ReturnValue is an iterator of contacts
		this.contactsService.IDataSource.GetList(criteria, function(transId, eventCode, result){
			obj.success_callback(result.ReturnValue);
		});
	} 
	catch (ex) {
		alert(ex.name + ": " + ex.message);
		errorCallback(ex);
	}
};

Contacts.prototype.success_callback = function(contacts_iterator) {
	try {
	var gapContacts = new Array();
	if (contacts_iterator) {
		contacts_iterator.reset();
		var contact;
		var i = 0;
		var end = this.options.page * this.options.limit;
		var start = end - this.options.limit;
		while ((contact = contacts_iterator.getNext()) != undefined && i < end) {
			try {
				if (i >= start) {
					var gapContact = new Contact();
					gapContact.name.givenName = Contacts.GetValue(contact, "FirstName");
					gapContact.name.familyName = Contacts.GetValue(contact, "LastName");
					gapContact.name.formatted = gapContact.name.givenName + " " + gapContact.name.familyName;
					gapContact.emails = Contacts.getEmailsList(contact);
					gapContact.phones = Contacts.getPhonesList(contact);
					gapContact.address = Contacts.getAddress(contact);
					gapContact.id = Contacts.GetValue(contact, "id");
					gapContacts.push(gapContact);
				}
				i++;
			} catch (e) {
				alert("ContactsError (" + e.name + ": " + e.message + ")");
			}
		}
	}
	this.contacts = gapContacts;
	this.global_success(gapContacts);
	} catch (ex) { alert(ex.name + ": " + ex.message); }
};

Contacts.getEmailsList = function(contact) {
	var emails = new Array();
	try {
			emails[0] = { type:"General", address: Contacts.GetValue(contact, "EmailGen") };
			emails[1] = { type:"Work", address: Contacts.GetValue(contact, "EmailWork") };		
			emails[2] = { type:"Home", address: Contacts.GetValue(contact, "EmailHome") };
	} catch (e) {
		emails = [];
	}
	return emails;
};

Contacts.getPhonesList = function(contact) {
	var phones = new Array();
	try {
			phones[0] = { type:"Mobile", number: Contacts.GetValue(contact, "MobilePhoneGen") };
			phones[1] = { type:"Home", number: Contacts.GetValue(contact, "LandPhoneGen") };
			phones[2] = { type:"Fax", number: Contacts.GetValue(contact, "FaxNumberGen") };
			phones[3] = { type:"Work", number: Contacts.GetValue(contact, "LandPhoneWork") };
			phones[4] = { type:"WorkMobile", number: Contacts.GetValue(contact, "MobilePhoneWork") };
	} catch (e) {
		phones = [];
	}
	return phones;
};

Contacts.getAddress = function(contact) {
	var address = "";
	try {
		address = Contacts.GetValue(contact, "AddrLabelHome") + ", " + Contacts.GetValue(contact, "AddrStreetHome") + ", " +
				Contacts.GetValue(contact, "AddrLocalHome") + ", " + Contacts.GetValue(contact, "AddrRegionHome") + ", " + 
				Contacts.GetValue(contact, "AddrPostCodeHome") + ", " + Contacts.GetValue(contact, "AddrCountryHome");
	} catch (e) {
		address = "";
	}
	return address;
};

Contacts.GetValue = function(contactObj, key) {
	try {
		return contactObj[key]["Value"];
	} catch (e) {
		return "";
	}
};

if (typeof navigator.contacts == "undefined") navigator.contacts = new Contacts();
/**
 * This class provides access to the debugging console.
 * @constructor
 */
function DebugConsole() {
}

/**
 * Print a normal log message to the console
 * @param {Object|String} message Message or object to print to the console
 */
DebugConsole.prototype.log = function(message) {
	
	//This ends up in C:\jslog_widget.log on the device
	console.log(message);
};

/**
 * Print a warning message to the console
 * @param {Object|String} message Message or object to print to the console
 */
DebugConsole.prototype.warn = function(message) {
	console.log(message);
};

/**
 * Print an error message to the console
 * @param {Object|String} message Message or object to print to the console
 */
DebugConsole.prototype.error = function(message) {
	console.log(message);
};

if (typeof window.debug == "undefined") window.debug = new DebugConsole();
PhoneGap.ExtendWrtDeviceObj = function(){
	
	if (!window.device)
		window.device = {};
	navigator.device = window.device;

	try {
	
		if (window.menu)
	    	window.menu.hideSoftkeys();
		
		device.available = PhoneGap.available;
		device.platform = null;
		device.version = null;
		device.name = null;
		device.uuid = null;
		
		var so = device.getServiceObject("Service.SysInfo", "ISysInfo");
		var pf = PhoneGap.GetWrtPlatformVersion(so);
		device.platform = pf.platform;
		device.version = pf.version;
		device.uuid = PhoneGap.GetWrtDeviceProperty(so, "IMEI");
		device.name = PhoneGap.GetWrtDeviceProperty(so, "PhoneModel");
	} 
	catch (e) {
		alert(e.name + ": " + e.message);
		device.available = false;
	}
};

PhoneGap.GetWrtDeviceProperty = function(serviceObj, key) {
	var criteria = { "Entity": "Device", "Key": key };
	var result = serviceObj.ISysInfo.GetInfo(criteria);
	if (result.ErrorCode == 0) {
		return result.ReturnValue.StringData;
	}
	else {
		return null;
	}
};

PhoneGap.GetWrtPlatformVersion = function(serviceObj) {
	var criteria = { "Entity": "Device", "Key": "PlatformVersion" };
	var result = serviceObj.ISysInfo.GetInfo(criteria);
	if (result.ErrorCode == 0) {
		var version = {};
		version.platform = result.ReturnValue.MajorVersion;
		version.version = result.ReturnValue.MinorVersion;
		return version;
	}
	else {
		return null;
	}
};

PhoneGap.ExtendWrtDeviceObj();/**
 * This class provides access to device GPS data.
 * @constructor
 */
function Geolocation() {
    /**
     * The last known GPS position.
     */
    this.lastPosition = null;
    this.lastError = null;
    this.callbacks = {
        onLocationChanged: [],
        onError:           []
    };
};

/**
 * Asynchronously aquires the current position.
 * @param {Function} successCallback The function to call when the position
 * data is available
 * @param {Function} errorCallback The function to call when there is an error 
 * getting the position data.
 * @param {PositionOptions} options The options for getting the position data
 * such as timeout.
 */
Geolocation.prototype.getCurrentPosition = function(successCallback, errorCallback, options) {
    var referenceTime = 0;
    if (this.lastPosition)
        referenceTime = this.lastPosition.timestamp;
    else
        this.start(options);

    var timeout = 20000;
    var interval = 500;
    if (typeof(options) == 'object' && options.interval)
        interval = options.interval;

    if (typeof(successCallback) != 'function')
        successCallback = function() {};
    if (typeof(errorCallback) != 'function')
        errorCallback = function() {};

    var dis = this;
    var delay = 0;
    var timer = setInterval(function() {
        delay += interval;
		//if we have a new position, call success and cancel the timer
        if (dis.lastPosition && dis.lastPosition.timestamp > referenceTime) {
            successCallback(dis.lastPosition);
            clearInterval(timer);
        } else if (delay >= timeout) { //else if timeout has occured then call error and cancel the timer
            errorCallback();
            clearInterval(timer);
        }
		//else the interval gets called again
    }, interval);
};

/**
 * Asynchronously aquires the position repeatedly at a given interval.
 * @param {Function} successCallback The function to call each time the position
 * data is available
 * @param {Function} errorCallback The function to call when there is an error 
 * getting the position data.
 * @param {PositionOptions} options The options for getting the position data
 * such as timeout and the frequency of the watch.
 */
Geolocation.prototype.watchPosition = function(successCallback, errorCallback, options) {
	// Invoke the appropriate callback with a new Position object every time the implementation 
	// determines that the position of the hosting device has changed. 
	this.getCurrentPosition(successCallback, errorCallback, options);
	var frequency = 10000;
        if (typeof options == 'object' && options.frequency)
            frequency = options.frequency;
	var that = this;
	return setInterval(function() {
		that.getCurrentPosition(successCallback, errorCallback, options);
	}, frequency);
};


/**
 * Clears the specified position watch.
 * @param {String} watchId The ID of the watch returned from #watchPosition.
 */
Geolocation.prototype.clearWatch = function(watchId) {
	clearInterval(watchId);
};

Geolocation.prototype.start = function(options) {
	var so = device.getServiceObject("Service.Location", "ILocation");
	
	//construct the criteria for our location request
	var updateOptions = new Object();
	// Specify that location information need not be guaranteed. This helps in
	// that the widget doesn't need to wait for that information possibly indefinitely.
	updateOptions.PartialUpdates = true;
	
	//default 15 seconds
	if (typeof(options) == 'object' && options.timeout) 
		//options.timeout in in ms, updateOptions.UpdateTimeout in microsecs
		updateOptions.UpdateTimeOut = options.timeout * 1000;

	//default 1 second
	if (typeof(options) == 'object' && options.interval) 
		//options.timeout in in ms, updateOptions.UpdateTimeout in microsecs
		updateOptions.UpdateInterval = options.interval * 1000;
	
	// Initialize the criteria for the GetLocation call
	var trackCriteria = new Object();
	// could use "BasicLocationInformation" or "GenericLocationInfo"
	trackCriteria.LocationInformationClass = "GenericLocationInfo";
	trackCriteria.Updateoptions = updateOptions;
	
	var dis = this;
	so.ILocation.Trace(trackCriteria, function(transId, eventCode, result) {
		var retVal = result.ReturnValue;

		if (result.ErrorCode != 0 || isNaN(retVal.Latitude))
			return;
		
		// heading options: retVal.TrueCourse, retVal.MagneticHeading, retVal.Heading, retVal.MagneticCourse
		// but retVal.Heading was the only field being returned with data on the test device (Nokia 5800)
		// WRT does not provide accuracy
		var newCoords = new Coordinates(retVal.Latitude, retVal.Longitude, retVal.Altitude, null, retVal.Heading, retVal.HorizontalSpeed);
		var positionObj = { coords: newCoords, timestamp: (new Date()).getTime() };

		dis.lastPosition = positionObj;
	});
	
};


if (typeof navigator.geolocation == "undefined") navigator.geolocation = new Geolocation();

/**
 * This class provides access to native mapping applications on the device.
 */
function Map() {
	
}

/**
 * Shows a native map on the device with pins at the given positions.
 * @param {Array} positions
 */
Map.prototype.show = function(positions) {

	var err = "map api is unimplemented on symbian.wrt";
	debug.log(err);
	return { name: "MapError", message: err };

};

if (typeof navigator.map == "undefined") navigator.map = new Map();
function Network() {
    /**
     * The last known Network status.
     */
	this.lastReachability = null;
};

Network.prototype.isReachable = function(hostName, successCallback, options) {
	var req = new XMLHttpRequest();  
   	req.open('GET', hostName, true);  
   	req.onreadystatechange = function (aEvt) {  
     	if (req.readyState == 4) {  
        	if(req.status == 200)  
        		successCallback(NetworkStatus.REACHABLE_VIA_CARRIER_DATA_NETWORK);
         	else  
          		successCallback(NetworkStatus.NOT_REACHABLE);
 		}  
  	};  
  	req.send(null);

};

/**
 * This class contains information about any NetworkStatus.
 * @constructor
 */
function NetworkStatus() {
	this.code = null;
	this.message = "";
}

NetworkStatus.NOT_REACHABLE = 0;
NetworkStatus.REACHABLE_VIA_CARRIER_DATA_NETWORK = 1;
NetworkStatus.REACHABLE_VIA_WIFI_NETWORK = 2;

if (typeof navigator.network == "undefined") navigator.network = new Network();
/**
 * This class provides access to notifications on the device.
 */
function Notification() {
	
}

Notification.prototype.vibrate = function(mills)
{
	
	if (!Notification.getSysinfoObject())
		Notification.embedSysinfoObject();
	
	this.sysinfo = Notification.getSysinfoObject();
	this.sysinfo.startvibra(mills, 100);
};

//TODO: this is not beeping
Notification.prototype.beep = function(count, volume)
{
	if (!Notification.getSysinfoObject())
		Notification.embedSysinfoObject();
	
	this.sysinfo = Notification.getSysinfoObject();	
	this.sysinfo.beep(220,2000);
};


/**
 * Open a native alert dialog, with a customizable title and button text.
 * @param {String} message Message to print in the body of the alert
 * @param {String} [title="Alert"] Title of the alert dialog (default: Alert)
 * @param {String} [buttonLabel="OK"] Label of the close button (default: OK)
 */
Notification.prototype.alert = function(message, title, buttonLabel) {
    // Default is to use a browser alert; this will use "index.html" as the title though
    alert(message);
};

/**
 * Start spinning the activity indicator on the statusbar
 */
Notification.prototype.activityStart = function() {
};

/**
 * Stop spinning the activity indicator on the statusbar, if it's currently spinning
 */
Notification.prototype.activityStop = function() {
};

/**
 * Causes the device to blink a status LED.
 * @param {Integer} count The number of blinks.
 * @param {String} colour The colour of the light.
 */
Notification.prototype.blink = function(count, colour) {
	
};

Notification.embedSysinfoObject = function() {
	var el = document.createElement("embed");
	el.setAttribute("type", "application/x-systeminfo-widget");
	el.setAttribute("hidden", "yes");
	document.getElementsByTagName("body")[0].appendChild(el);
	return;
};

Notification.getSysinfoObject = function() {
	return document.embeds[0];
};

if (typeof navigator.notification == "undefined") navigator.notification = new Notification();
/**
 * This class provides access to the device orientation.
 * @constructor
 */
function Orientation() {
	/**
	 * The current orientation, or null if the orientation hasn't changed yet.
	 */
	this.currentOrientation = null;
}

/**
 * Set the current orientation of the phone.  This is called from the device automatically.
 * 
 * When the orientation is changed, the DOMEvent \c orientationChanged is dispatched against
 * the document element.  The event has the property \c orientation which can be used to retrieve
 * the device's current orientation, in addition to the \c Orientation.currentOrientation class property.
 *
 * @param {Number} orientation The orientation to be set
 */
Orientation.prototype.setOrientation = function(orientation) {
		if (orientation == this.currentOrientation) 
			return;
		var old = this.currentOrientation;

		this.currentOrientation = orientation;
		var e = document.createEvent('Events');
		e.initEvent('orientationChanged', 'false', 'false');
		e.orientation = orientation;
		e.oldOrientation = old;
		document.dispatchEvent(e);
};

/**
 * Asynchronously aquires the current orientation.
 * @param {Function} successCallback The function to call when the orientation
 * is known.
 * @param {Function} errorCallback The function to call when there is an error 
 * getting the orientation.
 */
Orientation.prototype.getCurrentOrientation = function(successCallback, errorCallback) {
	// If the orientation is available then call success
	// If the orientation is not available then call error
	try {
		if (!this.serviceObj) 
			this.serviceObj = this.getServiceObj();
		
		if (this.serviceObj == null) 
			errorCallback({
				name: "DeviceErr",
				message: "Could not initialize service object"
			});
		
		//get the sensor channel
		var SensorParams = {
			SearchCriterion: "Orientation"
		};
		var returnvalue = this.serviceObj.ISensor.FindSensorChannel(SensorParams);
		
		var error = returnvalue["ErrorCode"];
		var errmsg = returnvalue["ErrorMessage"];
		if (!(error == 0 || error == 1012)) {
			var ex = {
				name: "Unable to find Sensor Channel: " + error,
				message: errmsg
			};
			errorCallback(ex);
		}
		var channelInfoMap = returnvalue["ReturnValue"][0];
		var criteria = {
			ChannelInfoMap: channelInfoMap,
			ListeningType: "ChannelData"
		};
		
		if (typeof(successCallback) != 'function') 
			successCallback = function(){
			};
		if (typeof(errorCallback) != 'function') 
			errorCallback = function(){
			};
		
		this.success_callback = successCallback;
		this.error_callback = errorCallback;
		
		//create a closure to persist this instance of orientation object into the RegisterForNofication callback
		var obj = this;
		
		// TODO: this call crashes WRT, but there is no other way to read the orientation sensor
		// http://discussion.forum.nokia.com/forum/showthread.php?t=182151&highlight=memory+leak
		this.serviceObj.ISensor.RegisterForNotification(criteria, function(transId, eventCode, result){
			var criteria = {
				TransactionID: transId
			};
			try {
				//var orientation = result.ReturnValue.DeviceOrientation;
				obj.serviceObj.ISensor.Cancel(criteria);
				
				var orientation = null;
				switch (result.ReturnValue.DeviceOrientation) {
					case "DisplayUpwards": orientation = DisplayOrientation.FACE_UP; break;
					case "DisplayDownwards": orientation = DisplayOrientation.FACE_DOWN; break;
					case "DisplayUp": orientation = DisplayOrientation.PORTRAIT; break;
					case "DisplayDown": orientation = DisplayOrientation.REVERSE_PORTRAIT; break;
					case "DisplayRightUp": orientation = DisplayOrientation.LANDSCAPE_RIGHT_UP; break;
					case "DisplayLeftUp": orientation = DisplayOrientation.LANDSCAPE_LEFT_UP; break;
					
				}
				
				obj.setOrientation(orientation);
				
				obj.success_callback(orientation);
				
			} 
			catch (ex) {
				obj.serviceObj.ISensor.Cancel(criteria);
				obj.error_callback(ex);
			}
			
		});
	} catch (ex) {
		errorCallback({ name: "OrientationError", message: ex.name + ": " + ex.message });
	}
};

/**
 * Asynchronously aquires the orientation repeatedly at a given interval.
 * @param {Function} successCallback The function to call each time the orientation
 * data is available.
 * @param {Function} errorCallback The function to call when there is an error 
 * getting the orientation data.
 */
Orientation.prototype.watchOrientation = function(successCallback, errorCallback, options) {
	// Invoke the appropriate callback with a new Position object every time the implementation 
	// determines that the position of the hosting device has changed. 
	this.getCurrentOrientation(successCallback, errorCallback);
	var frequency = (options != undefined)? options.frequency : 1000;
	return setInterval(function() {
		navigator.orientation.getCurrentOrientation(successCallback, errorCallback);
	}, frequency);
};

/**
 * Clears the specified orientation watch.
 * @param {String} watchId The ID of the watch returned from #watchOrientation.
 */
Orientation.prototype.clearWatch = function(watchId) {
	clearInterval(watchId);
};

//gets the Acceleration Service Object from WRT
Orientation.prototype.getServiceObj = function() {
	var so;
	
    try {
        so = device.getServiceObject("Service.Sensor", "ISensor");
    } catch (ex) {
		throw {
			name: "DeviceError",
			message: ex.name + ": " + ex.message
		};
    }		
	return so;
};


/**
 * This class encapsulates the possible orientation values.
 * @constructor
 */
function DisplayOrientation() {
	this.code = null;
	this.message = "";
}

DisplayOrientation.PORTRAIT = 0;
DisplayOrientation.REVERSE_PORTRAIT = 1;
DisplayOrientation.LANDSCAPE_LEFT_UP = 2;
DisplayOrientation.LANDSCAPE_RIGHT_UP = 3;
DisplayOrientation.FACE_UP = 4;
DisplayOrientation.FACE_DOWN = 5;

if (typeof navigator.orientation == "undefined") navigator.orientation = new Orientation();
/**
 * This class contains position information.
 * @param {Object} lat
 * @param {Object} lng
 * @param {Object} acc
 * @param {Object} alt
 * @param {Object} altacc
 * @param {Object} head
 * @param {Object} vel
 * @constructor
 */
function Position(coords, timestamp) {
	this.coords = coords;
        this.timestamp = new Date().getTime();
}

function Coordinates(lat, lng, alt, acc, head, vel) {
	/**
	 * The latitude of the position.
	 */
	this.latitude = lat;
	/**
	 * The longitude of the position,
	 */
	this.longitude = lng;
	/**
	 * The accuracy of the position.
	 */
	this.accuracy = acc;
	/**
	 * The altitude of the position.
	 */
	this.altitude = alt;
	/**
	 * The direction the device is moving at the position.
	 */
	this.heading = head;
	/**
	 * The velocity with which the device is moving at the position.
	 */
	this.speed = vel;
}

/**
 * This class specifies the options for requesting position data.
 * @constructor
 */
function PositionOptions() {
	/**
	 * Specifies the desired position accuracy.
	 */
	this.enableHighAccuracy = true;
	/**
	 * The timeout after which if position data cannot be obtained the errorCallback
	 * is called.
	 */
	this.timeout = 10000;
}

/**
 * This class contains information about any GSP errors.
 * @constructor
 */
function PositionError() {
	this.code = null;
	this.message = "";
}

PositionError.UNKNOWN_ERROR = 0;
PositionError.PERMISSION_DENIED = 1;
PositionError.POSITION_UNAVAILABLE = 2;
PositionError.TIMEOUT = 3;
/**
 * This class provides access to the device SMS functionality.
 * @constructor
 */
function Sms() {

}

/**
 * Sends an SMS message.
 * @param {Integer} number The phone number to send the message to.
 * @param {String} message The contents of the SMS message to send.
 * @param {Function} successCallback The function to call when the SMS message is sent.
 * @param {Function} errorCallback The function to call when there is an error sending the SMS message.
 * @param {PositionOptions} options The options for accessing the GPS location such as timeout and accuracy.
 */
Sms.prototype.send = function(number, message, successCallback, errorCallback, options) {
    try {
		if (!this.serviceObj)
			this.serviceObj = this.getServiceObj();
			
	    // Setup input params using dot syntax
	    var criteria = new Object();
	    criteria.MessageType = 'SMS';
	    criteria.To = number;
	    criteria.BodyText = message;

      	var result = this.serviceObj.IMessaging.Send(criteria);
    	if (result.ErrorCode != 0 && result.ErrorCode != "0")
		{
			var exception = { name: "SMSError", message: result.ErrorMessage };
			throw exception;
		} else {
			successCallback.call();
		}
    }
  	catch(ex)
  	{
		errorCallback.call({ name: "SmsError", message: ex.name + ": " + ex.message });
  	}

};


//gets the Sms Service Object from WRT
Sms.prototype.getServiceObj = function() {
	var so;
	
    try {
        so = device.getServiceObject("Service.Messaging", "IMessaging");
    } catch (ex) {
		throw {
			name: "SmsError",
			message: "Failed to load sms service (" + ex.name + ": " + ex.message + ")"
		};
    }		
	return so;
};

if (typeof navigator.sms == "undefined") navigator.sms = new Sms();/**
 * @author ryan
 */

function Storage() {
	this.available = true;
	this.serialized = null;
	this.items = null;
	
	if (!window.widget) {
		this.available = false;
		return;
	}
	var pref = window.widget.preferenceForKey(Storage.PREFERENCE_KEY);
	
	//storage not yet created
	if (pref == "undefined" || pref == undefined) {
		this.length = 0;
		this.serialized = "({})";
		this.items = {};
		window.widget.setPreferenceForKey(this.serialized, Storage.PREFERENCE_KEY);
	} else {
		this.serialized = pref;'({"store_test": { "key": "store_test", "data": "asdfasdfs" },})';
		this.items = eval(this.serialized);
	}
}

Storage.PREFERENCE_KEY = "phonegap_storage_pref_key";

Storage.prototype.index = function (key) {
	
};

Storage.prototype.getItem = function (key) {
	try {
		return this.items[key].data;
	} catch (ex) {
		return null;
	}
};

Storage.prototype.setItem = function (key, data) {

	this.items[key] = {
		"key": key,
		"data": data
	};
	
	this.serialize();
};

Storage.prototype.removeItem = function (key) {

	if (this.items[key]) {
		this.items[key] = undefined;
	}
	this.serialize();
};

Storage.prototype.clear = function () {
	this.serialized = "({})";
	this.items = {};
	this.serialize();
};

Storage.prototype.serialize = function() {
	var json = "";
	
	for (key in this.items) {
		var item = this.items[key];
		if (typeof item != "undefined") {
			json += "\"" + item.key + "\": { \"key\": \"" + item.key + "\", \"data\": \"" + item.data + "\" }, ";
		}
	}
	this.serialized = "({" + json + "})";

	window.widget.setPreferenceForKey( this.serialized, Storage.PREFERENCE_KEY);
};

if (typeof navigator.storage == "undefined" ) navigator.storage = new Storage();
/**
 * This class provides access to the telephony features of the device.
 * @constructor
 */
function Telephony() {
	this.number = "";
}

/**
 * Calls the specifed number.
 * @param {Integer} number The number to be called.
 */
Telephony.prototype.send = function(number) {
	widget.openURL('tel:+' + number);
};

if (typeof navigator.telephony == "undefined") navigator.telephony = new Telephony();/*
    http://www.JSON.org/json2.js
    2010-03-20

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, strict: false */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (!this.JSON) {
    this.JSON = {};
}

(function () {

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf()) ?
                   this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z' : null;
        };

        String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ?
            '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' :
                    gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                          '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' :
                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                        mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                     typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/.
test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());/*
  mustache.js â€” Logic-less templates in JavaScript

  See http://mustache.github.com/ for more info.
*/

var Mustache = function() {
  var Renderer = function() {};

  Renderer.prototype = {
    otag: "{{",
    ctag: "}}",
    pragmas: {},
    buffer: [],
    pragmas_implemented: {
      "IMPLICIT-ITERATOR": true
    },
    context: {},

    render: function(template, context, partials, in_recursion) {
      // reset buffer & set context
      if(!in_recursion) {
        this.context = context;
        this.buffer = []; // TODO: make this non-lazy
      }

      // fail fast
      if(!this.includes("", template)) {
        if(in_recursion) {
          return template;
        } else {
          this.send(template);
          return;
        }
      }

      template = this.render_pragmas(template);
      var html = this.render_section(template, context, partials);
      if(in_recursion) {
        return this.render_tags(html, context, partials, in_recursion);
      }

      this.render_tags(html, context, partials, in_recursion);
    },

    /*
      Sends parsed lines
    */
    send: function(line) {
      if(line != "") {
        this.buffer.push(line);
      }
    },

    /*
      Looks for %PRAGMAS
    */
    render_pragmas: function(template) {
      // no pragmas
      if(!this.includes("%", template)) {
        return template;
      }

      var that = this;
      var regex = new RegExp(this.otag + "%([\\w-]+) ?([\\w]+=[\\w]+)?" +
            this.ctag);
      return template.replace(regex, function(match, pragma, options) {
        if(!that.pragmas_implemented[pragma]) {
          throw({message: 
            "This implementation of mustache doesn't understand the '" +
            pragma + "' pragma"});
        }
        that.pragmas[pragma] = {};
        if(options) {
          var opts = options.split("=");
          that.pragmas[pragma][opts[0]] = opts[1];
        }
        return "";
        // ignore unknown pragmas silently
      });
    },

    /*
      Tries to find a partial in the curent scope and render it
    */
    render_partial: function(name, context, partials) {
      name = this.trim(name);
      if(!partials || partials[name] === undefined) {
        throw({message: "unknown_partial '" + name + "'"});
      }
      if(typeof(context[name]) != "object") {
        return this.render(partials[name], context, partials, true);
      }
      return this.render(partials[name], context[name], partials, true);
    },

    /*
      Renders inverted (^) and normal (#) sections
    */
    render_section: function(template, context, partials) {
      if(!this.includes("#", template) && !this.includes("^", template)) {
        return template;
      }

      var that = this;
      // CSW - Added "+?" so it finds the tighest bound, not the widest
      var regex = new RegExp(this.otag + "(\\^|\\#)\\s*(.+)\\s*" + this.ctag +
              "\n*([\\s\\S]+?)" + this.otag + "\\/\\s*\\2\\s*" + this.ctag +
              "\\s*", "mg");

      // for each {{#foo}}{{/foo}} section do...
      return template.replace(regex, function(match, type, name, content) {
        var value = that.find(name, context);
        if(type == "^") { // inverted section
          if(!value || that.is_array(value) && value.length === 0) {
            // false or empty list, render it
            return that.render(content, context, partials, true);
          } else {
            return "";
          }
        } else if(type == "#") { // normal section
          if(that.is_array(value)) { // Enumerable, Let's loop!
            return that.map(value, function(row) {
              return that.render(content, that.create_context(row),
                partials, true);
            }).join("");
          } else if(that.is_object(value)) { // Object, Use it as subcontext!
            return that.render(content, that.create_context(value),
              partials, true);
          } else if(typeof value === "function") {
            // higher order section
            return value.call(context, content, function(text) {
              return that.render(text, context, partials, true);
            });
          } else if(value) { // boolean section
            return that.render(content, context, partials, true);
          } else {
            return "";
          }
        }
      });
    },

    /*
      Replace {{foo}} and friends with values from our view
    */
    render_tags: function(template, context, partials, in_recursion) {
      // tit for tat
      var that = this;

      var new_regex = function() {
        return new RegExp(that.otag + "(=|!|>|\\{|%)?([^\\/#\\^]+?)\\1?" +
          that.ctag + "+", "g");
      };

      var regex = new_regex();
      var tag_replace_callback = function(match, operator, name) {
        switch(operator) {
        case "!": // ignore comments
          return "";
        case "=": // set new delimiters, rebuild the replace regexp
          that.set_delimiters(name);
          regex = new_regex();
          return "";
        case ">": // render partial
          return that.render_partial(name, context, partials);
        case "{": // the triple mustache is unescaped
          return that.find(name, context);
        default: // escape the value
          return that.escape(that.find(name, context));
        }
      };
      var lines = template.split("\n");
      for(var i = 0; i < lines.length; i++) {
        lines[i] = lines[i].replace(regex, tag_replace_callback, this);
        if(!in_recursion) {
          this.send(lines[i]);
        }
      }

      if(in_recursion) {
        return lines.join("\n");
      }
    },

    set_delimiters: function(delimiters) {
      var dels = delimiters.split(" ");
      this.otag = this.escape_regex(dels[0]);
      this.ctag = this.escape_regex(dels[1]);
    },

    escape_regex: function(text) {
      // thank you Simon Willison
      if(!arguments.callee.sRE) {
        var specials = [
          '/', '.', '*', '+', '?', '|',
          '(', ')', '[', ']', '{', '}', '\\'
        ];
        arguments.callee.sRE = new RegExp(
          '(\\' + specials.join('|\\') + ')', 'g'
        );
      }
      return text.replace(arguments.callee.sRE, '\\$1');
    },

    /*
      find `name` in current `context`. That is find me a value
      from the view object
    */
    find: function(name, context) {
      name = this.trim(name);

      // Checks whether a value is thruthy or false or 0
      function is_kinda_truthy(bool) {
        return bool === false || bool === 0 || bool;
      }

      var value;
      if(is_kinda_truthy(context[name])) {
        value = context[name];
      } else if(is_kinda_truthy(this.context[name])) {
        value = this.context[name];
      }

      if(typeof value === "function") {
        return value.apply(context);
      }
      if(value !== undefined) {
        return value;
      }
      // silently ignore unkown variables
      return "";
    },

    // Utility methods

    /* includes tag */
    includes: function(needle, haystack) {
      return haystack.indexOf(this.otag + needle) != -1;
    },

    /*
      Does away with nasty characters
    */
    escape: function(s) {
      s = String(s === null ? "" : s);
      return s.replace(/&(?!\w+;)|["<>\\]/g, function(s) {
        switch(s) {
        case "&": return "&amp;";
        case "\\": return "\\\\";
        case '"': return '\"';
        case "<": return "&lt;";
        case ">": return "&gt;";
        default: return s;
        }
      });
    },

    // by @langalex, support for arrays of strings
    create_context: function(_context) {
      if(this.is_object(_context)) {
        return _context;
      } else {
        var iterator = ".";
        if(this.pragmas["IMPLICIT-ITERATOR"]) {
          iterator = this.pragmas["IMPLICIT-ITERATOR"].iterator;
        }
        var ctx = {};
        ctx[iterator] = _context;
        return ctx;
      }
    },

    is_object: function(a) {
      return a && typeof a == "object";
    },

    is_array: function(a) {
      return Object.prototype.toString.call(a) === '[object Array]';
    },

    /*
      Gets rid of leading and trailing whitespace
    */
    trim: function(s) {
      return s.replace(/^\s*|\s*$/g, "");
    },

    /*
      Why, why, why? Because IE. Cry, cry cry.
    */
    map: function(array, fn) {
      if (typeof array.map == "function") {
        return array.map(fn);
      } else {
        var r = [];
        var l = array.length;
        for(var i = 0; i < l; i++) {
          r.push(fn(array[i]));
        }
        return r;
      }
    }
  };

  return({
    name: "mustache.js",
    version: "0.3.1-dev",

    /*
      Turns a template and view into HTML
    */
    to_html: function(template, view, partials, send_fun) {
      var renderer = new Renderer();
      if(send_fun) {
        renderer.send = send_fun;
      }
      renderer.render(template, view, partials);
      if(!send_fun) {
        return renderer.buffer.join("\n");
      }
    }
  });
}();
/**
 * Lawnchair
 * =========
 * A lightweight JSON document store.
 *
 */
var Lawnchair = function(opts, cb) {
    if (typeof cb == 'undefined') throw "Please provide a callback as second parameter to Lawnchair constructor; this shit's async, yo.";
    if (!JSON || !JSON.stringify) throw "Native JSON functions unavailable - please include http://www.json.org/json2.js or run on a decent browser :P";
	this.init(opts);
	cb.call(this);
}

Lawnchair.prototype = {
	
	init:function(opts) {
		var adaptors = {
			'webkit':window.WebkitSQLiteAdaptor,
			'gears':window.GearsSQLiteAdaptor,
			'dom':window.DOMStorageAdaptor,
			'cookie':window.CookieAdaptor,
			'air':window.AIRSQLiteAdaptor,
			'userdata':window.UserDataAdaptor,
			'air-async':window.AIRSQLiteAsyncAdaptor,
			'blackberry':window.BlackBerryPersistentStorageAdaptor,
            'couch':window.CouchAdaptor,
            'server':window.ServerAdaptor
		};
		this.adaptor = opts.adaptor ? new adaptors[opts.adaptor](opts) : new DOMStorageAdaptor(opts);
	},
	
	// Save an object to the store. If a key is present then update. Otherwise create a new record.
	save:function(obj, callback) {this.adaptor.save(obj, callback)},
	
	// Invokes a callback on an object with the matching key.
	get:function(key, callback) {this.adaptor.get(key, callback)},

	// Returns whether a key exists to a callback.
	exists:function(callback) {this.adaptor.exists(callback)},
	
	// Returns all rows to a callback.
	all:function(callback) {this.adaptor.all(callback)},
	
	// Removes a json object from the store.
	remove:function(keyOrObj, callback) {this.adaptor.remove(keyOrObj, callback)},
	
	// Removes all documents from a store and returns self.
	nuke:function(callback) {this.adaptor.nuke(callback);return this},
	
	// Returns a page of results based on offset provided by user and perPage option
	paged:function(page, callback) {this.adaptor.paged(page, callback)},
	
	/**
	 * Iterator that accepts two paramters (methods or eval strings):
	 *
	 * - conditional test for a record
	 * - callback to invoke on matches
	 *
	 */
	find:function(condition, callback) {
		var is = (typeof condition == 'string') ? function(r){return eval(condition)} : condition
		  , cb = this.adaptor.terseToVerboseCallback(callback);
	
		this.each(function(record, index) {
			if (is(record)) cb(record, index); // thats hot
		});
	},


	/**
	 * Classic iterator.
	 * - Passes the record and the index as the second parameter to the callback.
	 * - Accepts a string for eval or a method to be invoked for each document in the collection.
	 */
	each:function(callback) {
		var cb = this.adaptor.terseToVerboseCallback(callback);
		this.all(function(results) {
			var l = results.length;
			for (var i = 0; i < l; i++) {
				cb(results[i], i);
			}
		});
	}
// --
};
/**
 * LawnchairAdaptorHelpers
 * =======================
 * Useful helpers for creating Lawnchair stores. Used as a mixin.
 *
 */
var LawnchairAdaptorHelpers = {
	// merging default properties with user defined args
	merge: function(defaultOption, userOption) {
		return (userOption == undefined || userOption == null) ? defaultOption: userOption;
	},

	// awesome shorthand callbacks as strings. this is shameless theft from dojo.
	terseToVerboseCallback: function(callback) {
		return (typeof arguments[0] == 'string') ?
		function(r, i) {
			eval(callback);
		}: callback;
	},

	// Returns current datetime for timestamps.
	now: function() {
		return new Date().getTime();
	},

	// Returns a unique identifier
	uuid: function(len, radix) {
		// based on Robert Kieffer's randomUUID.js at http://www.broofa.com
		var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
		var uuid = [];
		radix = radix || chars.length;

		if (len) {
			for (var i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
		} else {
			// rfc4122, version 4 form
			var r;

			// rfc4122 requires these characters
			uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
			uuid[14] = '4';

			// Fill in random data.  At i==19 set the high bits of clock sequence as
			// per rfc4122, sec. 4.1.5
			for (var i = 0; i < 36; i++) {
				if (!uuid[i]) {
					r = 0 | Math.random() * 16;
					uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8: r];
				}
			}
		}
		return uuid.join('');
	},

	// Serialize a JSON object as a string.
	serialize: function(obj) {
		var r = '';
		r = JSON.stringify(obj);
		return r;
	},

	// Deserialize JSON.
	deserialize: function(json) {
		return eval('(' + json + ')');
	}
};
/**
 * WebkitSQLiteAdaptor
 * ===================
 * Sqlite implementation for Lawnchair.
 *
 */
var WebkitSQLiteAdaptor = function(options) {
	for (var i in LawnchairAdaptorHelpers) {
		this[i] = LawnchairAdaptorHelpers[i];
	}
	this.init(options);
};


WebkitSQLiteAdaptor.prototype = {
	init:function(options) {
		var that = this;
		var merge = that.merge;
		var opts = (typeof arguments[0] == 'string') ? {table:options} : options;

		// default properties
		this.name		= merge('Lawnchair', opts.name	  	);
		this.version	= merge('1.0',       opts.version 	);
		this.table 		= merge('field',     opts.table	  	);
		this.display	= merge('shed',      opts.display 	);
		this.max		= merge(65536,       opts.max	  	);
		this.db			= merge(null,        opts.db		);
		this.perPage    = merge(10,          opts.perPage   );

		// default sqlite callbacks
		this.onError = function(){};
		this.onData  = function(){};

		if("onError" in opts) {
			this.onError = opts.onError;
		}
		
		if(typeof opts.callback !== 'function') opts.callback = function(){};
		
		// error out on shit browsers
		if (!window.openDatabase)
			throw('Lawnchair, "This browser does not support sqlite storage."');
		// instantiate the store
		if(!WebkitSQLiteAdaptor.globaldb) WebkitSQLiteAdaptor.globaldb = openDatabase(this.name, this.version, this.display, this.max);

		this.db = WebkitSQLiteAdaptor.globaldb;

		// create a default database and table if one does not exist
		that.db.transaction(function(tx) {
			tx.executeSql("CREATE TABLE IF NOT EXISTS "+ that.table + " (id NVARCHAR(32) UNIQUE PRIMARY KEY, value TEXT, timestamp REAL)", [], opts.callback, that.onError);
		});
	},
	save:function(obj, callback) {
		var that = this;
	
		var update = function(id, obj, callback) {
			that.db.transaction(function(t) {
				t.executeSql(
					"UPDATE " + that.table + " SET value=?, timestamp=? WHERE id=?",
					[that.serialize(obj), that.now(), id],
					function() {
						if (callback != undefined) {
							obj.key = id;
							that.terseToVerboseCallback(callback)(obj);
						}
					},
					that.onError
				);
			});
		};
		var insert = function(obj, callback) {
			that.db.transaction(function(t) {
				var id = (obj.key == undefined) ? that.uuid() : obj.key;
				delete(obj.key);
				t.executeSql(
					"INSERT INTO " + that.table + " (id, value,timestamp) VALUES (?,?,?)",
					[id, that.serialize(obj), that.now()],
					function() {
						if (callback != undefined) {
							obj.key = id;
							that.terseToVerboseCallback(callback)(obj);
						}
					},
					that.onError
				);
			});
		};
		if (obj.key == undefined) {
			insert(obj, callback);
		} else {
			this.get(obj.key, function(r) {
				var isUpdate = (r != null);
	
				if (isUpdate) {
					var id = obj.key;
					delete(obj.key);
					update(id, obj, callback);
				} else {
					insert(obj, callback);
				}
			});
		}
	},
	get:function(key, callback) {
		var that = this;
		this.db.transaction(function(t) {
			t.executeSql(
				"SELECT value FROM " + that.table + " WHERE id = ?",
				[key],
				function(tx, results) {
					if (results.rows.length == 0) {
						that.terseToVerboseCallback(callback)(null);
					} else {
						var o = that.deserialize(results.rows.item(0).value);
						o.key = key;
						that.terseToVerboseCallback(callback)(o);
					}
				},
				this.onError
			);
		});
	},
	all:function(callback) {
		var cb = this.terseToVerboseCallback(callback);
		var that = this;
		this.db.transaction(function(t) {
			t.executeSql("SELECT * FROM " + that.table, [], function(tx, results) {
				if (results.rows.length == 0 ) {
					cb([]);
				} else {
					var r = [];
					for (var i = 0, l = results.rows.length; i < l; i++) {
						var raw = results.rows.item(i).value;
						var obj = that.deserialize(raw);
						obj.key = results.rows.item(i).id;
						r.push(obj);
					}
					cb(r);
				}
			},
			that.onError);
		});
	},
	paged:function(page, callback) {
		var cb = this.terseToVerboseCallback(callback);
		var that = this;
		this.db.transaction(function(t) {
		    var offset = that.perPage * (page - 1); // a little offset math magic so users don't have to be 0-based
		    var sql = "SELECT * FROM " + that.table + " ORDER BY timestamp ASC LIMIT ? OFFSET ?";
			t.executeSql(sql, [that.perPage, offset], function(tx, results) {
				if (results.rows.length == 0 ) {
					cb([]);
				} else {
					var r = [];
					for (var i = 0, l = results.rows.length; i < l; i++) {
						var raw = results.rows.item(i).value;
						var obj = that.deserialize(raw);
						obj.key = results.rows.item(i).id;
						r.push(obj);
					}
					cb(r);
				}
			},
			that.onError);
		});
	},
	remove:function(keyOrObj, callback) {
		var that = this;
        if (callback)
            callback = that.terseToVerboseCallback(callback);
		this.db.transaction(function(t) {
			t.executeSql(
				"DELETE FROM " + that.table + " WHERE id = ?",
				[(typeof keyOrObj == 'string') ? keyOrObj : keyOrObj.key],
				callback || that.onData,
				that.onError
			);
		});
	},
	nuke:function(callback) {
		var that = this;
        if (callback)
            callback = that.terseToVerboseCallback(callback);
		this.db.transaction(function(tx) {
			tx.executeSql(
				"DELETE FROM " + that.table,
				[],
				callback || that.onData,
				that.onError
			);
		});
	}
};
if ( navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i) ) {

    function URLCache() {
        this._cache = {};
        this._callbacks = {};
    }

    // internal callback method called by Obj-C for ALL URLCache operations that succeed
    URLCache.prototype._onCacheCallbackSuccess = function(uri,cachedURL) {
        this._cache[uri] = cachedURL;
        this._callbacks[uri].onSuccess(uri,cachedURL);

        // Commented out because if the same URI is requested multiple times, then the first
        // response will delete the callback and the second response will fail because there is no callback.
        //
        //delete this._callbacks[uri];
    }

    // internal callback method called by Obj-C for ALL URLCache operations that fail
    URLCache.prototype._onCacheCallbackFail = function(uri,error) {
        this._callbacks[uri].onFail(uri,error);

        // Commented out because if the same URI is requested multiple times, then the first
        // response will delete the callback and the second response will fail because there is no callback.
        //
        //delete this._callbacks[uri];
    }

    // returns url of cached resource ( null if resource has not been accessed )
    // success will be called if the resource is successfully downloaded to the device
    // onFail will be called if the uri is invalid, or network not available, ...
    URLCache.prototype.getCachedPathforURI = function(uri,onSuccess,onFail) {
        if(this._cache[uri] == null)
        {
            this._callbacks[uri] = {onSuccess:onSuccess,onFail:onFail};
            PhoneGap.exec("URLCache.getCachedPathforURI",uri);
        }
        return this._cache[uri];
    }

    PhoneGap.addConstructor(function() {
        if ( !window.plugins ) 
            window.plugins = {}; 

        if ( !window.plugins.urlCache ) 
            window.plugins.urlCache = new URLCache();
    });
}
else if ( navigator.userAgent.match(/browzr/i) ) {

    function Cache() {
    }

    Cache.prototype.getCachedPathForURI = function(uri, success, fail) {
        return PhoneGap.execAsync(function(args) {
            var response = JSON.parse(args.message);
            success(uri, response.file);
        }, function(args) {
            args = (typeof args !== 'string') ? JSON.stringify(args) : args;
            fail(uri, args);
        }, 'ca.rnao.bpg.plugins.URLCache', 'getCachedPathForURI', [uri, 'RNAO']);
    };

    PhoneGap.addPlugin('urlCache', new Cache());
}
else if ( navigator.userAgent.match(/blackberry\d*\/(5|6)\..*/i) ) {

    function Cache() {
    }

    Cache.prototype.getCachedPathForURI = function(uri, success, fail) {
        return PhoneGap.exec(
            function(args) {
                var response = JSON.parse(args);
                success(uri, response.file);
            },
            function(args) {
                args = (typeof args !== 'string') ? JSON.stringify(args) : args;
                fail(uri, args);
            },
            'URLCache',
            'getCachedPathForURI',
            [uri, 'RNAO']
        );
    };

    PhoneGap.addPlugin('urlCache', new Cache());
}if ( navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i) ) {

    function ImageCacheManager() {
        this.imageCache = {};
        this.hasPendingDownload = false;
        this.downloadQueue = [];

        // TODO: this should get a list of all cached images so we don't double load them

    }

    ImageCacheManager.prototype.getCachedImage = function getCachedImage(uri, onSuccess, onError) {
        var request = {
            'uri':       uri,
            'onSuccess': onSuccess,
            'onError':   onError
        };
        
        this.downloadQueue.push(request);
        this._getNextImage();
    }

    ImageCacheManager.prototype._getNextImage = function _getNextImage() {
        if(this.downloadQueue.length > 0 && !this.hasPendingDownload)
        {
            this.hasPendingDownload = true;
            var request = this.downloadQueue.shift();
            
            var alias = this;
            var ftw = function(uri,path)
            {
                request.onSuccess(uri, path);
                alias.onSuccess(uri,path);
            }
            var wtf = function(uri,error)
            {
                request.onError(uri, error);
                alias.onFail(uri,error);
            }

            // Commented out because BlackBerry does not have this method.
            // We will fake it for now.
            //
            //if (this.imageCache[request.uri]) {
            //  ftw(request.uri, this.imageCache[request.uri]);
            //}
            //else {
            //  window.plugins.urlCache.getCachedPathforURI(request.uri,ftw,wtf);
            //}
            ftw(request.uri, request.uri);
        }
    }

    ImageCacheManager.prototype.onSuccess = function onSuccess(uri,path) {
        this.imageCache[uri] = {url:path};
        this.hasPendingDownload = false;
        this._getNextImage();
    }

    ImageCacheManager.prototype.onFail = function onFail(uri,error) {
        this.hasPendingDownload = false;
        this._getNextImage();
    }

    if ( !window.plugins ) 
        window.plugins = {}; 
            
    if ( !window.plugins.urlCacheManager ) 
        window.plugins.urlCacheManager = new ImageCacheManager();
}
else if ( navigator.userAgent.match(/browzr/i) ||
          navigator.userAgent.match(/blackberry\d*\/(5|6)\..*/i) ) {

    function ImageCacheManager() {
        this.imageCache = {};
    }

    ImageCacheManager.prototype.getCachedImage = function(uri, success, fail) {
        var cachedPath = this.imageCache[uri], retVal = "";
        if (cachedPath) {
            success(uri, cachedPath);
        } else {
            retVal = window.plugins.urlCache.getCachedPathForURI(uri, success, fail);
        }
        return retVal;
    }

    PhoneGap.addPlugin('urlCacheManager', new ImageCacheManager());
}(function(scope) {
    
    scope.Application = {
        stageName: 'wrapper',
        
        actions:  [ 'action', 'template', 'render', 'selectors' ],
        
        clickable: true,
        
        events:   {},
        please:   {},
        settings: {},
        device:   '',
        
        //
        // Initialize the application.
        // This should be called once to get things up and running
        //
        init: function() {
            this.reset();
            
            x$('body').click(function(e) {
                // Leave if the UI is not clickable
                if (!Application.clickable) return this;
                
                var findAnchorElement = function(element) {
                    // BlackBerry 4.6 likes to fire events off of the text inside an anchor.
                    // So, we will walk up the DOM tree to see if any parent is an anchor.
                    while (!element.href && element.parentNode) { element = element.parentNode; }
                    return element;
                };
                
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
                        else if (Application.is('blackberry4')) {
                            document.location.hash = '#' + hash;
                        }
                        else {
                            var $element = x$('a[name='+hash+']');
                            $element     = ($element.length > 0) ? $element : x$('#' + hash);
                            
                            if ($element.length > 0) { $element[0].scrollIntoView(true); }
                        }
                    }
                }
                else if (href) {
                    // Reachability used to enable or disable the external link
                    Application.reachable(function(reachable) {
                        if (reachable) {
                            if (Application.supports.browser.widget) {
                                blackberry.invoke.invoke(
                                    blackberry.invoke.APP_BROWSER,
                                    new blackberry.invoke.BrowserArguments(href));
                            }
                            else {
                                document.location = href;
                            }
                        }
                        else {
                            navigator.notification.alert(Const.MSG_CANNOT_OPEN_PAGE,
                                                         Const.MSG_CANNOT_OPEN_PAGE_TITLE);
                        }
                    });
                }
                
                return false;
            });
            
            // Resize the viewport if the orientation changes
            // Useful for the BlackBerry, because it's min viewport is smaller than the...well..viewport
            if (window.onorientationchange) { window.onorientationchange = this.updateSize; }
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
            
            this.updateSize();
        },
        
        //
        // Update Stage Height
        //
        updateSize: function() {
            x$('html').setStyle('height', screen.height + 'px');
            x$('body').setStyle('height', screen.height + 'px');
            x$('#' + this.stageName).setStyle('height', screen.height + 'px');
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
                    self._runActions(name, event, actions, originalData, data);
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
            
            if ($template.hasClass('view')) {
                $element = x$('#' + this.stageName);
                $element.html(html);
                
                // Hide any modal elements because we're changing views
                x$('body > div.modal').remove();
                
                // A setTimeout is required for the BlackBerry 6 to properly render
                // the next view. Normally, it cuts off the header.
                setTimeout(function() { window.scrollTo(0, 0); }, 10);
            }
            else if ($template.hasClass('modal')) {
                $element = x$(document.createElement('div')).attr('id', name).addClass('modal');
                $element.setStyle('height', this.height() + 'px');
                $element.html(html);
                
                // Append modal to the body, so it remains between view transitions
                x$('body')[0].appendChild($element[0]);
                x$('#' + this.stageName + ' .selected').removeClass('selected');
                
                // See comment in above block.
                setTimeout(function() { window.scrollTo(0, 0); }, 10);
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
            if (userAgent.match(/blackberry\d*\/6\..*/i)) return 'webkit';
            if (userAgent.match(/webkit/i))               return 'webkit';
            //if (navigator.userAgent.match(/iphone|ipod/i)) return 'ios';

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
    
	// PhoneGap.exec(
	// 	function() {
	// 		alert('back from native');
	// 	},
	// 	function(e) {
	// 		alert("error from native: " + e);
	// 	},
	// 	'Database',
	// 	'restore',
	// 	[]
	// );
    alert('preload');
    Application.please.preloadImages(imageList, function() {
        alert('settings');
        Application.please.loadSettings();
        alert('features');
        Application.please.detectFeatures();
        alert('database');
        Application.please.createDatabase(function() {
            alert('home');
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
            x$('#splashScreen').setStyle('height', screen.height + 'px');
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
        Application.reachable(function(reachable) {
            if (reachable) {
                Application.update.start();
                template();
            }
            else {
                navigator.notification.alert(Const.MSG_CANNOT_UPDATE);
            }
        });
    },
    
    template: function(data) {
        return {};
    },
    
    selectors: {
        '#progress-modal': function($element) {
            // if iPhone
            //$element[0].ontouchmove = preventMove;
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
            $element.removeClass('selected');
            $element[0].blur();
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
var Const =
{
	FONT_SIZES:[13, 15, 17],
	SLIDE_INTERVAL:15,
	SLIDE_FRAME:9,
	FADE_SPEED:0.2,
	ELLIPSIS_BREAD:35,
	ELLIPSIS_LABEL:70,
	ELLIPSIS_LOADING:25,
	ELLIPSIS_TITLE:60,
	DEVICE_IPHONE:'ios',
	DEVICE_BLACKBERRY:'blackberry',
	DEVICE_DESKTOP:'desktop',

  TERM_DATA_NAME:'term_data_name', // workaround value: 'tdn',
	
	IPHONE:
	{
		SLIDE_INTERVAL:85,
		SLIDE_FRAME:3,
		FADE_SPEED:0.6,
		NETWORK_TIMEOUT_DURATION:20000
	},
	
	BLACKBERRY:
	{
		NETWORK_TIMEOUT_DURATION:60000
	},
	
	// in millisecond
	NETWORK_TIMEOUT_DURATION:15000,
	// DOMAIN:'http://pda.rnao-dev.org',
	DOMAIN:'http://pda.rnao.ca',
	// DOMAIN:'http://10.0.1.14:8088',
	// DOMAIN:'http://192.168.2.7:8088',
	URL_HOME:'/services/json/?sessid=36475b3012af98851b74e4f5251d183f&method=views.get&view_name=all_guidelines_available',
	URL_VIEW2:'/services/json/?sessid=36475b3012af98851b74e4f5251d183f&method=views.get&view_name=guideline_content_types&args=',
	URL_PAGE:'/services/json/?sessid=16f5b876d0a2b0195840cf64482519c5&method=node.get&fields=title,body,taxonomy,changed&nid=',
	URL_SEARCH:'/services/json/?sessid=16f5b876d0a2b0195840cf64482519c5&method=search.nodes&simple=true&search_keys=',
	URL_NODE_TIMESTAMPS:'/services/json/?sessid=16f5b876d0a2b0195840cf64482519c5&method=node_resource.index&fields=changed,nid',
	URL_VIEW_GLOBAL:'/services/json/?sessid=36475b3012af98851b74e4f5251d183f&method=pda.timestamp.global',
	URL_VIEW_TIMESTAMPS:'/services/json/?sessid=36475b3012af98851b74e4f5251d183f&method=pda.timestamp.list',
	
	MIN_VIEW_COUNT:46,
	MAX_VIEW_OVERFLOW:10,
	MAX_XHR_FAILURE:3,
	
	// TEMPLATES
	TMP_DETAIL:'<div class="detail">TEXT</div>',
	TMP_LABEL:'<div class="label">TEXT</div>',
	TMP_BREAD:'<a href="#" class="CLASS_NAME" id="bt-home">Home</a>',
	TMP_NAV:'<div class="bt-container"><a class="bt arrow left" href="#" id="bt-left"></a></div><div class="bt-container right"><a class="bt arrow right" href="#" id="bt-right"></a></div><div id="title">TEXT</div>',
	TMP_BACK_TO_TOP:'<div class="item back" onclick="App.backToTop();">Back to Top</div>',
	TMP_MESSAGE:'<div class="message">TEXT</div>',
	TMP_ERROR_NETWORK:'<div class="float-modal"><a href="#" id="bt-retry-close" class="bt round close"></a><p><b>Network is unavailable.</b></p><a id="bt-retry" href="#" class="bt-modal">Retry</a></div>',
	TMP_ERROR_INITIAL:'<div class="float-modal tall"><h2>Network Error</h2><p><b>Please make sure you have an internet connection when running this application for the first time.</b></p><a id="bt-retry" href="#" class="bt-modal">Retry</a></div>',
	TMP_PROGRESS:'<div class="float-modal large"><a href="#" id="progress-close" class="bt round close" onclick="ProgressModal.onCancelClick();return false;"></a><p id="progress_message">Finding outdated items...</p><div class="progress-bar-container"><div class="progress-bar"></div></div><div class="progress-status">0%</div><div class="progress-description">Downloading new and updated articles for offline viewing.<br />This can take <span class="emphasis">5 - 10 minutes</span>.</div><a id="bt-pause" href="#" class="bt-modal" onclick="ProgressModal.onPauseClick();return false;">Pause</a><a id="bt-cancel" href="#" class="bt-modal" onclick="ProgressModal.onCancelClick();return false;">Cancel</a><a id="bt-resume" href="#" class="bt-modal" style="display:none;" onclick="ProgressModal.onResumeClick();return false;">Resume</a></div>',
	TMP_WRAP_INNER:
	'<div id="new-header" class="header" ontouchmove="preventMove(event);"><div id="new-bread" class="bread"></div><div class="right right-edge"><a class="bt left update" href="#" id="bt-update"></a><a class="bt left font" href="#" id="bt-font"></a><a class="bt left search" href="#" id="bt-search"></a></div><div id="new-nav" class="nav"></div></div>' + 
	'<div id="new-list" class="list" ontouchmove="listTouchMove(event)" ontouchstart="listTouchStart(event);" ontouchend="touchEnd(event);"></div>' +
	'<div id="modal" style="display:none"><div id="search-header" class="header"><div class="left left-edge"><a class="bt right close round" href="#" id="bt-close-search"></a>' +
	'</div><input id="search-input" type="text" value="" /><div class="right right-edge"><a class="bt left search" href="#" id="bt-start-search"></a></div>' +
	'</div><div id="result" class="list" ontouchmove="resultTouchMove(event)" ontouchstart="resultTouchStart(event);" ontouchend="touchEnd(event);"></div></div>',
	TMP_OFFLINE_ONCLICK: ' onclick="navigator.notification.alert(\'Sorry, the link cannot be opened because there is no network connection.\', \'Cannot Open Page\'); return false;" ',
	
	// PROGRESS MESSAGES
	PROGRESS_MSG_INVENTORY_NODES: 'Finding outdated guides...',
	PROGRESS_MSG_INVENTORY_VIEWS: 'Finding outdated lists...',
	PROGRESS_MSG_BB_FIND_EXPIRED: 'Organizing the guides...',
	PROGRESS_MSG_NODES:           'Downloading guides...',
	PROGRESS_MSG_VIEWS:           'Downloading lists...',
	
	// ALERT MESSAGES
	MSG_CANNOT_UPDATE: 'Sorry, you need a network connection to run the updater.',
	MSG_INSTALL_DB:    'The application is about to install the database.\nThis may take a few minutes.',
	MSG_NO_RESULTS:    'Search returned no results.',
	
	MSG_CANNOT_OPEN_PAGE:       'Sorry, the link cannot be opened because there is no network connection.',
	MSG_CANNOT_OPEN_PAGE_TITLE: 'Cannot open page',
	
	// DATABASE
	DB_INFO: 'internal_info'
};//
// Settings
//
Application.please.loadSettings = function() {
    var lawnchairAdaptor = {
        'webkit':      'webkit',
        'blackberry4': 'blackberry',
        'blackberry5': 'gears'
    };
    
    Application.settings = {
        fontSizeIndex: 0,
        
        database: {
            backup:     false,
            backupPath: Application.please.getStoragePath() + 'database.json',
            table:      'offline',
            name:       'rnao',
            adaptor:    lawnchairAdaptor[Application.device],
            created:    new Date(1294428208831) // Jan 7, 2010 @ 9:36am
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
            widget: !!(typeof blackberry !== 'undefined' && blackberry.invoke && blackberry.invoke.BrowserArguments)
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
            if (rootPaths[i].indexOf("SDCard") != -1) {
                storagePath = rootPaths[i];
                break;
            }
        }
    }

    return storagePath;
};//
// Database Creation
//
// @param {Function} callback
//
Application.please.createDatabase = function(callback) {
    callback();
    
    if (typeof Lawnchair === 'undefined') { callback(); return; };
    if (Application.settings.database.adaptor === 'blackberry' && !navigator.store) { callback(); return; }
    
    // Dispatch the database creation
    // Required to fix the BlackBerry 5 loading screen, which will sometimes
    // not close unless the Database (Gears) is disconnected from the onload event
    
    Application.dispatch(function() {
        new Lawnchair(Application.settings.database, function() {
            Application.database = this;
            
            Application.please.migrateDatabase({
                using:     Application.please.restoreDatabase,
                completed: callback
            });
        });
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
        if (isOutdated(r)) {
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
    alert(Const.MSG_INSTALL_DB);
    
    Application.database.nuke(function() {
        var addTimestamp = function() {
            var today = new Date();
            Application.database.save({ key:Const.DB_INFO, creation_date:today.getTime() }, function() {
                callback();
            });
        };
        
        // By pass the database restore
        addTimestamp();
        return;
        alert('should not see this alert');
        Application.please.restore(addTimestamp);
    });
}

//
// Write Database to File
//
Application.please.backupDatabase = function() {
    if (!Application.settings.database.backup) return;
    
    var callback = {
        success: function(event) { alert('Success: ' + event.target.fileName + ' ' + event.type); },
        fail:    function(e)     { alert('Failed to write the file: ' + e) }
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
};Application.please.restore = function(callback) {
    var restoreGears = function(callback) {
        var recordCount = 0;
        
        var getRecords = function() {
            var insertRecords = function(records, callback) {
                Application.dispatch(function() {
                    var database = google.gears.factory.create('beta.database');
                    var today    = new Date().getTime();
                    
                    database.open(Application.settings.database.name);
                    database.execute('BEGIN');
                    
                    while(records.length > 0) {
                        var record = records.shift();
                        var id     = record.key; delete record.key;
                        database.execute('INSERT INTO ' + Application.settings.database.table + ' (id, value, timestamp) VALUES (?, ?, ?)',
                                         [id, JSON.stringify(record), today]);
                        delete id;
                        delete record;
                    }
                    
                    database.execute('COMMIT');
                    database.close();
                    
                    Application.dispatch(callback);
                });
            };
            
            PhoneGap.exec(
                function(records) {
                    var json = JSON.parse(records);
                    recordCount += json.length;
                    
                    (json.length > 0) ? insertRecords(json, getRecords) : callback();
                    delete json;
                },
                function(e) {
                    alert("error from native: " + e);
                },
                'Database',
                'chunk',
                []
            );
        };
        
        getRecords();
    };
    
    var restoreSQL = function(callback) {
        var file = new FileReader();
        
        file.onerror = function() {
            callback();
        };
        
        file.onload = function(e) {
            var records = JSON.parse(e.target.result);
            delete e;
            
            var databaseError    = function(e) { callback(); };
            var databaseSuccess  = function()  { callback(); };
            var populateDatabase = function(t) {
                for(var i = 0, l = records.length; i < l; i++) {
                    var id = records[i].key
                    delete records[i].key;
                    
                    t.executeSql('INSERT INTO ' + Application.settings.database.table + ' (id, value,timestamp) VALUES (?,?,?)',
                                 [id, JSON.stringify(records[i]), Date.now()]);
                }
            };
            
            var database = window.openDatabase(Application.settings.database.name, '1.0', 'shed', 65536);
            database.transaction(populateDatabase, databaseError, databaseSuccess);
        };
        
        file.readAsText('local:///database/database.json');
    };
    
    var restoreStore = function(callback) {
        window.plugins.store.restore(callback, callback);
    };
    
    var restoreImages = function(callback) {
        PhoneGap.exec(
            function() {
                callback();
            },
            function(e) {
                callback();
            },
            'Database',
            'restoreImages',
            []
        );
    };
    
    if (Application.supports.database.sqliteGears) {
        restoreGears(function() {
            restoreImages(callback);
        });
    }
    else if (Application.supports.file.reader && Application.supports.database.sqlite) {
        restoreSQL(function() {
            restoreImages(callback);
        });
    }
    else if (Application.supports.store.restore) {
        restoreStore(function() {
            restoreImages(callback);
        });
    }
    else {
        callback();
    }
};Application.cache = Application.cache || {};

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
    }
    
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
};//
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
};//
// Offline Search
//
// @param {DOMString} query to search
// @param {Function}  onComplete callback
//
Application.please.searchOffline = function(query, onComplete) {
    var jsonResponse = {
        'error': false,
        'data':  []
    };
    
    var setResponseError = function(message) {
        jsonResponse.error = true;
        jsonResponse.data  = message;
    };
    
    query = Application.please._formatSearchString(query);
    
    if (!Application.database) {
        setResponseError("There is no database to search.");
        onComplete(jsonResponse);
        return;
    }
    else if (typeof query !== 'string' || query.length <= 0) {
        setResponseError(Const.MSG_NO_RESULTS);
        onComplete(jsonResponse);
        return;
    }
    
    var regexQuery = new RegExp(query, "gi");
    
    var matchRecord = function(record) {
        if (!record) return;
        
        var response   = record.data;
        var requestURL = record.key;
        var matchCount = 0;
             
        // Skip response if it is not a node
        if (!response || !response.data || !response.data.title) return;
            
        var result = response.data.title.match(regexQuery);
        // Uncomment this to search the body.
        // if (!result) { result = response.data.body.match(regexQuery); }
            
        if (result) {
            jsonResponse.data.push({
                'title': response.data.title,
                'node':  Application.please_findNodeIdFromUrl(requestURL)
            });
        }
    };
    
    var renderResults = function() {
        if (jsonResponse.data.length <= 0) {
            setResponseError(Const.MSG_NO_RESULTS);
        }
    
        onComplete(jsonResponse);
    };
    
    if (Application.supports.store.search) {
        window.plugins.store.search(query, function(response) {
            jsonResponse.data  = response.message.data;
            jsonResponse.error = response.message.error;
            renderResults();
        });
    }
    else {
        Application.database.all(function(records) {
            for(var i = 0; i < records.length; i++) {
                matchRecord(records[i]);
            }
            
            renderResults();
        });
    }
};

//
// Normalize Search String
//
// @param  {DOMString} string
// @return {DOMString}
//
Application.please._formatSearchString = function(string) {
    // Add pipes between non-word characters, except '
    return string.replace(/[^\w']/gi, '|')
    // Replace double multiple pipes with a single pipe
    .replace(/\|+/gi, '|')
    // Remove pipes at the start and end of the string
    .replace(/^\||\|$/gi, '')
    .toLowerCase()
};

//
// Extract Node ID
//
// Must be done because there is no easy way to get the ID
//
// @param  {DOMString} urlString to extract node ID from
// @return {DOMString} or {null}
//
Application.please_findNodeIdFromUrl = function(urlString) {
    var result = urlString.match(/\d+$/gi);
    return (result) ? result[0] : null;
};Application.update = {};

//
// Run the update
//
Application.update.start = function() {
    this.stop();
    
    Application.update.state = {
        list:  [],
        total: 0
    };
    
    // Find the URLs that need to be updates, then start the update
    Application.update._inventoryViews(function() {
        Application.update._inventoryNodes(function() {
            Application.update.state['total'] = Application.update.state['list'].length;
            Application.update._nextItem();
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
// Find the nodes that need to be updated
//
// @param {Function} callback completion function.
//
Application.update._inventoryNodes = function(callback) {
    // Push nodes onto the outdated list
    var generateNodeList = function(json) {
        for (var i = 0; i < json.data.length; i++) {
            Application.update.state['list'].push({
                timestamp: json.data[i].changed,
                url:       Const.DOMAIN + Const.URL_PAGE + json.data[i].nid
            });
        }
        
        delete json;
        callback();
    };
    
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
// Find outdated lists
//
// @param {Function} callback completion function
//
Application.update._inventoryViews = function(callback) {
    var globalTimestamp = function(callback) {
        Application.please.xhr(Const.DOMAIN + Const.URL_VIEW_GLOBAL, {
            readCache:  false,
            writeCache: false,
            success:    function(json) {
                callback(json.data);
            }
        });
    };
    
    var viewTimestamps = function(callback) {
        Application.please.xhr(Const.DOMAIN + Const.URL_VIEW_TIMESTAMPS, {
            readCache:  false,
            writeCache: false,
            success:    function(json) {
                // Build list of outdated views
                for (var i = 0; i < json.data.length; i++) {
                    // Home or list view
                    var url = (json.data[i].arg === '') ? Const.DOMAIN + Const.URL_HOME : Const.DOMAIN + Const.URL_VIEW2 + json.data[i].arg;
                    
                    Application.update.state['list'].push({
                        timestamp: json.data[i].timestamp,
                        url:       url
                    });
                }

                delete json;
                callback();
            }
        });
    };
    
    Application.trigger('update-progress', { status: Const.PROGRESS_MSG_INVENTORY_VIEWS });
        
    globalTimestamp(function(timestamp) {
        // Decide if we need to update the views
        viewTimestamps(function() {
            // Push global timestamp onto the State list
            Application.update.state['list'].push({
                timestamp: timestamp,
                url:       Const.DOMAIN + Const.URL_VIEW_GLOBAL
            });
            callback();
        });
    });
};

//
// Start updating
//
Application.update._nextItem = function() {
    if (!Application.update.state || Application.update.state['list'].length <= 0) {
        Application.please.backupDatabase();
        return;
    }
    
    var item = Application.update.state['list'].shift();
    var key  = Application.please.generateKey(item.url);
    Application.update._progress();
    
    var message = (item.url.indexOf(Const.URL_PAGE)) ? Const.PROGRESS_MSG_NODES : Const.PROGRESS_MSG_VIEWS;
    Application.trigger('update-progress', { status: message });
    
    Application.cache.find(key, {
        success: function(json) {
            if (Application.update._isExpired(json.timestamp, item.timestamp)) {
                Application.update._updateItem(item);
            }
            else {
                Application.update._nextItem();
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
            Application.cache.write(key, json, Application.update._nextItem);
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
        Application.trigger('update-close');
    }
};