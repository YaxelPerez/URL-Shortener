/*

URL Shortener

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


var http = require('http');
var filecache = require('filecache');
var crypto = require('crypto');

var mime = require('mime');
var charset = require('charset');

var parseurl = require('url').parse;
var parsequery = require('querystring').parse;

var validUrl = require('valid-url');

var urlDatabase = require('./urlDatabase.js');
var processRequest = require('./processRequest.js'); // returns a function

function cacheDirectory(directory) {
    return new Promise(function (resolve, reject) {
        filecache(directory, function (error, cache) {
            if (error) {
                reject(error);
            } else {
                console.log("Cached " + directory)
                resolve(cache);
            }
        })
    });
}

function hashUrl (url) {
    var sha = crypto.createHash('sha1');
    sha.update(url);
    return sha.digest('base64').slice(0, 8).replace('+', '-').replace('=', '_');
}

cacheDirectory('static/').then(function (cache) {
    urlDatabase.loadDatabase('urls.db').then(function (database) {
        http.createServer(function (request, response) {

            var parsedurl = parseurl(request.url);
            var pathname = parsedurl.pathname;
            var parsedQuery = parsequery(parsedurl.query);

            // get ready for some illogical logic buddy

            if (pathname == '/') {

                // index.html is default site when visiting root
                response.writeHead(200);
                response.end(cache['/index.html'].toString());

            } else if (pathname in cache) {

                // if it's an actual file in the filecache
                response.writeHead(200);

                file = cache[pathname];
                mimeType = mime.lookup(pathname);
                if (charset(mimeType) == 'utf8') {
                    response.end(file.toString('utf8')); // send text if text
                } else {
                    response.end(file); // bytes if otherwise
                }

            } else if (pathname == '/shorten/') {

                if ('url' in parsedQuery && validUrl.isWebUri(parsedQuery['url'])) {

                    // stupid node won't let me use let (pun kinda intended)
                    var hash = hashUrl(parsedQuery['url']); // hash url
                    // store the url and hash in our database
                    urlDatabase.storeUrl(database, parsedQuery['url'], hash)
                        .then(function () {
                            response.writeHead(200);
                        response.end(hash); // send back the hash
                        },
                        console.error);

                } else {
                    console.error("Bad Request: " + parsedQuery['url']);
                    response.writeHead(400);
                    response.end('400 Bad Request. Did you add "http://" or "https://" at the beginning?');
                }

            } else {

                // finally, see if the pathname is a hashed url
                var hash = pathname.split('/')[1] // get rid of the slash
                urlDatabase.retrieveUrl(database, hash).then(function (url) {
                    response.writeHead(301,{
                        "Location": url
                    });
                    response.end();
                },
                function (error) {
                    console.log(error);
                    // we don't have the hash yet :(
                    response.writeHead(404);
                    response.end('404 Not Found');

                });

            }
        }).listen(80, function () {
            console.log('Server listening on port 80');
        })
    },
    console.error) // pass error to console.error to log to console
},
    console.error
);