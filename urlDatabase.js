// database module
// maybe clean up the main server script a little

var sqlite3 = require('sqlite3');
var fs = require('fs');

/** @constructor */
exports.loadDatabase = function (filename) {
    return new Promise(function (resolve, reject) {
        fs.access(filename, fs.F_OK, function (error) {
            if (error) {
                if (error.code = "ENOENT") {
                    // if file doesn't exist, init database.
                    var database = new sqlite3.Database(filename);
                    database.run('CREATE TABLE urls( url TEXT UNIQUE NOT NULL, id CHAR(8) PRIMARY KEY NOT NULL);');
                    console.log("Initialized new database " + filename);
                    resolve(database);
                } else {
                    reject(error);
                }
            } else {
                console.log("Loaded database " + filename);
                resolve(new sqlite3.Database(filename));
            }
        });
    });
}

exports.retrieveUrl = function (database, hash) {
    return new Promise(function (resolve, reject) {
        database.get('SELECT url FROM urls WHERE id=$id', {$id: hash},
            function (error, row) {
                if (row) {
                    resolve(row['url']);
                } else {
                    reject(error);
                }
            });
    })
}

exports.storeUrl = function (database, url, hash) {
    return new Promise(function (resolve, reject) {
        database.run('INSERT INTO urls (url, id) VALUES ($url, $id)',
            {$url: url, $id: hash},
            function (error) {
                if (error && error.code != 'SQLITE_CONSTRAINT') {
                    reject(error);
                } else {
                    resolve();
                }
            });
    });
}

