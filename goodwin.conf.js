module.exports = function(config) {
  config.set({
    globals: {
      co: require('co'),
      Mutex: require('./index').Mutex,
      Future: require('co-future').Future,
      wait: function(ms) {
        return function(done) {
          setTimeout(done, ms);
        }
      }
    },
    tests: [
      'test/*.js'
    ]
  });
}
