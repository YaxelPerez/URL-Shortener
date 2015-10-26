'use strict'
// I think the refactoring made it worse
// abandon hope, all ye who enter

// also, hash and id are used synonymously
// sorry :(

/*
Copyright (c) 2015 Yaxel Perez

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var crypto = require('crypto');
var http = require('http');
var url = require('url');
var querystring = require('querystring');
var sqlite3 = require('sqlite3');
var filecache = require('filecache');
var validUrl = require('valid-url');
var mime = require('mime');

// lol look at all these dependencies

function fixUrl(toFix) {
     // add the http if it doesn't have it
    if (toFix.indexOf("http://") == -1 && toFix.indexOf("https://") == -1) {
        return "http://" + toFix;
    } else {
        return toFix;
    }
}

function hashUrl(toHash) {
    // get sha hash of url in base64 and truncate to 8 chars
    var sha = crypto.createHash('sha1');
    sha.update(toHash);
    return sha.digest('base64').slice(0, 8).replace('+', '-').replace('=', '_');
} // get hash

function storeUrl(database, url, id) {
    // ahh es6 when do I use promises halp
    return new Promise(function (resolve, reject) {
        database.run("INSERT INTO urls (url, id) VALUES ($url, $id);", {$url: url, $id: id},
            function (error) {
                reject(error);
            });
        resolve();
    });
}

function retrieveUrl(database, id) {
    return new Promise(function (resolve, reject) {
        database.get("SELECT url FROM urls WHERE id=$id", {$id : id},
            function (error, row) {
                if (row != undefined) {
                    resolve(row['url']);
                } else {
                    reject(error);
                }
            });
    });
}

function returnFile(response, cache, filename, status) {
    if (status == undefined) {
        status = 200;
    }
    var mimeType = mime.lookup(filename);

    response.writeHead(status, {
        "Content-Type": mimeType
    });
    if (mimeType.indexOf("text") != -1 || mimeType == "application/json") {
        response.end(cache[filename].toString('utf-8'))
    } else {
        response.end(cache[filename]);
    }
}

function returnHash(database, response, tohash) {
        response.writeHead(200, {
            "Content-Type": "text/plain"
        });
        var hash = hashUrl(fixUrl(parsedQuery['url']));
        response.end(hash);
        return hash;
    } else {
        throw "invalid query";
    }
}

function redirect(response, id) {

}

function processRequest(cache, database, request, response) {
    var parsedUrl = url.parse(request.url);
    var pathname = parsedUrl.pathname;
    var query = parsedUrl.query;

    if (pathname == "/") {
        returnFile(response, cache, "/index.html");
    } else if (pathname in cache) {
        returnFile(response, cache, pathname);
    } else if (pathname == "/shorten/") {
        try {

            var parsedQuery = querystring.parse(query);
            if ('url' in parsedQuery) {
                queryUrl =
                // todo fix this
            hash = returnHash(response, query);
            storeUrl(database, hash);
        } catch (error) {
            console.error(error);
            response.writeHead(400);
            response.end("Bad Request");
        }
    } else {
        var id = pathname.split('/')[1]; // get the thing without /
        retrieveUrl(database, id).then(function(shortenedUrl) {
            response.writeHead(301, {
                "Content-Type": "text/plain",
                "Location": shortenedUrl
            });
            response.end();
        },
        function (error) {
            if (error == undefined) {
                console.error("Invalid Query");
                returnFile(response, cache, "/notFound.html", 400);
            } else {
                console.error("Database Error: " + error);
                response.writeHead(501);
                response.end("501 Internal Server Error");
            }
        })
    }
}

filecache('static/', function(err, cache) {
    console.log("Loaded /static/ into cache.")
    var db = new sqlite3.Database('urls.db'); // load sqlite database
    console.log("Loaded database urls.db.")

    http.createServer(function (request, response) {
        // TODO: Add proper headers (mime type)
        processRequest(cache, db, request, response);
    }).listen(80, function() {
        console.log("Listening on port 80");
    });
});
