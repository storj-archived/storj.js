/* eslint-disable max-statements */
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
  let key;
  let mnemonic;
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
    t.equal(storj.constructor, Storj, 'returned instance of Storj');

    storj.on('error', t.fail);
    storj.on('error', done.fail);

    storj.on('ready', function() {
      t.pass('ready emitted');
      // Make sure we don't use our t for other tests
      storj.removeAllListeners();
      t.end();
    });
  });

  test('generateKeyPair', function(t) {
    key = storj.generateKeyPair()
    t.ok(key instanceof KeyPair, 'object', 'generated KeyPair');
    t.end();
  });

  test('registerKey', function(t) {
    storj.registerKey(key.getPublicKey(), function(e) {
      t.error(e, 'Succesfully registered the key');
      t.end();
    });
  });

  test('generateMnemonic', function(t) {
    mnemonic = storj.generateMnemonic();
    t.ok(typeof mnemonic === 'string', 'generated mnemonic');
    t.end();
  });

  test('Constructor with key', function(t) {
    storj = new Storj({
      bridge: process.env.STORJ_BRIDGE,
      key: key.getPrivateKey(),
      mnemonic: mnemonic
    });

    t.equal(storj.constructor, Storj, 'returned instance of Storj');

    storj.on('error', t.fail);
    storj.on('error', done.fail);
    storj.on('ready', function() {
      t.pass('ready emitted');
      storj.removeAllListeners();
      t.end()
    });
  });

  test('createBucket', function(t) {
    storj.createBucket(bucketName, function(e, meta) {
      t.error(e, 'createBucket returns success');
      t.ok(meta.id, 'gets bucket id back');
      t.equal(meta.name, bucketName, 'gets bucket name back');
      bucketId = meta.id;
      t.end();
    });
  });

  test('getBucket', function(t) {
    storj.getBucket(bucketId, function (e, bucket) {
      t.equal(bucket.id, bucketId, 'bucket has correct id');
      t.equal(bucket.name, bucketName, 'bucket has correct name');
      t.equal(bucket.files.length, 0, 'bucket has no files');
      t.end();
    });
  });

  test('getBucketList', function(t) {
    storj.getBucketList(function(e, buckets) {
      t.error(e, 'should successfully grab buckets');
      for(var i = 0; i < buckets.length; i++) {
        if(buckets[i].name === bucketName) {
          t.pass('newly created bucket listed');
          t.equal(buckets[i].id, bucketId, 'bucket has correct id');
          return t.end();
        }
      }
      t.fail('did not find newly created bucket');
      t.end();
    });
  });

  test('createFile', function(t) {
    const rs = new Readable();
    rs._read = function() {};
    rs.push(fileContent);
    rs.push(null);
    const file = storj.createFile(bucketId, fileName, rs);
    t.equal(file.name, fileName, 'file.name attribute set');
    t.equal(file.progress, 0, 'file.progress attribute set');
    let emittedReady = false;
    file.on('ready', function cb() {
      emittedReady = true;
      t.equal(file.progress, 0, 'ready emitted before downloading anything');
    });
    file.on('error', t.fail)
    file.on('done', function() {
      t.ok(emittedReady, 'file emitted ready before done');
      t.equal(file.size, fileContent.length,
        'expect size to be length of fileContent');
      fileId = file.id;
      t.equal(file.progress, 1, 'file.progress shows complete');
      t.end();
    });
  });

  test('getFileList', function(t) {
    storj.getFileList(bucketId, function(e, files) {
      t.error(e, 'fetch file list successfully');
      for(var i = 0; i < files.length; i++) {
        if(files[i].filename === fileName) {
          t.equal('text/plain', files[i].mimetype, 'correct mimetype set')
          return t.end();
        }
      }
      t.fail('did not find file in bucket');
      return t.end();
    });
  });

  test('getFile', function(t) {
    let file;
    const handler = function() {
      t.equal(file.id, fileId, 'file.id populated');
      t.equal(file.progress, 1, 'file.progress shows complete');
      file.getBuffer(function (e, buffer) {
        t.error(e, 'retreived file contents');
        t.equal(buffer.toString(), fileContent.toString(), 'content correct');
        const rs = file.createReadStream();
        let content = '';
        rs.on('data', function(d) { content += d.toString() });
        rs.on('error', t.fail);
        rs.on('end', function() {
          t.equal(content, fileContent.toString(), 'stream correct');
          t.end();
        });
      });
    }
    file = storj.getFile(bucketId, fileId, handler);
    file.on('error', t.fail);
    t.equal(file.listeners('done').reduce((p, c) => p || c === handler, false),
      true, 'cb is registered to done');
    t.equal(file.progress, 0, 'file.progress set');
  });

  test('deleteFile', function(t) {
    storj.deleteFile(bucketId, fileId, function (e) {
      t.error(e, 'removed file');
    });
  });

  test('getFileList', function(t) {
    storj.getFileList(bucketId, function(e, files) {
      t.error(e, 'fetch file list successfully');
      for(var i = 0; i < files.length; i++) {
        if(files[i].filename === fileName) {
          t.fail('file remained after delete');
        }
      }
      t.pass('file removed');
      return t.end();
    });
  });

  test('deleteBucket', function(t) {
    storj.deleteBucket(bucketId, function (e) {
      t.error(e, 'successfully delete bucket');
      t.end();
    });
  });

  test('getBucketList', function(t) {
    storj.getBucketList(function(e, buckets) {
      t.error(e, 'should successfully grab buckets');
      for(var i = 0; i < buckets.length; i++) {
        if(buckets[i].name === bucketName) {
          t.fail('bucket still listed');
          bucketId = buckets[i].id;
          return t.end();
        }
      }
      t.pass('bucket removed after delete');
      t.end();
    });
  });

  done.end();
});
