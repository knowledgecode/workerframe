/**
 * @preserve workerframe (c) 2015 KNOWLEDGECODE | MIT
 */
/*global define */
(function (w) {
    'use strict';

    var URL = w.URL || w.webkitURL,
        Blob = (function () {
            var Builder = w.BlobBuilder || w.WebKitBlobBuilder || w.MSBlobBuilder;
            if (Builder) {
                return function (data, contentType) {
                    var blob = new Builder();
                    blob.append(data[0]);
                    return blob.getBlob(contentType.type);
                };
            }
            return w.Blob;
        }()),
        WorkerFrame = function (fn) {
            var frame, blobURL, that = this;

            if (this === window || typeof fn !== 'function') {
                throw new TypeError('Failed to construct \'WorkerFrame\'.');
            }
            frame = function (_origin, _pathname, _fn) {
                var s = self, _l = {}, importScripts = s.importScripts, slice = Array.prototype.slice;

                s.importScripts = function () {
                    slice.call(arguments).map(function (script) {
                        importScripts((function (url) {
                            var pathname = _pathname;

                            if (/^(https?|file):\/\//.test(url)) {
                                return url;
                            }
                            if (/^\.{1,2}\//.test(url)) {
                                while (url.indexOf('../') === 0) {
                                    url = url.slice(3);
                                    pathname = pathname.replace(/\/[^\/]*\/?$/, '/');
                                }
                                while (url.indexOf('./') === 0) {
                                    url = url.slice(2);
                                }
                            } else if (url.indexOf('/') === 0) {
                                pathname = '';
                            }
                            return _origin + pathname + url;
                        }(script)));
                    });
                };
                s.message = function (type, data, transferList) {
                    postMessage({ _type: type, _data: data }, transferList);
                };
                s.console = {
                    log: function () {
                        s.message('_l', slice.call(arguments));
                    }
                };
                s.on = function (type, listener) {
                    var el = _l[type] || [];

                    if (el.indexOf(listener) < 0) {
                        el.push(listener);
                        _l[type] = el;
                    }
                    return listener;
                };
                s.off = function (type, listener) {
                    var i, el = _l[type] || [];

                    i = el.indexOf(listener);
                    if (i >= 0) {
                        el.splice(i, 1);
                    }
                };
                s.addEventListener('message', function (evt) {
                    var type = evt.data._type, data = evt.data._data;

                    if (type) {
                        (_l[type] || []).map(function (el) {
                            el(data);
                        });
                        if (type === 'close') {
                            s.close();
                            s.message('_c');
                        }
                    }
                });
                _fn();
            };
            blobURL = URL.createObjectURL(new Blob([
                '(%s(\'%s\', \'%s\', %s));'
                .replace('%s', frame.toString())
                .replace('%s', location.origin.replace('null', 'file://'))
                .replace('%s', location.pathname.replace(/\/[^\/]*$/, '/'))
                .replace('%s', fn.toString())
            ], { type: 'text/javascript' }));
            this._l = {};
            this._w = new Worker(blobURL);
            this._w.addEventListener('message', function (evt) {
                var type = evt.data._type, data = evt.data._data;

                switch (type) {
                case '_l':
                    console.log.apply(console, data);
                    break;
                case '_c':
                    URL.revokeObjectURL(blobURL);
                    that._l = that._w = undefined;
                    break;
                default:
                    that._d(type, data);
                }
            });
            this._w.addEventListener('error', function (evt) {
                that._d('error', evt);
            });
        },
        WorkerFramePrototype = function () {
            this.message = function (type, data, transferList) {
                this._w.postMessage({ _type: type, _data: data }, transferList);
            };
            this.close = function () {
                this.message('close');
            };
            this.on = function (type, listener) {
                var el = this._l[type] || [];

                if (el.indexOf(listener) < 0) {
                    el.push(listener);
                    this._l[type] = el;
                }
                return listener;
            };
            this.off = function (type, listener) {
                var i, el = this._l[type] || [];

                i = el.indexOf(listener);
                if (i >= 0) {
                    el.splice(i, 1);
                }
            };
            this._d = function (type, data) {
                (this._l[type] || []).map(function (el) {
                    el(data);
                });
            };
        };

    WorkerFrame.prototype = new WorkerFramePrototype();
    WorkerFrame.prototype.constructor = WorkerFrame;

    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return WorkerFrame;
        });
    } else {
        w.WorkerFrame = WorkerFrame;
    }

}(this));
