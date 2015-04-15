/*global WorkerFrame, Uint8Array */
(function () {
    'use strict';

    describe('Worker Frame', function () {
        it('basic echo', function (done) {
            var worker = new WorkerFrame(function () {
                self.on('echo', function (data) {
                    self.message('echo', data);
                });
            });

            worker.on('echo', function (data) {
                try {
                    data.should.be.equal('hello world!');
                    done();
                } catch (e) {
                    done(e);
                }
            });
            worker.message('echo', 'hello world!');
        });

        it('closable', function (done) {
            var worker = new WorkerFrame(function () {
                self.on('echo', function (data) {
                    self.message('echo', data);
                });
            });

            worker.on('echo', function () {
                try {
                    (true).should.be.equal(false);
                } catch (e) {
                    done(e);
                }
            });
            worker.close();
            worker.message('echo', 'hello world!');
            setTimeout(function () {
                done();
            }, 100);
        });

        it('firing an event before closing', function (done) {
            var worker = new WorkerFrame(function () {
                self.on('close', function () {
                    self.message('close', 'closing...');
                });
            });

            worker.on('close', function (data) {
                try {
                    data.should.be.equal('closing...');
                    done();
                } catch (e) {
                    done(e);
                }
            });
            worker.close();
        });

        it('canceling events', function (done) {
            var worker = new WorkerFrame(function () {
                self.on('echo', function (data) {
                    self.message('echo', data);
                });
            });
            var handler;

            worker.on('echo', handler = function (data) {
                try {
                    data.should.not.be.equal('hello world!');
                } catch (e) {
                    done(e);
                }
            });
            worker.off('echo', handler);
            worker.message('echo', 'hello world!');
            setTimeout(function () {
                done();
            }, 100);
        });

        it('canceling events in a workerframe', function (done) {
            var worker = new WorkerFrame(function () {
                var handler;

                self.on('echo', handler = function (data) {
                    self.message('echo', data);
                });
                self.off('echo', handler);
            });

            worker.on('echo', function (data) {
                try {
                    data.should.not.be.equal('hello world!');
                } catch (e) {
                    done(e);
                }
            });
            worker.message('echo', 'hello world!');
            setTimeout(function () {
                done();
            }, 100);
        });

        it('firing multi events', function (done) {
            var worker = new WorkerFrame(function () {
                self.on('echo', function (data) {
                    self.message('echo', data);
                });
                self.on('pow', function (data) {
                    self.message('pow', data * data);
                });
            });

            var res = [false, false];
            var all = function (n) {
                res[n] = true;
                return res.every(function (r) {
                    return r;
                });
            };

            worker.on('echo', function (data) {
                try {
                    data.should.be.equal('hello world!');
                    if (all(0)) {
                        done();
                    }
                } catch (e) {
                    done(e);
                }
            });
            worker.on('pow', function (data) {
                try {
                    data.should.be.equal(256);
                    if (all(1)) {
                        done();
                    }
                } catch (e) {
                    done(e);
                }
            });
            worker.message('echo', 'hello world!');
            worker.message('pow', 16);
        });

        it('importing a script', function (done) {
            var worker = new WorkerFrame(function () {
                self.importScripts('add.js');

                self.on('add', function (data) {
                    var a = self.add(data.x, data.y);
                    self.message('calc', a);
                });
            });

            worker.on('calc', function (data) {
                try {
                    data.should.be.equal(64);
                    done();
                } catch (e) {
                    done(e);
                }
            });
            worker.message('add', { x: 16, y: 48 });
        });

        it('importing scripts', function (done) {
            var worker = new WorkerFrame(function () {
                self.importScripts('add.js', 'sub.js');

                self.on('calc', function (data) {
                    var a = self.add(data.x, data.y);
                    var b = self.sub(data.x, data.y);
                    self.message('calc', { add: a, sub: b });
                });
            });

            worker.on('calc', function (data) {
                try {
                    data.add.should.be.equal(64);
                    data.sub.should.be.equal(32);
                    done();
                } catch (e) {
                    done(e);
                }
            });
            worker.message('calc', { x: 48, y: 16 });
        });

        it('zero-copy', function (done) {
            var worker = new WorkerFrame(function () {
                self.on('arraybuffer', function (data) {
                    self.message('size', data.length);
                });
            });

            var buff = new Uint8Array(100000);

            worker.on('size', function (data) {
                try {
                    data.should.be.equal(100000);
                    done();
                } catch (e) {
                    done(e);
                }
            });

            try {
                worker.message('arraybuffer', buff, [buff.buffer]);
                try {
                    buff.length.should.be.equal(0);
                } catch (e) {
                    done(e);
                }
            } catch (e) {
                worker.message('arraybuffer', buff);
            }
        });

        it('forgetting "new"', function (done) {
            try {
                var worker = WorkerFrame(function () {});
                try {
                    (true).should.be.equal(false);
                } catch (e) {
                    done(e);
                }
            } catch (e) {
                return done();
            }
        });

        it('no arguments', function (done) {
            try {
                var worker = new WorkerFrame();
                try {
                    (true).should.be.equal(false);
                } catch (e) {
                    done(e);
                }
            } catch (e) {
                return done();
            }
        });

        it('wrong argument type', function (done) {
            try {
                var worker = new WorkerFrame('test.js');
                try {
                    (true).should.be.equal(false);
                } catch (e) {
                    done(e);
                }
            } catch (e) {
                return done();
            }
        });

        it('firing an error event', function (done) {
            var worker = new WorkerFrame(function () {
                throw new Error();
            });

            worker.on('error', function (data) {
                done();
            });
            setTimeout(function () {
                try {
                    (true).should.be.equal(false);
                } catch (e) {
                    done(e);
                }
            }, 100);
        });
    });

}());
