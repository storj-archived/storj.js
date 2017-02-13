'use strict';

const test = require('tape');
const Storj = require('../lib/index.js');
var Readable = require('stream').Readable;
var KeyPair = require('storj-lib/lib/crypto-tools/keypair');

test.skip('Storj.js concurrent upload', function(done) {
  let storj;

  const bucketName = `test-${Date.now()}-${(Math.random()+'').split('.')[1]}`;
  let bucketId, fileId1, fileId2;
  const fileName1 = 'foobar.txt';
  const fileContent1 = new Buffer(
    'IM A LUMBERJACK AND IM OK, I SLEEP ALL NIGHT AND I WORK ALL DAY'
  );
  const fileName2 = 'foobar2.txt';
  const fileContent2 = new Buffer(
    'TRAVELING THROUGH HYPERSPACE AINT LIKE DUSTIN CROPS, FARM BOY'
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
      storj.getKeyPair();
      storj.createBucket(bucketName, function(e, resp) {
        t.error(e, 'createBucket returns success');
        t.ok(resp.id, 'Gets bucket id back');
        bucketId = resp.id;
        t.end();
      });
    });
  });

  test('createFile', function(t) {
    var rs1 = new Readable();
    rs1._read = function() {};
    rs1.push(fileContent1);
    rs1.push(null);
    var rs2 = new Readable();
    rs2._read = function() {};
    rs2.push(fileContent2);
    rs2.push(null);
    var file1 = storj.createFile(bucketId, fileName1, rs1);
    file1.emit = function (event, file) {
      t.equal(event, 'done', 'Expect createFile to emit done');
      t.equal(file.size, fileContent1.length,
        'Expect size to be length of fileContent');
      fileId1 = file.id;
      isDone();
    }
    var file2 = storj.createFile(bucketId, fileName2, rs2);
    file2.emit = function (event, file) {
      t.equal(event, 'done', 'Expect createFile to emit done');
      t.equal(file.size, fileContent.length,
        'Expect size to be length of fileContent');
      fileId2 = file.id;
      isDone();
    }
    var done = false;
    function isDone() {
      if(!done) {
        return done = true;
      }
      return t.end();
    }
  });

  test('listFiles', function(t) {
    var found = 0;
    storj.getBucket(bucketId, function(e, bucket) {
      t.error(e, 'Fetch bucket successfully');
      for(var i = 0; i < bucket.files.length; i++) {
        if(
          bucket.files[i].filename === fileName1 ||
          bucket.files[i].filename === fileName2) {
            found++;
        }
      }
      t.equal(found, 2, 'Expected to find both files');
      return t.end();
    });
  });

  test('getFiles', function(t) {
    t.plan(6);
    var file1 = storj.getFile(bucketId, fileId1, function(e, file) {
      t.error(e, 'callback triggered');
    });
    file1.on('ready', function () {
      t.pass('ready event triggered');
    });
    file1.on('done', function() {
      file1.getBuffer(function(e, buffer) {
        t.equal(buffer.toString(), fileContent1.toString(),
          'got file content back');
      });
    });
    file1.on('error', function(e) {
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
