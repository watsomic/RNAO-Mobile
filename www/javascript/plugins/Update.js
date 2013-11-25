if ( navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i) ) {
    // iOS will run the update with the web app
}
else if ( navigator.userAgent.match(/browzr/i) ) {
    
    var UpdatePlugin = function() {};
    
    UpdatePlugin.prototype.findExpired = function(nodeUrl, jsonString, onSuccess, onError) {
        nodeUrl    = encodeURIComponent(nodeUrl);
        jsonString = JSON.stringify(jsonString);
                    
        return PhoneGap.execAsync(onSuccess, onError, 'ca.rnao.bpg.plugins.Update', 'findExpired', [nodeUrl, jsonString]);
    };
    
    PhoneGap.addPlugin('update', new UpdatePlugin());
}
