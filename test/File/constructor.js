'use strict';

var test = require('tape');
var proxyquire = require('proxyquire').noCallThru();

var mockBucket = 'ff1be7f1c1c81df4405bb278';
var mockFile = 'a6a85bb9a8d0fdef69814856';

test('Constructor creates File', function (t) {
  var File = proxyquire('../../lib/File', {
    request: {
      post: function () {}
    }
  });
  var file = new File(mockBucket, mockFile);
  t.ok(file instanceof File, 'Should be a File');
  t.ok(file instanceof require('events').EventEmitter,
    'Should be an EventEmitter');
  t.end();
});

test('File accepts opts object', function (t) {
  var File = proxyquire('../../lib/File', {
    request: {
      post: function () {}
    }
  });
  // We do a test w/o a constructor here to verify that opts get passed through
  t.comment('Also testing that constructor works w/o new');
  var file = File(mockBucket, mockFile, {});
  t.ok(file instanceof File, 'Should be a File');
  t.equal(file._bridge, File.Defaults.bridge, 'Uses default bridge');
  t.equal(file._protocol, File.Defaults.protocol, 'Uses default protocol');
  file = File(mockBucket, mockFile, { bridge: 'foo', protocol: 'bar' });
  t.equal(file._bridge, 'foo', 'Uses provided bridge');
  t.equal(file._protocol, 'bar', 'Uses provided protocol');
  t.end();
});

test('File constructor scrubs opts input', function (t) {
  var File = proxyquire('../../lib/File', {
    request: {
      post: function () {}
    }
  });
  t.throws(File.bind(null, mockBucket, mockFile, 'foo'),
    'Rejects non-object opts');
  t.throws(File.bind(null, mockBucket, mockFile, { bridge: 5 }),
    'Rejects non-string bridge');
  t.throws(File.bind(null, mockBucket, mockFile, { protocol: 5 }),
    'Rejects non-string protocol');
  t.throws(File.bind(null, mockBucket, mockFile, { client: 5 }),
    'Rejects non-object client');
  t.end();
});

test('File constructor scrubs bucket and file input', function(t) {
  var File = proxyquire('../../lib/File', {
    request: {
      post: function () {}
    }
  });
  t.throws(File.bind(null, 'foo', mockFile), 'Bucket rejects invalid form');
  t.throws(File.bind(null, 5, mockFile), 'Bucket rejects invalid type');
  t.throws(File.bind(null, mockBucket, 'foo'), 'File rejects invalid form');
  t.throws(File.bind(null, mockBucket, 5), 'File rejects invalid type');
  t.end();
});
