suite('.locked', function() {
  test('.acquire() sets state locked = true', co(function*() {
    var mut = new Mutex();
    mut.locked.should.be.false;
    yield mut.acquire();
    mut.locked.should.be.true;
  }));

  test('.release() sets state locked = false', co(function*() {
    var mut = new Mutex();
    mut.locked.should.be.false;
    yield mut.acquire();
    mut.locked.should.be.true;
    mut.release();
    mut.locked.should.be.false;
  }));
});

suite('.lock()', function() {
  test('invokes queued functions serially', co(function*() {
    var mut = new Mutex();
    var calls = [];

    co(function*() {
      yield mut.lock(function*() {
        calls.push(true);
        calls.length.should.equal(1);
        yield wait(10);
      });
    })();

    co(function*() {
      yield mut.lock(function*() {
        calls.push(true);
        calls.length.should.equal(2);
        yield wait(10);
      });
    })();

    yield mut.lock(function*() {
      calls.push(true);
      calls.length.should.equal(3);
    });
  }));
});

suite('.lock(cond)', function() {
  test('imposes conditional locks', co(function*() {
    var mut = new Mutex();
    var queue = [];
    var DONE = false;

    var ci = 0;
    var pi = 0;

    var producer = Future(function*() {
      while (true) {
        yield mut.lock(function*(cond) {
          while (queue.length && !DONE) yield cond.wait('shift');
          if (DONE) return;
          yield wait(16);
          queue.push(pi++);
          cond.signal('push');
        });

        if (DONE) break;
      }
    });

    var consumer = Future(function*() {
      while (true) {
        yield mut.lock(function*(cond) {
          while (!queue.length && !DONE) yield cond.wait('push');
          yield wait(8);
          var num = queue.shift();
          num.should.equal(ci++);
          cond.signal('shift');
        });

        if (DONE && !queue.length) break;
      }
    });

    yield wait(200);
    DONE = true;
    yield producer.wait();
    yield consumer.wait();

    queue.length.should.equal(0);
    ci.should.be.gt(0);
    ci.should.equal(pi);

    consumer.unwrap();
    producer.unwrap();
  }));
});
