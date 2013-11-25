//
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
};