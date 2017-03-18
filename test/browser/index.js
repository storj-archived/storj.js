'use strict';

const test = require('tape');
const Storj = require('../../lib/index.js');
const stream = require('stream');

let storj;

const bucketName = `test-${Date.now()}-${(Math.random()+'').split('.')[1]}`;
let bucketId;
let fileId;
let key;
let encryptionKey;
let file;
const fileName = 'foobar.svg';
const fileContent = new Buffer(
  '<svg width=400 height=10>' +
    '<text x=0 y=10>' +
      'IM A LUMBERJACK AND IM OK, I SLEEP ALL NIGHT AND I WORK ALL DAY' +
    '</text>' +
  '</svg>'
);

/* Testing of functions used in setup/teardown happen in test/all/*.js */
test('Browser: BEGIN SETUP', function(t) {
  t.end()
})

test('Browser: Storj with basic auth', function(t) {
  storj = new Storj({
    bridge: process.env.STORJ_BRIDGE,
    basicAuth: {
      email: process.env.STORJ_USERNAME,
      password: process.env.STORJ_PASSWORD,
    }
  });
  storj.on('error', t.fail);
  storj.on('ready', function() {
    storj.removeAllListeners();
    t.end();
  });
});

test('Browser: registerKey', function(t) {
  key = storj.generateKeyPair()
  encryptionKey = storj.generateEncryptionKey();
  storj.registerKey(key.getPublicKey(), function(e) {
    t.error(e, 'Succesfully registered the key');
    t.end();
  });
});

test('Browser: Storj with key', function(t) {
  storj = new Storj({
    bridge: process.env.STORJ_BRIDGE,
    key: key.getPrivateKey(),
    encryptionKey: encryptionKey
  });

  storj.on('error', t.fail);
  storj.on('ready', function() {
    storj.removeAllListeners();
    t.end();
  });
});

test('Browser: createBucket', function(t) {
  storj.createBucket(bucketName, function(e, meta) {
    bucketId = meta.id;
    t.end();
  });
});

test('Browser: createFile', function(t) {
  const rs = new stream.Readable();
  rs._read = function() {};
  rs.push(fileContent);
  rs.push(null);
  file = storj.createFile(bucketId, fileName, rs);
  file.on('error', t.fail)
  file.on('done', function() {
    fileId = file.id
    t.end();
  });
});

test('Browser: getFile', function(t) {
  file = storj.getFile(bucketId, fileId);
  file.on('done', function() {
    t.end()
  })
});

test('Browser: END SETUP', function(t) {
  t.end();
})

test('Browser: BEGIN TEARDOWN', function(t) {
  t.end();
})

test('Browser: deleteFile', function(t) {
  storj.deleteFile(bucketId, fileId, t.end);
});

test('Browser: deleteBucket', function(t) {
  storj.deleteBucket(bucketId, function (e) {
    t.end(e);
  });
});

test('Browser: END TEARDOWN', function(t) {
  t.end()
})
