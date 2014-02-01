"use strict";

/*!
 * Module dependencies
 */

var Condvar = require('co-condvar').Condvar;
var Future = require('co-future').Future;

/**
 * Mutex implementation that uses a closure to ensure
 * of lock release on error. Can use optional `Condvar`
 * to drop then require lock on future state change.
 *
 * @api public
 */

var Mutex = exports.Mutex = function Mutex() {
  this.state = {
    type: 'mutex',
    locked: false,
    cond: new Condvar()
  }
}

/*!
 * Prototype
 */

Mutex.prototype = {

  constructor: Mutex,

  /**
   * Get the lock status of this mutex.
   *
   * @return {Boolean} locked
   * @api public
   */

  get locked() {
    return this.state.locked;
  },

  /**
   * Acquire access to mutex resources in closure.
   * Will release access on return or error before
   * forwarding result to yield.
   *
   * @param {Generator} closure*(cond)
   * @yield {Mixed} closure return value
   * @api public
   */

  lock: function*(blk) {
    var self = this.state;
    yield this.acquire();
    var f_res = yield Future(blk(self.cond)).wait();
    this.release();
    return f_res.unwrap();
  },

  /**
   * Acquire access and lock the mutex. Cannot
   * safegaurd against deadlock scenarios.
   *
   * @yield {Boolean} access acquired
   * @api public
   */

  acquire: function*() {
    yield this.state.cond.lock.acquire();
    this.state.locked = true;
    return true;
  },

  /**
   * Relase access and unlock the mutex. Cannot
   * safegaurd against deadlock scenarios.
   *
   * @yield {Boolean} access acquired
   * @api public
   */

  release: function() {
    this.state.locked = false;
    this.state.cond.lock.release();
  }

}
