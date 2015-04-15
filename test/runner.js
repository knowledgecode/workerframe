/*global phantom */
'use strict';

var page = require('webpage').create(),
    url = 'http://localhost:3000/test/test.html';

page.onConsoleMessage = function (msg) {
    console.log(msg);
};

page.onCallback = function (data) {
    phantom.exit(data | 0);
};

page.open(url, function (status) {
    if (status !== 'success') {
        return phantom.exit(1);
    }
});
