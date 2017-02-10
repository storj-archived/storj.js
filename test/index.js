'use strict';

const test = require('tape');
const Storj = require('../lib/index.js');
var Readable = require('stream').Readable;
var KeyPair = require('storj-lib/lib/crypto-tools/keypair');

test('Storj.js happy path integration', function(done) {
  let storj;

  const bucketName = `test-${Date.now()}-${(Math.random()+'').split('.')[1]}`;
  let bucketId;
  let fileId;
  const fileName = 'foobar.txt';
  const fileContent = new Buffer(
    'IM A LUMBERJACK AND IM OK, I SLEEP ALL NIGHT AND I WORK ALL DAY'
  );

  test('Constructor with username and password', function(t) {
    storj = new Storj({
      bridge: process.env.STORJ_BRIDGE,
      basicAuth: {
        email: process.env.STORJ_USERNAME,
        password: process.env.STORJ_PASSWORD,
      }
    });
    t.equal(storj.constructor, Storj, 'Returned instance of Storj');

    storj.on('error', t.fail);
    storj.on('error', done.fail);

    storj.on('ready', function() {
      t.pass('ready emitted');
      storj.removeAllListeners();
      t.end();
    });
  });

  test('getKeyPair', function(t) {
    storj.getKeyPair();
    t.ok(storj._key instanceof KeyPair, 'object', 'Generated KeyPair');
    t.end();
  });

  test('createBucket', function(t) {
    storj.createBucket(bucketName, function(e, resp) {
      t.error(e, 'createBucket returns success');
      t.ok(resp.id, 'Gets bucket id back');
      bucketId = resp.id;
      t.end();
    });
  });

  test('getBuckets', function(t) {
    storj.getBuckets(function(e, buckets) {
      t.error(e, 'Should successfully grab buckets');
      for(var i = 0; i < buckets.length; i++) {
        if(buckets[i].name === bucketName) {
          t.pass('Newly created bucket listed');
          bucketId = buckets[i].id;
          return t.end();
        }
      }
      t.fail('Did not find newly created bucket');
      t.end();
    });
  });

  test('getBucket', function(t) {
    storj.getBucket(bucketId, function (e, bucket) {
      t.equal(bucket.user, process.env.STORJ_USERNAME, 'Returns metadata');
      t.end();
    });
  });

  test('createFile', function(t) {
    var rs = new Readable();
    rs._read = function() {};
    rs.push(fileContent);
    rs.push(null);
    var file = storj.createFile(bucketId, fileName, rs);
    file.emit = function (event, file) {
      t.equal(event, 'done', 'Expect createFile to emit done');
      t.equal(file.size, fileContent.length,
        'Expect size to be length of fileContent');
      fileId = file.id;
      t.end();
    }
  });

  test('listFiles', function(t) {
    storj.getBucket(bucketId, function(e, bucket) {
      t.error(e, 'Fetch bucket successfully');
      for(var i = 0; i < bucket.files.length; i++) {
        if(bucket.files[i].filename === fileName) {
          t.pass('Found file in bucket');
          return t.end();
        }
      }
      t.fail('Did not find file in bucket');
      return t.end();
    });
  });

  test('getFile', function(t) {
    t.plan(3);
    var file = storj.getFile(bucketId, fileId, function(e, file) {
      t.error(e, 'callback triggered');
    });
    file.on('ready', function () {
      t.pass('ready event triggered');
    });
    file.on('done', function() {
      file.getBuffer(function(e, buffer) {
        t.equal(buffer.toString(), fileContent.toString(),
          'got file content back');
      });
    });
    file.on('error', function(e) {
      t.error(e);
    });
  });

  test('deleteBucket', function(t) {
    storj.deleteBucket(bucketId, function (e) {
      t.error(e, 'Successfully delete bucket');
      t.end();
    });
  });

  test('getBuckets', function(t) {
    storj.getBuckets(function(e, buckets) {
      t.error(e, 'Should successfully grab buckets');
      for(var i = 0; i < buckets.length; i++) {
        if(buckets[i].name === bucketName) {
          t.fail('Bucket still listed');
          bucketId = buckets[i].id;
          return t.end();
        }
      }
      t.pass('Did not find bucket');
      t.end();
    });
  });

  done.end();
});
