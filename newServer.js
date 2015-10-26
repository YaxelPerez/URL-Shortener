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

var urlDatabase = require('./urlDatabase.js');
var processRequest = require('./processRequest.js'); // returns a function

function cacheDirectory(directory) {
    return new Promise(function (resolve, reject) {
        filecache(directory, function (error, cache) {
            if (error) {
                reject(error);
            } else {
                resolve(cache);
            }
        })
    });
}

function hashUrl (url) {
    if (url.indexOf('http://') == -1 && url.indexOf('https://') == -1) {
        url = "http://" + url;
    }
    var sha = crypto.createHash('sha1');
    sha.update(url);
    return sha.digest('base64').slice(0, 8).replace('+', '-').replace('=', '_');
}

cacheDirectory('static/').then(function (cache) {
    urlDatabase.loadDatabase('urls.db').then(function (database) {
        http.createServer(function (request, response) {

            var parsedurl = parseurl(request.url);
            var pathname = parsedurl.pathname;
            var parsedquery = parsequery(parsedurl.query);
        }).listen(80, function () {
            console.log('Server listening on port 80');
        })
    },
    console.error) // pass error to console.error to log to console
},
    console.error
);