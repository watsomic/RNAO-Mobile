window.addEventListener('load', function() {
    module('Application', {
        teardown: function() {
            Application.reset();
        }
    });

    test('init event', function() {
        expect(2);

        Application.on('init', function(args) {
            ok(true, 'should trigger init function');
        }).trigger('init');
        
        Application.on('init', {
            action: function(args) {
                ok(true, 'should trigger init object');
            }
        }).trigger('init');
    });
    
    test('ready event', function() {
        expect(2);
    
        Application.on('ready', function(args) {
            ok(true, 'should trigger ready function');
        }).trigger('ready');
        
        Application.on('ready', {
            action: function(args) {
                ok(true, 'should trigger ready object');
            }
        }).trigger('ready');
    });
    
    test('custom event', function() {
        expect(2);
    
        Application.on('a_view', function(args) {
            ok(true, 'should trigger a_view function');
        }).trigger('a_view');
        
        Application.on('a_view', {
            action: function(args) {
                ok(true, 'should trigger a_view object');
            }
        }).trigger('a_view');
    });
    
    test('templating', function() {
        expect(3);
        
        Application.on('greeting', {
            action: function(e) {
                ok(!x$('#greeting')[0], 'should not have a greeting page yet');
                this.view({ name: 'Michael' });
            },
            
            view: function(data) {
                Application.template('greeting', data);
                
                ok(x$('#greeting')[0], 'should have a greeting page');
                equals(x$('#greeting .name').html(), 'Michael', 'should have used the template');
            }
        });
        
        Application.trigger('greeting');
    });
    
    test('templating with after callback', function() {
        expect(2);
        
        Application.on('greeting', {
            action: function(e) {
                ok(!x$('#greeting')[0], 'should not have a greeting page yet');
                
                this.view({
                    name: 'Michael',
                    callback: {
                        after_template: function(element) {
                            element.find('.name').html('Michael Brooks');
                        }
                    }
                });
            },
            
            view: function(data) {
                Application.template('greeting', data);
                equals(x$('#greeting .name').html(), 'Michael Brooks', 'should have used the template');
            }
        }).trigger('greeting');
    });
});