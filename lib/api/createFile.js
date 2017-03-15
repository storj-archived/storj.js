/**
  * @module storj/create-file
  * @license LGPL-3.0
  */

'use strict';
var stream = require('stream');
var stringToStream  = require('string-to-stream');
var blobToStream = require('blob-to-stream');
var DeterministicKeyIv =
  require('storj-lib/lib/crypto-tools/deterministic-key-iv');
var storjUtils = require('storj-lib/lib/utils');
var EncryptStream = require('storj-lib/lib/crypto-tools/encrypt-stream');
var crypto = require('crypto');

module.exports = function createFile(bucketId, fileName, file, opts, cb) {
  var self = this;

  // Make opts optional
  if(cb === null && typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  if(!cb) {
    cb = function(){};
  }

  var stream = fileToStream(file);
  // If we failed to convert file to a stream, we have nothing left to do
  if(stream instanceof Error) {
    return cb(stream);
  }

  // Create a file so we can communicate state outside of this function
  var f = new self.File();
  f.name = fileName;

  // If we are given a callback, register it on the file's done event
  if(cb) {
    f.on('done', cb);
  }

  f.id = storjUtils.calculateFileId(bucketId, fileName);
  f.progress = 0;

  setImmediate(f.emit.bind(f, 'ready'));

  self._client.createToken(bucketId, 'PUSH', function(e, token) {
    if(e) {
      return f.emit('error', e);
    }

    // If we are uploading to a public bucket, use it's encryption key
    if(token.encryptionKey !== '') {
      f.key = DeterministicKeyIv.getDeterministicKey(token.encryptionKey, f.id);
    } else if(!self._encryptionKey) {
      // Require an encryption key if we are working on a private bucket
      return f.emit('error', new Error('Bucket requires an encryption key'));
    } else {
      var bucketKey = DeterministicKeyIv.getDeterministicKey(
        self._encryptionKey.toSeed(),
        Buffer.from(bucketId, 'hex')
      );

      f.key = DeterministicKeyIv.getDeterministicKey(
        Buffer.from(bucketKey, 'hex'),
        Buffer.from(f.id, 'hex')
      );
    }

    f.secret = new DeterministicKeyIv(f.key, f.id);
    f._storeKey = crypto.randomBytes(12).toString('hex');

    // Encrypt the file
    var encrypter = new EncryptStream(f.secret);
    var storeStream = self._store.createWriteStream(f._storeKey);
    stream.pipe(encrypter).pipe(storeStream);

    // Handle all stream errors
    stream.on('error', f.emit.bind(f, 'error'));
    encrypter.on('error', f.emit.bind(f, 'error'));
    storeStream.on('error', f.emit.bind(f, 'error'));

    // Keep track of the size of the file
    var fileSize = 0;
    stream.on('data', function(data) {
      fileSize += data.length;
    });

    storeStream.on('finish', function() {
      f.size = fileSize;
      var encryptedStream = self._store.createReadStream(f._storeKey);
      var clientOpts = { fileSize, fileName }
      self._client.storeFileInBucket(
        bucketId, token, encryptedStream, clientOpts,
        function uploaded(e, resp) {
          if(e) {
            return f.emit('error', e);
          }

          // Currently we have no reliable way to tell how much data has been
          // sent over the wire, since the library consumes our stream without
          // necessarily transfering data. File.progress will be more
          // meaningful in the future.
          f.progress = 1;

          return f.emit('done', resp);
        }
      );
    });
  });

  return f;
}

// A helper function that converts our file argument to a readable stream if it
// isn't one already
function fileToStream(file) {
  // Is it already a readable stream?
  if(file instanceof stream.Readable) {
    return file;
  }

  // Is it a string?
  if(typeof file === 'string') {
    return stringToStream(file);
  }

  // Are we in the browser, and is this a blob?
  if(typeof Blob !== 'undefined' && file instanceof Blob) {
    return blobToStream(file);
  }

  // If it isn't any of the above, this is invalid
  return new Error('file must be a string, blob, or stream');
}
