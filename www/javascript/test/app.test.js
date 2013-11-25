window.addEventListener('load', function() {
    module('App');

    test('truthy', function() {
      ok(true, 'yes');
    });
    // test('Init', function() {
    //     expect(1);
    // 
    //     Application.test('init', function(args) {
    //         ok(true, 'should trigger init event');
    //     });
    //     
    //     Application.trigger('init');
    // });
    // 
    // test('Ready', function() {
    //     expect(2);
    // 
    //     Application.test('ready', function(args) {
    //         ok(true, 'should trigger deviceready event');
    //     });
    //     
    //     Application.test('home', function(args) {
    //         ok(true, 'should trigger home event');
    //     });
    //     
    //     Application.trigger('ready');
    // });
    // 
    // test('Home', function() {
    //    expect(1);
    //    
    //    Application.test('home', function(data) {
    //        ok(true, 'should trigger home event');
    //        
    //        equals(x$('#list div').length, 14, 'should have at least 14 labels');
    //        equals(x$('#list a').length, 38, 'should have at least 38 items');
    //    });
    //    
    //    Application.trigger('home');
    // });
});