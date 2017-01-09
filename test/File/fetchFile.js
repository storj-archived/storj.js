'use strict';

var test = require('tape');
var proxyquire = require('proxyquire').noCallThru();

// These tests will all assume the library is implemented with request. In the
// event request is replaced, we will have to rethink these.


var mockBucket = 'ff1be7f1c1c81df4405bb278';
var mockFile = 'a6a85bb9a8d0fdef69814856';

test('createFileToken requests token from bridge', function (t) {
  var bridge = 'foobar'
  var url = `${bridge}/buckets/${mockBucket}/tokens`;
  var File = proxyquire('../../lib/File', {
    request: {
      post: function (opt, cb) {
        t.equal(opt.url, url, 'Requested correct url');
        t.equal(opt.body.file, mockFile, 'Requested correct file');
        t.end();
      }
    }
  });

  var file = new File(mockBucket, mockFile, { bridge: bridge });
});

test('_fetchFile emits error when createFileToken fails', function(t) {
  var bridge = 'foobar'
  var error = new Error('e');
  var File = proxyquire('../../lib/File', {
    request: {
      post: function (opt, cb) {
        setImmediate(cb, error);
      }
    }
  });

  var file = new File(mockBucket, mockFile, { bridge: bridge });
  file.on('error', function (e) {
    t.equal(e, error, 'Passed error through');
    t.end();
  })
});

test('getFilePointers invoked on File creation', function(t) {
  var bridge = 'foobar'
  var url = `${bridge}/buckets/${mockBucket}/files/${mockFile}`;
  var token = 'foobar';
  var File = proxyquire('../../lib/File', {
    request: {
      post: function (opt, cb) {
        setImmediate(cb, null, null, { token: token });
      },
      get: function (opt, cb) {
        t.equal(opt.url.split('?')[0], url, 'Proper url invoked');
        t.equal(opt.headers['x-token'], token, 'Token passed through');
        t.end();
      }
    }
  });

  var file = new File(mockBucket, mockFile, { bridge: bridge });
})

test('getFilePointers emits error', function(t) {
  var bridge = 'foobar'
  var error = new Error('e');
  var token = 'foobar';
  var File = proxyquire('../../lib/File', {
    request: {
      post: function (opt, cb) {
        setImmediate(cb, null, null, { token: token });
      },
      get: function (opt, cb) {
        setImmediate(cb, error);
      }
    }
  });

  var file = new File(mockBucket, mockFile, { bridge: bridge });
  file.on('error', function (e) {
    t.equal(e, error, 'Passed error through');
    t.end();
  })
})

test('resolveFileFromPointers defers to BridgeClient', function(t) {
  var File = proxyquire('../../lib/File', {
    request: {}
  });

  var pointers = 'foo';
  var opts = 'bar';
  var cb = 'cuz';

  File.prototype._resolveFileFromPointers.call({
    _bridgeClient: {
      resolveFileFromPointers: function(p, o, c) {
        t.equal(pointers, p, 'Pointers passed through');
        t.equal(opts, o, 'Opts passed through');
        t.equal(cb, c, 'cb passed through');
        t.end();
      }
    }
  }, pointers, opts, cb);


})

test('resolveFileFromPointers invoked on file creation', function(t) {
  var File = proxyquire('../../lib/File', {
    request: {
      post: function (opt, cb) {
        setImmediate(cb);
      },
      get: function (opt, cb) {
        setImmediate(cb);
      }
    }
  });

  var file = new File(mockBucket, mockFile);
  var muxer = 'foo';

  file._bridgeClient = {
      resolveFileFromPointers: function(p, o, c) {
        t.pass('Inoked!');
        setImmediate(function() {
          t.equal(file._muxer, muxer, 'Muxer assigned to file');
          t.end();
        })
        c(null, muxer);
      }
  }
})

test('resolveFileFromPointers emits error', function(t) {
  var File = proxyquire('../../lib/File', {
    request: {
      post: function (opt, cb) {
        setImmediate(cb);
      },
      get: function (opt, cb) {
        setImmediate(cb);
      }
    }
  });

  var file = new File(mockBucket, mockFile);
  var error = new Error('foo');
  file._bridgeClient = {
      resolveFileFromPointers: function(p, o, c) {
        c(error);
      }
  }
  file.on('error', function (e) {
    t.equal(e, error, 'Error passed through');
    t.end();
  })
})
