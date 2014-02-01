# co-mutex

[![Build Status](https://travis-ci.org/logicalparadox/co-mutex.png?branch=master)](https://travis-ci.org/logicalparadox/co-mutex)

> [Mutex](http://en.wikipedia.org/wiki/Mutual_exclusion) primitive for generator flow control.

## Installation

#### Node.js

`co-mutex` is available through [npm](http://npmjs.org):

    npm install co-mutex

## Example

```js
var co = require('co');
var Mutex = require('co-mutex').Mutex;

var queue = [];
var DONE = false;

/**
 * Produce a line of data simulating async when
 * mutex has given the producer access. Wait
 * if the queue has reached its high watermark.
 *
 * @param {Mutex}
 */

function *producer(mutex) {
  while (true) {
    yield mutex.lock(function*(cond) {
      // wait for shift
      while (10 == queue.length && !DONE) yield cond.wait('shift');
      if (DONE) return;

      // compute
      var num = rand();
      yield wait(num);
      queue.push(num);

      // emit push event
      cond.signal('push');
    });

    if (DONE) break;
  }
}

/**
 * Consume a line of data simulating async when
 * the mutex has given the consumer access. Wait
 * if the queue is empty.
 *
 * @param {Mutex}
 */

function *consumer(mutex) {
  while (true) {
    yield mutex.lock(function*(cond) {
      // wait for push
      while (!queue.length && !DONE) yield cond.wait('push');
      if (DONE && !queue.length) return;

      // compute
      var num = queue.shift();
      yield wait(num);
      console.log('(consumer) recv:', num);

      // emit shift event
      cond.signal('shift');
    });

    if (DONE && !queue.length) break;
  }
}

/**
 * Create a mutex to be shared between the
 * consumer and the producer. Spawn the coroutines
 * then wait 10 seconds before signalling shutdown.
 */

co(function *main() {
  var mutex = new Mutex();
  co(producer)(mutex);
  co(consumer)(mutex);
  yield wait(10000);
  DONE = true;
})();

/*!
 * Random data generator
 */

function rand() {
  return Math.floor(Math.random() * 100) * 10;
}
```

## Usage

Mutex implementation that uses a closure to ensure
of lock release on error. Can use optional `Condvar`
to drop then re-aquire lock on future state change.

### .locked

Get the lock status of this mutex.

* **@return** _{Boolean}_  locked

```js
if (mutex.locked) {
  // ...
}
```

### .lock(blk)

Acquire access to mutex resources in closure.
Will release access on return or error before
forwarding result to yield.

* **@param** _{Generator}_ closure*(cond) 

```js
var result = yield mutex.lock(function*(condvar) {
  // do resource altering stuff
  return res;
});
```

### .acquire()

Acquire access and lock the mutex. Cannot
safegaurd against deadlock scenarios.

```js
yield mutex.acquire();
```

### .release()

Relase access and unlock the mutex. Cannot
safegaurd against deadlock scenarios.

```js
yield mutex.release();
```

## License

(The MIT License)

Copyright (c) 2014 Jake Luer <jake@alogicalparadox.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. 
