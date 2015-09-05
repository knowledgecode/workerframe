/**
 * @preserve workerframe (c) 2015 KNOWLEDGECODE | MIT
 */
(function (g) {
    'use strict';

    var URL = g.URL || g.webkitURL,
        Blob = (function () {
            var Builder = g.BlobBuilder || g.WebKitBlobBuilder || g.MSBlobBuilder;
            if (Builder) {
                return function (data, contentType) {
                    var blob = new Builder();
                    blob.append(data[0]);
                    return blob.getBlob(contentType.type);
                };
            }
            return g.Blob;
        }()),
        WorkerFrame = function (fn) {
            var frame, blobURL, that = this;

            if (this === window || typeof fn !== 'function') {
                throw new TypeError('Failed to construct \'WorkerFrame\'.');
            }
            frame = function (_origin, _uid, _fn) {
                var s = self, _l = {}, _o = {}, slice = Array.prototype.slice,
                    _on = function (listeners, type, listener) {
                        var el = listeners[type] || [];

                        if (el.indexOf(listener) < 0) {
                            el.push(listener);
                            listeners[type] = el;
                        }
                        return listener;
                    },
                    _off = function (listeners, type, listener) {
                        var i, el = listeners[type] || [];

                        if (listener) {
                            i = el.indexOf(listener);
                            if (i >= 0) {
                                el.splice(i, 1);
                            }
                        } else {
                            delete listeners[type];
                        }
                    };

                s.origin = _origin;
                s.message = function (type, data, transferList) {
                    postMessage({ _type: type, _data: data }, transferList);
                };
                s.console = {
                    log: function () {
                        s.message('_l', slice.call(arguments));
                    }
                };
                s.on = function (type, listener) {
                    return _on(_l, type, listener);
                };
                s.one = function (type, listener) {
                    return _on(_o, type, listener);
                };
                s.off = function (type, listener) {
                    _off(_l, type, listener);
                    _off(_o, type, listener);
                };
                s.addEventListener('message', function (evt) {
                    var type = evt.data._type, data = evt.data._data,
                        callback = function (el) {
                            el(data, function (res) {
                                s.message(type, { _uid: _uid, _ok: true, _data: res });
                            }, function (err) {
                                s.message(type, { _uid: _uid, _ok: false, _data: err });
                            });
                        };

                    if (type) {
                        (_l[type] || []).map(callback);
                        (_o[type] || []).map(callback);
                        delete _o[type];
                        if (type === 'close') {
                            s.close();
                            s.message('_c');
                        }
                    }
                });
                _fn();
            };
            this._uid = Math.random().toString(36).slice(2);
            blobURL = URL.createObjectURL(new Blob([
                '(%s(\'%s\', \'%s\', %s));'
                .replace('%s', frame.toString())
                .replace('%s', location.origin.replace('null', 'file://'))
                .replace('%s', this._uid)
                .replace('%s', fn.toString())
            ], { type: 'text/javascript' }));
            this._l = {};
            this._o = {};
            this._p = {};
            this._w = new Worker(blobURL);
            this._w.addEventListener('message', function (evt) {
                var type = (evt.data || {})._type || '', data = (evt.data || {})._data;

                switch (type) {
                case '_l':
                    console.log.apply(console, data);
                    break;
                case '_c':
                    URL.revokeObjectURL(blobURL);
                    that._l = that._o = that._p = that._w = undefined;
                    break;
                case '':
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
            var _on = function (listeners, type, listener) {
                var el = listeners[type] || [];

                if (el.indexOf(listener) < 0) {
                    el.push(listener);
                    listeners[type] = el;
                }
                return listener;
            }, _off = function (listeners, type, listener) {
                var i, el = listeners[type] || [];

                if (listener) {
                    i = el.indexOf(listener);
                    if (i >= 0) {
                        el.splice(i, 1);
                    }
                } else {
                    delete listeners[type];
                }
            };

            this.message = function (type, data, transferList) {
                var that = this,
                    promise = new Promise(function (resolve, reject) {
                        _on(that._p, type, function (res) {
                            if ((res || {})._uid === that._uid) {
                                if (res._ok) {
                                    resolve(res._data);
                                } else {
                                    reject(res._data);
                                }
                            }
                        });
                    });

                this._w.postMessage({ _type: type, _data: data }, transferList);
                return promise;
            };
            this.close = function () {
                this.message('close');
            };
            this.on = function (type, listener) {
                return _on(this._l, type, listener);
            };
            this.one = function (type, listener) {
                return _on(this._o, type, listener);
            };
            this.off = function (type, listener) {
                _off(this._l, type, listener);
                _off(this._o, type, listener);
            };
            this._d = function (type, data) {
                var that = this,
                    callback = function (el) {
                        if ((data || {})._uid === that._uid) {
                            el(data._data);
                        } else {
                            el(data);
                        }
                    };

                (this._l[type] || []).map(callback);
                (this._o[type] || []).map(callback);
                delete this._o[type];
                (this._p[type] || []).map(function (el) {
                    el(data);
                });
                delete this._p[type];
            };
        };

    WorkerFrame.prototype = new WorkerFramePrototype();
    WorkerFrame.prototype.constructor = WorkerFrame;

    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return WorkerFrame;
        });
    } else {
        g.WorkerFrame = WorkerFrame;
    }

}(this));

