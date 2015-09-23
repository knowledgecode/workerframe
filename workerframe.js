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
        WorkerFrame = function (task) {
            var frame, blobURL, that = this;

            if (this === window || typeof task !== 'function') {
                throw new TypeError('Failed to construct \'WorkerFrame\'.');
            }
            frame = function (origin, uid, proc) {
                var channels = {}, slice = Array.prototype.slice;

                /**
                 * @property origin
                 */
                self.origin = origin;

                /**
                 * emit
                 * @param {String} type - A string representing the event type.
                 * @param {Object} [data] - The object to deliver to the main thread.
                 * @param {Array.<Object>} [transferList] - An optional array of Transferable objects to transfer ownership of.
                 * @return {void}
                 */
                self.emit = function (type, data, transferList) {
                    postMessage({ _type: uid + type, _data: data }, transferList);
                };

                /**
                 * bind
                 * @param {String} channel - A string representing the binding channel.
                 * @param {function} handler - The object that receives a messageto the binding channel.
                 * @returns {function} handler or null
                 */
                self.bind = function (channel, handler) {
                    if (channel === 'close') {
                        channel = uid + '_c';
                    } else {
                        channel = uid + channel;
                    }
                    if (channels[channel]) {
                        return null;
                    }
                    channels[channel] = handler;
                    return handler;
                };

                /**
                 * unbind
                 * @param {String} channel - A string representing the binding channel.
                 * @return {void}
                 */
                self.unbind = function (channel) {
                    if (channel === 'close') {
                        channel = uid + '_c';
                    } else {
                        channel = uid + channel;
                    }
                    delete channels[channel];
                };

                if (!self.console) {
                    self.console = {
                        log: function () {
                            postMessage({ _type: uid + '_l', _data: slice.call(arguments) });
                        }
                    };
                }
                self.addEventListener('message', function (evt) {
                    var channel = (evt.data || {})._type, data = (evt.data || {})._data, handler;

                    if (channel) {
                        handler = channels[channel];
                        if (handler) {
                            try {
                                handler(data, function (res) {
                                    postMessage({ _type: channel + '_p', _data: { _ok: true, _data: res } });
                                }, function (err) {
                                    postMessage({ _type: channel + '_p', _data: { _ok: false, _data: err } });
                                });
                            } catch (e) {
                                postMessage({ _type: channel + '_p', _data: { _ok: false, _data: e.message } });
                            }
                        }
                        if (channel === uid + '_c') {
                            postMessage({ _type: channel });
                            channels = undefined;
                            self.close();
                        }
                    }
                }, false);
                proc();
            };
            this._uid = Math.random().toString(36).slice(2);
            blobURL = URL.createObjectURL(new Blob([
                '(%s(\'%s\', \'%s\', %s));'
                .replace('%s', String(frame))
                .replace('%s', location.origin.replace('null', 'file://'))
                .replace('%s', this._uid)
                .replace('%s', String(task))
            ], { type: 'text/javascript' }));
            this._l = {};
            this._o = {};
            this._p = {};
            this._w = new Worker(blobURL);
            this._w.addEventListener('message', function (evt) {
                var type = (evt.data || {})._type || '', data = (evt.data || {})._data;

                switch (type) {
                case that._uid + '_l':
                    console.log.apply(console, data);
                    break;
                case that._uid + '_c':
                    that._l = that._o = that._p = that._w = undefined;
                    break;
                case '':
                    break;
                default:
                    that._d(type, data);
                }
            }, false);
            this._w.addEventListener('error', function (evt) {
                that._d(that._uid + 'error', evt);
            }, false);
            URL.revokeObjectURL(blobURL);
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

            /**
             * send
             * @param {String} channel - A string representing the binding channel.
             * @param {Object} [data] - The object to deliver to the worker.
             * @param {Array.<Object>} [transferList] - An optional array of Transferable objects to transfer ownership of.
             * @return {Object} Promise
             */
            this.send = function (channel, data, transferList) {
                var that = this, p;

                channel = this._uid + channel;
                if (g.Promise && typeof g.Promise === 'function') {
                    p = new Promise(function (resolve, reject) {
                        _on(that._p, channel + '_p', function (res) {
                            if (res._ok) {
                                resolve(res._data);
                            } else {
                                reject(res._data);
                            }
                        });
                    });
                }
                this._w.postMessage({ _type: channel, _data: data }, transferList);
                return p;
            };

            /**
             * close
             * @returns {void}
             */
            this.close = function () {
                this.send('_c');
            };

            /**
             * on
             * @param {String} type - A string representing the event type to listen for.
             * @param {function} listener - The object that receives a notification when an event of the specified type occurs.
             * @returns {function} listener
             */
            this.on = function (type, listener) {
                return _on(this._l, this._uid + type, listener);
            };

            /**
             * one
             * @param {String} type - A string representing the event type to listen for.
             * @param {function} listener - The object that receives a notification when an event of the specified type occurs.
             * @returns {function} listener
             */
            this.one = function (type, listener) {
                return _on(this._o, this._uid + type, listener);
            };

            /**
             * off
             * @param {String} type - A string representing the event type to listen for.
             * @param {function} [listener] - The object that receives a notification when an event of the specified type occurs.
             * @returns {void}
             */
            this.off = function (type, listener) {
                _off(this._l, this._uid + type, listener);
                _off(this._o, this._uid + type, listener);
            };

            this._d = function (type, data) {
                var callback = function (el) { el(data); };

                (this._l[type] || []).map(callback);
                (this._o[type] || []).map(callback);
                (this._p[type] || []).map(callback);
                delete this._o[type];
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

