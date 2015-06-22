# Worker Frame [![Circle CI](https://circleci.com/gh/knowledgecode/workerframe.svg?style=shield)](https://circleci.com/gh/knowledgecode/workerframe)
This is a tiny framework for Web Workers.  

## Features
- be able to wtite workers in a same file  
- be able to transmit and receive messages by type  
- be able to use console.log in workers (will help with debugging)  

## Install
``` html
<script src="workerframe.min.js"></script>
```

## Usage
```javascript
var worker = new WorkerFrame(function () {
    // executed this code in the worker context
    self.on('add', function (data) {
        self.message('answer', data[0] + data[1]);
    });
});

worker.on('answer', function (data) {
    console.log(data);  // => 48
});
worker.message('add', [16, 32]);
```
If transmit a message to a worker via type "A", the worker can receive it via type "A". And vice versa.  

## API
### new WorkerFrame(task)
```javascript
// can't access values and objects that are in out of this function.
// note that it works in the worker thread.
var task = function () {
    self.on('calc', function (data) {
        self.message('complete', data.width * data.height);
    });
};
var worker = new WorkerFrame(task);
```
### worker.message(type, data[, transferList])
```javascript
worker.message('calc', { width: 640, height: 480 });
```
`transferList` is an optional array of Transferable objects (refer to [here](https://developer.mozilla.org/en-US/docs/Web/API/Transferable)).  
### worker.on(type, handler)
```javascript
var oncomplete = worker.on('complete', function (data) {
    console.log('the task has been completed: ' + data);
});
```
Also can catch errors that occur in a worker as below:  
```javascript
worker.on('error', function (err) {
    console.log(err);
});
```
### worker.off(type, handler)
```javascript
worker.off('complete', oncomplete);
```
### worker.close()
Instruct the worker to close cleanly (not "abort"). If call this method, it is fired "close" event in the worker before actually closing.
```javascript
var worker = new WorkerFrame(function () {
    self.on('close', function () {
        console.log('I will be shut down soon!');
    });
});

worker.close();
```
## Worker Context
### self.message(type, data[, transferList])
```javascript
var worker = new WorkerFrame(function () {
    self.message('say', 'hello');
});
```
### self.on(type, handler)
```javascript
var worker = new WorkerFrame(function () {
    self.on('add', function (data) {
        self.message('answer', data[0] + data[1]);
    });
});
```
### self.off(type, handler)
```javascript
var worker = new WorkerFrame(function () {
    var add = self.on('add', function (data) {
        self.message('answer', data[0] + data[1]);
    });
    self.off('add', add);
});
```
### console.log(msg)
```javascript
var worker = new WorkerFrame(function () {
    console.log('debuggable!!');
});
```

## Browser Support
Chrome, Firefox, Safari, Opera, Android 4.4+, iOS 6+, and Internet Explorer 11.  

## License
MIT  
