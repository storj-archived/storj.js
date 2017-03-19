/**
  * @module storj/upload
  * @license LGPL-3.0
  */

'use strict';

var EncryptStream = require('storj-lib/lib/crypto-tools/encrypt-stream.js');
var crypto = require('crypto');
var storjUtils = require('storj-lib/lib/utils');
var through = require('through');

var DeterministicKeyIv =
  require('storj-lib/lib/crypto-tools/deterministic-key-iv');

module.exports = function(bucketId, fileName, opts, cb) {
  var self = this;

  var uploadMeta = {};

  // Make opts optional
  if(cb === undefined && typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  uploadMeta.id = storjUtils.calculateFileId(bucketId, fileName);
  uploadMeta.fileName = fileName;
  uploadMeta.fileSize = 0;
  uploadMeta._storeKey = crypto.randomBytes(12).toString('hex');
  uploadMeta._storeStream = self._store.createWriteStream(uploadMeta._storeKey);

  var uploader = UploadStream(uploadMeta);

  self._client.createToken(bucketId, 'PUSH', function(err, token) {
    if(err) {
      uploader.emit('error', err);
      return;
    };

    uploadMeta._token = token;

    // If we are uploading to a public bucket, use it's encryption key
    if(token.encryptionKey !== '') {
      uploadMeta.key = DeterministicKeyIv.getDeterministicKey(
        token.encryptionKey,
        uploadMeta.id
        );
    } else if(!self._encryptionKey) {
      // Require an encryption key if we are working on a private bucket
      return uploader.emit(
        'error',
        new Error('Bucket requires an encryption key')
      );
    } else {
      var bucketKey = DeterministicKeyIv.getDeterministicKey(
        self._encryptionKey.toSeed(),
        Buffer.from(bucketId, 'hex')
      );

      uploadMeta.key = DeterministicKeyIv.getDeterministicKey(
        Buffer.from(bucketKey, 'hex'),
        Buffer.from(uploadMeta.id, 'hex')
      );
    }

    uploadMeta.secret = new DeterministicKeyIv(uploadMeta.key, uploadMeta.id);
    uploadMeta._cipher = new EncryptStream(uploadMeta.secret);

    uploader.pipe(uploadMeta._cipher).pipe(uploadMeta._storeStream);
    uploader.resume();

    uploadMeta._cipher.on('data', function(data){
      uploadMeta._storeStream.write(data);
    });

    uploadMeta._cipher.once('end', function(){
      uploader.emit('encrypted');
      uploadMeta._storeStream.end();
    });

    // Handle all stream errors
    uploadMeta._cipher.on('error', uploader.emit.bind(uploader, 'error'));
    uploadMeta._storeStream.on('error', uploader.emit.bind(uploader, 'error'));
  });

  uploadMeta._storeStream.once('finish', function() {
    uploader.emit('stored');
    var encryptedStream = self._store.createReadStream(uploadMeta._storeKey);
    var fileSize = uploadMeta.fileSize;
    var clientOpts = { fileSize, fileName }
    self._client.storeFileInBucket(
      bucketId,
      uploadMeta._token,
      encryptedStream,
      clientOpts, function(e, resp) {
        if(e) {
          return uploader.emit('error', e);
        }
        return uploader.emit('done', resp);
      });
  });
  return uploader.pause();
}

function UploadStream(uploadMeta) {
  return through(function write(data) {
    uploadMeta.fileSize += data.length;
    this.queue(data); //data *must* not be null
  },
  function end () { //optional
    this.queue(null);
  })
};
