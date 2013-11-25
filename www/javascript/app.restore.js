Application.please.restore = function(callback) {
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
                    console.log("Exception from Database.chunk: " + e);
                    callback();
                },
                'Database',
                'chunk',
                []
            );
        };
        
        getRecords();
    };
    
    var restoreSQL = function(callback) {
        // BlackBerry v6.x devices have different limitations on the number of queries in a transaction
        // Some devices can support 500+ in a single transaction.
        // Others cannot support more than 150.
        // For safety, I've used 50.
        // A better approach would be to dynamically downgrade the size if a transaction fails.
        // Unfortunately, project time does not permit a more generic implementation
        var transactionSize = 50;
        var timestamp       = new Date().getTime();
        
        var restore = function(records, callback) {
            var databaseError = function(e) {
                console.log('SQLError ' + e.code + ': ' + e.message);
                Application.dispatch(callback);
            };
            
            var databaseSuccess = function()  {
                Application.dispatch(function() {
                    restore(records, callback);
                });
            };
            
            var populateDatabase = function(t) {
                transactionSize = (records.length < transactionSize) ? records.length : transactionSize;
                
                for(var i = 0, l = transactionSize; i < l; i++) {
                    var record = records.pop();
                    var id = record.key
                    delete record.key;
                    
                    t.executeSql('INSERT INTO ' + Application.settings.database.table + ' (id, value,timestamp) VALUES (?,?,?)',
                                 [id, JSON.stringify(record), timestamp]);
                }
            };
            
            var databaseTransaction = function() {
                try {
                    WebkitSQLiteAdaptor.globaldb.transaction(populateDatabase, databaseError, databaseSuccess);
                }
                catch(e) {
                    Application.dispatch(callback);
                }
            };
            
            (records.length > 0) ? Application.dispatch(databaseTransaction) : Application.dispatch(callback);
        };
        
        // Recursively calls itself, reading in each database.x.json chunk
        // and inserting the chunk of records into the SQL table
        //
        (function importDatabase(index) {
            
            Application.please.read({
                file: 'database/database.' + index + '.json',

                // Insert records into the database
                success: function(data) {
                    restore(JSON.parse(data), function() {
                        importDatabase(index + 1);
                    });
                },
                
                // Database could not be opened, so we must have read
                // all of the chunks. Move on!
                failure: function() {
                    Application.dispatch(callback);
                }
            });
            
        })(1);
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
            // @TODO Gears should not longer restore the images.
            //       The images should be bundled in www/database/images/
            //       Rakefile will generate the database and update the image paths
            restoreImages(callback);
        });
    }
    else if (Application.supports.file.reader && Application.supports.database.sqlite) {
        restoreSQL(function() {
            Application.dispatch(callback);
        });
    }
    else if (Application.supports.store.restore) {
        restoreStore(function() {
            // @TODO Store::Restore should not longer restore the images.
            //       The images should be bundled in www/database/images/
            //       Rakefile will generate the database and update the image paths
            restoreImages(callback);
        });
    }
    else {
        callback();
    }
};