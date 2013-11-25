(function() {

    Application.original = {
        trigger:  Application.trigger,
        template: Application.template
    };
    
    Application.trigger = function(name, args) {
        Application.original.trigger.call(Application, name, args);
    
        if (Application.testSuite[name]) {
            Application.testSuite[name]();
        }
    }
    
    Application.testSuite = {};
    
    Application.test = function(name, test) {
        Application.testSuite[name] = test;
    }
    
    // ---
    
    // Application.templateTest = {};
    // Application.templateTest =
    // Application.template = function(name, data) {
    //     Application.origina.template.call(Application, name, data);
    //     
    //     if (Application.templateTest[name]) { Application.templateTest(); }
    // };
        
})();