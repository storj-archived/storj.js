'use strict';

var test = require('tape');
var proxyquire = require('proxyquire');
var Client = require('../../lib/Client.js');

var mockBucket = 'ff1be7f1c1c81df4405bb278';
var mockFile = 'a6a85bb9a8d0fdef69814856';

test('Error falls through to client', function (t) {
  var File = proxyquire('../../lib/File', {
    request: {
      post: function () {}
    }
  });

  var c = new Client();
  var file = new File(mockBucket, mockFile, { client: c });
  var error = new Error('foobar');

  c.on('error', function (e) {
    t.equal(e, error, 'Error passed through to client');
    t.end();
  })

  file._error(error);
});

test('Error emits on File object', function(t) {
  var File = proxyquire('../../lib/File', {
    request: {
      post: function () {}
    }
  });

  var c = new Client();
  var file = new File(mockBucket, mockFile, { client: c });
  var error = new Error('foobar');

  file.on('error', function (e) {
    t.equal(e, error, 'Error emitted on file');
    t.end();
  })

  c.on('error', function(e) {
    t.fail('Error should not be passed through to client');
  });

  file._error(error);
})

test('File throws when fails to emit', function(t) {
  var File = proxyquire('../../lib/File', {
    request: {
      post: function () {}
    }
  });

  var c = new Client();
  var file = new File(mockBucket, mockFile);
  var error = new Error('foobar');

  t.throws(file._error.bind(file, error), error, 'Throws w/o client');
  t.end();
});
