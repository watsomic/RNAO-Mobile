//
// Read a file that is local to the www/ directory
//
Application.please.read = function(options) {
    this.extend(options, {
        file:       '',
        success:    function(data) { console.log('File read consumed data.'); },
        failture:   function()     { console.log('File read consumed error.'); }
    });

    // Do a synchronous XHR because it's cleaner to look at
    //
    var xhr = new XMLHttpRequest();
    xhr.open('GET', options.file, false);
    xhr.send();

    // Most browsers return a status of 0 for successful local XHRs
    // Android returns a status of 200
    // When no file exists, Android still returns 200 but a responseText length of 0
    //
    if ((xhr.status === 0 || xhr.status === 200) && xhr.responseText.length > 0) {
        options.success(xhr.responseText);
    }
    else {
        options.failure();
    }
};