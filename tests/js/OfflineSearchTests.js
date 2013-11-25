$(document).ready(function(){
	
	module("Offline Search", {
		setup: function() {
			stop();
			
			var saveCount = 0;
			
			App.db = new Lawnchair({ table: 'offline', adaptor: 'webkit' });
			App.db.nuke();
			
			for (var i = 0; i < mockResponse.length; i++) {
				App.db.save({ 'key': mockResponse[i].url, 'data': mockResponse[i].response }, function(r) {
					saveCount++;
					if (saveCount >= mockResponse.length) {
						start();
					}
				});
			}
		},
		teardown: function() {
			App.db.nuke();
			App.db = undefined;
		}
	});
	
	test("Search String Normalization", function() {
		var searchStrings = [
			{ 
				query:  "Hello, how are you today?",
			  result: "hello|how|are|you|today"
			},
			{ 
				query:  "Hello, how's your day going today?",
			  result: "hello|how's|your|day|going|today"
			},
			{
				query:  "    Hello  \t hi    ",
				result: "hello|hi"
			},
			{
				query:  "      ",
				result: ""
			}
		];
		
		for (var i = 0; i < searchStrings.length; i++) {
			var result = App._format_search_string(searchStrings[i].query);
			equals(searchStrings[i].result, result, "should format the string correctly");
		}
	});
	
	test("Node ID Extraction",  function() {
		var URLs = [
			{
				nid: "6",
				url: "http://pda.rnao-dev.org/services/json/?sessid=16f5b876d0a2b0195840cf64482519c5&method=node.get&fields=title,body,taxonomy,changed&nid=6"
			},
			{
				nid: "34",
				url: "http://pda.rnao-dev.org/services/json/?sessid=16f5b876d0a2b0195840cf64482519c5&method=node.get&fields=title,body,taxonomy,changed&nid=34"
			},
			{
				nid: "462",
				url: "http://pda.rnao-dev.org/services/json/?sessid=16f5b876d0a2b0195840cf64482519c5&method=node.get&fields=title,body,taxonomy,changed&nid=462"
			}
		];
		
		expect(URLs.length);
		
		for (var i = 0; i < URLs.length; i++) {
			var url = URLs[i];
			var nodeID = App._find_node_id_from_url(url.url);
			equals(nodeID, url.nid, 'The node IDs should match');
		}
	});
	
	test("Finding Results", function() {
		var completed = 0;
		var queries = [
			// Find all of the results
			{
				string: "Pain",
				count:  3
			},
			// Find one result
			{
				string: "Heat",
				count:  1
			},
			// Find no results
			// {
			// 	string: "Foobar",
			// 	count:  0
			// },
			// Multiple words. Each word matches different nodes.
			{
				string: "Comprehensive assessment", // nid 2, nid 8
				count:  2
			}
		];
				
		stop();
		expect(queries.length);
		
		for (var i = 0; i < queries.length; i++) {
			var query = queries[i];
		
			App.offline_search(
				query.string,
				(function(queryCount) {
					return function (jsonResponse) {
						equals(jsonResponse.data.length, queryCount, 'should find correct result count');
						completed++;
				
						if (completed >= queries.length) start();
					}
				})(query.count)
			);	
		}
	});
	
	test("Result JSON Schema", function() {
		stop();
		
		App.offline_search('Pain', function(jsonResponse) {
			ok(typeof(jsonResponse.error) === 'boolean',       'should have an error object');
			ok(jsonResponse.data.length > 0,                   'should have an data array');
			ok(jsonResponse.data[0].title,                     'each data element should have a title');
			ok(typeof(jsonResponse.data[0].node) === 'string', 'each data element should have a node ID');
			start();
		});
	});
	
	test("No Results Found", function() {
		stop();
		expect(2);
		
		App.offline_search('Foobar', function(jsonResponse) {
			ok(jsonResponse.error, 'should have an error');
			ok(typeof(jsonResponse.data) === 'string', 'should display a no results message.');
			start();
		});
	});
	
	test("Empty Query String", function() {
		stop();
		expect(2);
		
		App.offline_search('', function(jsonResponse) {
			ok(jsonResponse.error, 'should have an error');
			ok(typeof(jsonResponse.data) === 'string', 'should display a no results message.');
			start();
		});
	});
	
});
