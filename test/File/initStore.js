'use strict';
var test = require('tape');
var proxyquire = require('proxyquire');
var stream = require('stream');

test('initStore loads data', function(t) {
  var keyIV = function () {}
  keyIV.getDeterministicKey = function () {}
  var File = proxyquire('../../lib/File.js', {
    'storj-lib/lib/crypto-tools/decrypt-stream.js': function () {
      return new stream.PassThrough();
    },
    'storj-lib/lib/crypto-tools/deterministic-key-iv.js': keyIV
  });
  var buffer = new Buffer('foobar');
  var fakeFile = {};
  fakeFile._muxer = new stream.Duplex();
  fakeFile._muxer._length = buffer.length;
  fakeFile._muxer.push(buffer);
  fakeFile._muxer.push(null);
  fakeFile._muxer.on('error', t.fail.bind('Error encountered on muxer'));

  fakeFile._chunkStore = require('memory-chunk-store');
  fakeFile.emit = function (v, e) {
    switch(v) {
      case 'error':
        t.fail('Encountered an error');
        t.error(e, 'Encountered error in stream');
        break;
      case 'done':
        t.pass('Finished priming the buffer');
        File.prototype.getBuffer.call(fakeFile, function (e, b) {
          t.error(e, 'Can get the buffer');
          t.deepEqual(b, buffer, 'Able to retreive original buffer');
          t.end();
        })
        break;
    }
  };
  File.prototype._initStore.call(fakeFile);
});

test('getBlobUrl', function(t) {
  var File = proxyquire('../../lib/File.js', {
    'stream-to-blob-url': function() {
      t.pass('invoked!');
      t.end();
    }
  });
  var buffer = new Buffer('foobar');
  var fakeFile = {};
  fakeFile._store = new require('memory-chunk-store')(buffer.length);
  fakeFile._store.put(0, buffer, function (e) {
    t.error(e, 'Inserted buffer');
    File.prototype.getBlobUrl.call(fakeFile, function(e, url) {
      console.log(url);
    });
  });
});

test('getBlob', function(t) {
  var File = proxyquire('../../lib/File.js', {
    'stream-to-blob': function() {
      t.pass('invoked!');
      t.end();
    }
  });
  var buffer = new Buffer('foobar');
  var fakeFile = {};
  fakeFile._store = new require('memory-chunk-store')(buffer.length);
  fakeFile._store.put(0, buffer, function (e) {
    t.error(e, 'Inserted buffer');
    File.prototype.getBlob.call(fakeFile, function() {});
  });
});
