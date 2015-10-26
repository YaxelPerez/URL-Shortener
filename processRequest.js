// processRequest

var crypto = require('crypto');
var parseQuery = require('querystring').parse;
var parseUrl = require('url').parse;

function hashUrl (url) {
    if (url.indexOf('http://') == -1 && url.indexOf('https://') == -1) {
        url = "http://" + url;
    }
    var sha = crypto.createHash('sha1');
    sha.update(url);
    return sha.digest('base64').slice(0, 8).replace('+', '-').replace('=', '_');
}

exports = function (request, response) {
    var parsedUrl = parseUrl(request.url);
    var pathname = parsedUrl.pathname;
    var parsedQuery = parseQuery(parsedUrl.query);
}