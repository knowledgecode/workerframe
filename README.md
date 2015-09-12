# Worker Frame [![Circle CI](https://circleci.com/gh/knowledgecode/workerframe.svg?style=shield)](https://circleci.com/gh/knowledgecode/workerframe)
This is a tiny framework for Web Workers.  

## Features
- It is possible to write Worker's code in a same file.
- Both Promise and Callback pattern support.
- It is possible to use console.log in Workers (It will help with debugging).
- Fast loading (1.2kb gz).

## Install
``` html
<!-- install a Promise polyfill for unsupported browser -->
<script src="es6-promise.min.js"></script>
<script src="workerframe.min.js"></script>
```

## Usage
Callback pattern:
```javascript
var worker = new WorkerFrame(function () {
    // it is executed this code in the worker context >>>
    self.on('add', function (data) {
        self.message('answer', data[0] + data[1]);
    });
    // <<< it is executed this code in the worker context
});

worker.on('answer', function (data) {
    console.log(data);  // => 48
});
worker.message('add', [16, 32]);
```
If transmit a message to worker via type "foo", the worker can receive it via type "foo". And vice versa.  

Promise pattern:
```javascript
var worker = new WorkerFrame(function () {
    // it is executed this code in the worker context >>>
    self.on('add', function (data, success, failure) {
        success(data[0] + data[1];
    });
    // <<< it is executed this code in the worker context
});

worker.message('add', [16, 32])
.then(function (data) {
    console.log(data);  // => 48
})
.catch(function (err) {
    // If the worker returns something error via failure(), this is called.
});
```

## API
### `new WorkerFrame(task)`
```javascript
var foo = 'untouchable';

// It is unable to access values and objects that are out of this function.
// Note that it works in the worker thread.
var task = function () {
    self.on('calc', function (data) {
        self.message('complete', data.width * data.height);
    });

    // This will cause an error! (Because the `foo` is out of this function.)
    console.log(foo);
};

var worker = new WorkerFrame(task);
```
### `worker.message(type, data[, transferList])`
```javascript
worker.message('calc', { width: 640, height: 480 });
```
`transferList` is an optional array of Transferable objects (refer to [here](https://developer.mozilla.org/en-US/docs/Web/API/Transferable)).  
### `worker.on(type, handler)`
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
### `worker.off(type, handler)`
```javascript
worker.off('complete', oncomplete);
```
### `worker.one(type, handler)`
The auto off version of `worker.on`.
```javascript
var oncomplete = worker.one('complete', function (data) {
    console.log('the task has been completed: ' + data);
});
```

### `worker.close()`
Close the worker cleanly (not "abort"). If it is also called this method, it is fired `close` event in the worker before actually closing. You may hook this event for performing finalization.
```javascript
var worker = new WorkerFrame(function () {
    self.on('close', function () {
        console.log('I will be shut down soon!');
    });
});

worker.close();
```
## Worker Context
The following functions are able to use only in worker context.
### `self.message(type, data[, transferList])`
```javascript
var worker = new WorkerFrame(function () {
    self.message('say', 'hello');
});
```
### `self.on(type, handler)`
```javascript
var worker = new WorkerFrame(function () {
    self.on('add', function (data) {
        self.message('answer', data[0] + data[1]);
    });
});
```
```javascript
var worker = new WorkerFrame(function () {
    self.on('add', function (data, success, failure) {
        success(data[0] + data[1]);
    });
});
```
### `self.off(type, handler)`
```javascript
var worker = new WorkerFrame(function () {
    var add = self.on('add', function (data) {
        self.message('answer', data[0] + data[1]);
    });
    self.off('add', add);
});
```
### `self.one(type, handler)`
```javascript
var worker = new WorkerFrame(function () {
    self.one('add', function (data) {
        self.message('answer', data[0] + data[1]);
    });
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
If import some scripts via `self.importScripts` in this framework, they have to be given absolute path. As this framework has the `origin` property, make the absolute path with using it.
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
