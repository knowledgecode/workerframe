'use strict';

var http = require('http'),
    path = require('path'),
    fs = require('fs');

http.createServer(function (req, res) {
    var type = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript'
    };

    if (req.method.toLowerCase() === 'get') {
        var file = path.join(__dirname, req.url === '/' ? '/index.html' : req.url);

        fs.readFile(file, function (err, body) {
            if (err) {
                res.writeHead(404);
                res.end();
                return;
            }
            res.writeHead(200, {
                'Content-Length': body.length,
                'content-type': type[path.extname(file)] || 'text/plain'
            });
            res.end(body);
        });
        return;
    }

    res.writeHead(404);
    res.end();

}).listen(3000);
