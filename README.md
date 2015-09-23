# Worker Frame [![Circle CI](https://circleci.com/gh/knowledgecode/workerframe.svg?style=shield)](https://circleci.com/gh/knowledgecode/workerframe)
This is a tiny framework for Web Workers.  

## Features
- It is possible to write Worker's code in a same file.
- Both EventEmitter and Promise pattern support.
- It is possible to use console.log in Workers (It will help with debugging).
- Fast loading (1.2kb gz).

## Installation
``` html
<!-- install a Promise polyfill for older browser it is unsupported -->
<script src="es6-promise.min.js"></script>
<script src="workerframe.min.js"></script>
```

## Usage
Example of EventEmitter pattern:
```javascript
var worker = new WorkerFrame(function () {
    // it is executed this code in the worker context >>>
    self.bind('add', function (data) {
        self.emit('answer', data[0] + data[1]);
    });
    // <<< it is executed this code in the worker context
});

worker.on('answer', function (data) {
    console.log(data);  // => 48
});
worker.send('add', [16, 32]));
```

Example of Promise pattern:
```javascript
var worker = new WorkerFrame(function () {
    // it is executed this code in the worker context >>>
    self.bind('add', function (data, success, failure) {
        success(data[0] + data[1]);
    });
    // <<< it is executed this code in the worker context
});

worker.send('add', [16, 32])
.then(function (data) {
    console.log(data);  // => 48
})
.catch(function (err) {
    // If the worker returns something error with failure(), this is called.
});
```

## API
### `new WorkerFrame(task)`
```javascript
var foo = 'untouchable';

// It is unable to access values and objects that are out of this function.
// Note that it works in the worker thread.
var task = function () {
    self.bind('calc', function (data, success, failure) {
        success(data.width * data.height);
    });

    // This will cause an error! (Because the `foo` is out of this function.)
    console.log(foo);
};

var worker = new WorkerFrame(task);
```
### `worker.send(channel[, data[, transferList]])`
```javascript
worker.send('calc', { width: 640, height: 480 });
```
`transferList` is an optional array of Transferable objects (refer to [here](https://developer.mozilla.org/en-US/docs/Web/API/Transferable)).  
### `worker.on(type, listener)`
```javascript
var oncomplete = worker.on('complete', function (data) {
    console.log('the task has been completed: ' + data);
});
```
Also it is able to catch errors that occur in a worker as below:  
```javascript
worker.on('error', function (err) {
    console.log(err);
});
```
### `worker.off(type[, listener])`
```javascript
worker.off('complete', oncomplete);
```
### `worker.one(type, listener)`
The auto off version of `worker.on`.
```javascript
var oncomplete = worker.one('complete', function (data) {
    console.log('the task has been completed: ' + data);
});
```

### `worker.close()`
Close the worker cleanly (not "abort"). If it is also called this method, it is sent `close` message to the worker before actually closing. You may bind it for performing finalization.
```javascript
var worker = new WorkerFrame(function () {
    self.bind('close', function () {
        console.log('I will be shut down soon!');
    });
});

worker.close();
```
## Worker Context
The following functions are able to use only in worker context.
### `self.emit(type[, data[, transferList]])`
Send a message to subscribers from worker.
```javascript
var worker = new WorkerFrame(function () {
    self.emit('say', 'Hello');
});

worker.on('say', function (data) {
    console.log(data + ', John!');  // Hello, John!
});
worker.on('say', function (data) {
    console.log(data + ', Mary!');  // Hello, Mary!
});
```
### `self.bind(channel, handler(data[, success[, failure]]))`
```javascript
var worker = new WorkerFrame(function () {
    self.bind('add', function (data) {
        self.emit('answer', data[0] + data[1]);
    });
});
```
```javascript
var worker = new WorkerFrame(function () {
    self.bind('add', function (data, success, failure) {
        success(data[0] + data[1]);
    });
});
```
### `self.unbind(channel)`
```javascript
var worker = new WorkerFrame(function () {
    self.bind('add', function (data) {
        self.emit('answer', data[0] + data[1]);
    });
    self.unbind('add');
});
```
### `console.log(msg)`
```javascript
var worker = new WorkerFrame(function () {
    console.log('debuggable!!');
});
```
## Caveats
### `self.importScripts(path[, path, ...])`
If import some scripts via `self.importScripts` in this framework, they have to be given absolute path. As this framework has an `origin` property, make the absolute path with using it.
```javascript
var worker = new WorkerFrame(function () {
    // succeed
    self.importScripts(self.origin + '/fetch.js');  // => http://example.com/fetch.js
    // fail
    self.importScripts('fetch.js');
});
```
## `fetch / XMLHttpRequest`
`fetch` and `XMLHttpRequest` apis also need absolute path.
```javascript
var worker = new WorkerFrame(function () {
    // succeed
    fetch(self.origin + '/api/v1/foo');  // => http://example.com/api/v1/foo
    // fail
    self.importScripts('/api/v1/foo');
});
```

## Browser Support
Chrome, Firefox, Safari, Opera, Android 4.4+, iOS 6+, and Internet Explorer 11.  

## License
MIT  
