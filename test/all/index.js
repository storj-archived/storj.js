/* eslint-disable max-statements */
'use strict';

const test = require('tape');
const Storj = require('../../lib/index.js');
var Readable = require('stream').Readable;
var KeyPair = require('storj-lib/lib/crypto-tools/keypair');

let basicStorj;
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
  basicStorj = new Storj({
    bridge: process.env.STORJ_BRIDGE,
    basicAuth: {
      email: process.env.STORJ_USERNAME,
      password: process.env.STORJ_PASSWORD,
    }
  });
  t.equal(basicStorj.constructor, Storj, 'returned instance of Storj');

  basicStorj.on('error', t.fail);

  basicStorj.on('ready', function() {
    t.pass('ready emitted');
    // Make sure we don't use our t for other tests
    basicStorj.removeAllListeners();
    t.end();
  });
});

test('generateKeyPair', function(t) {
  key = basicStorj.generateKeyPair()
  t.ok(key instanceof KeyPair, 'object', 'generated KeyPair');
  t.end();
});

test('registerKey', function(t) {
  basicStorj.registerKey(key.getPublicKey(), function(e) {
    t.error(e, 'Succesfully registered the key');
    t.end();
  });
});

test('getKeyList', function(t) {
  basicStorj.getKeyList(function(e, keys) {
    for(var i = 0; i < keys.length; i++) {
      if(keys[i].key === key.getPublicKey()) {
        t.pass('found registered key');
        return t.end();
      }
    }
    t.fail('did not find registered key');
    t.end();
  });
});


test('generateMnemonic', function(t) {
  mnemonic = basicStorj.generateEncryptionKey();
  t.ok(typeof mnemonic === 'string', 'generated mnemonic');
  t.end();
});

test('Storj.generateEncryptionKey', function(t) {
  mnemonic = Storj.generateEncryptionKey();
  t.ok(typeof mnemonic === 'string', 'generated mnemonic');
  t.end();
});

test('Constructor with key', function(t) {
  storj = new Storj({
    bridge: process.env.STORJ_BRIDGE,
    key: key.getPrivateKey(),
    encryptionKey: mnemonic
  });

  t.equal(storj.constructor, Storj, 'returned instance of Storj');

  storj.on('error', t.fail);
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
    t.error(e, 'getBucket returns success');
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
    // Make sure resetting the file.name attribute doesn't corrupt it. Since
    // we created a fresh bucket, the name the bridge uses should still match
    // the original file name.
    t.equal(file.name, fileName, 'file.name attribute reset');
    t.ok(file.id, 'file.id populated');
    t.ok(emittedReady, 'file emitted ready before done');
    t.equal(file.length, fileContent.length,
      'expect length to be length of fileContent');
    t.equal(file.mimetype, 'text/plain', 'expect .txt mimetype');
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
    t.equal(file.name, fileName, 'file name populated');
    t.equal(file.mimetype, 'text/plain', 'mimetype for .txt set');
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

test('makePublic', function(t) {
  storj.makePublic(bucketId, ['PUSH', 'PULL'], function(e) {
    t.error(e, 'make public successful');
    t.end();
  })
});

test('getFile:public', function(t) {
  var s = new Storj({bridge: process.env.STORJ_BRIDGE});
  s.on('ready', function() {
    var file = s.getFile(bucketId, fileId, function() {
      file.getBuffer(function(e, buffer) {
        t.error(e, 'getFile public successful');
        t.equal(buffer.toString(), fileContent.toString(), 'content correct');
        t.end();
      })
    });

    file.on('error', t.fail);
  });
});

test('deleteFile', function(t) {
  storj.deleteFile(bucketId, fileId, function (e) {
    t.error(e, 'removed file');
    t.end();
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

test('upload', function(t) {
  var encrypted =false;
  var stored = false;
  const rs = new Readable();
  rs._read = function() {};
  rs.push(fileContent);
  rs.push(null);
  const uploadStream = storj.upload(bucketId, `stream-${fileName}`);
  rs.pipe(uploadStream);
  t.equal(uploadStream.readable, true, 'returned stream is readable');
  t.equal(uploadStream.writable, true, 'returned stream is writable');
  uploadStream.on('encrypted', function cb() {
    encrypted = true;
  });
  uploadStream.on('stored', function cb() {
    stored = true;
  });
  uploadStream.on('error', t.fail)
  uploadStream.on('done', function(metadata) {
    t.equal(stored, true, 'store finished getting encrypted file');
    t.equal(encrypted, true, 'stream finished encrypting the file');
    fileId = metadata.id;
    t.end();
  });
});

test('download', function(t) {
  var rs = storj.download(bucketId, fileId);
  var content = ''
  rs.on('data', function(d) {
    content += d.toString();
  });
  rs.on('end', function () {
    t.equal(content, fileContent.toString(), 'stream correct');
    t.end();
  });
});

test('deleteFile', function(t) {
  storj.deleteFile(bucketId, fileId, function (e) {
    t.error(e, 'removed file');
    t.end();
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

test('removeKey', function(t) {
  storj.removeKey(key.getPublicKey(), function(e) {
    t.error(e, 'Succesfully removed key');
    t.end();
  });
});

test('getKeyList', function(t) {
  basicStorj.getKeyList(function(e, keys) {
    for(var i = 0; i < keys.length; i++) {
      if(keys[i].key === key.getPublicKey()) {
        t.fail('found registered key');
        return t.end();
      }
    }
    t.pass('did not find registered key');
    t.end();
  });
});
