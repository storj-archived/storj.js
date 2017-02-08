'use strict';

const test = require('tape');
const Storj = require('../lib/index.js');
var KeyPair = require('storj-lib/lib/crypto-tools/keypair.js');
var Writable = require('stream').Writable;

test('Storj.js happy path integration', function(done) {
  let storj;

  const bucketName = `test-${Date.now()}-${(Math.random()+'').split('.')[1]}`;
  let bucketId;
  const fileName = 'foobar';
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
    storj.on('ready', function() {
      t.pass('ready emitted');
      t.equal(storj._key.constructor, KeyPair, 'Generated key');
      t.end();
    });
    storj.on('error', done.fail);
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
  done.end();
});
