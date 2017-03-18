/**
  * @module storj/upload
  * @license LGPL-3.0
  */

'use strict';

var EncryptStream = require('storj-lib/lib/crypto-tools/encrypt-stream.js');
var crypto = require('crypto');
var stream = require('readable-stream');
var storjUtils = require('storj-lib/lib/utils');
var inherits = require('util').inherits;
var DeterministicKeyIv =
  require('storj-lib/lib/crypto-tools/deterministic-key-iv');

var uploadMeta = {};

module.exports = function(bucketId, fileName, opts, cb) {
  var self = this;

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

  var uploader = new UploadStream();

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

    uploadMeta._cipher.on('data', function(data){
      uploadMeta._storeStream.write(data);
    });

    uploadMeta._cipher.on('end', function(){
      uploader.emit('encrypted');
      uploadMeta._storeStream.end();
    });

    // Handle all stream errors
    uploadMeta._cipher.on('error', uploader.emit.bind(uploader, 'error'));
    uploadMeta._storeStream.on('error', uploader.emit.bind(uploader, 'error'));

    return cb(null, uploader);
  });

  uploadMeta._storeStream.on('finish', function() {
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
}

function UploadStream() {
  if (!(this instanceof UploadStream)) {
    return new UploadStream();
  }

  stream.Transform.call(this);
}

inherits(UploadStream, stream.Transform);

/**
 * Writes to the internal cipher
 * @private
 */
UploadStream.prototype._transform = function(chunk, enc, callback) {
  uploadMeta.fileSize += chunk.length;

  uploadMeta._cipher.write(chunk);
  callback();
};

/**
 * Closes the cipher stream when there are no more chunks to be read from file
 * @private
 */
UploadStream.prototype._flush = function(callback) {
  uploadMeta._cipher.end();
  callback();
};
