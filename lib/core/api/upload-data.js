/**
  * @module storj/uploadData
  * @license LGPL-3.0
  */

'use strict';

var calculateFileId = require('storj-lib/lib/utils.js').calculateFileId;
var KeyIV = require('storj-lib/lib/crypto-tools/deterministic-key-iv.js');
var EncryptStream = require('storj-lib/lib/crypto-tools/encrypt-stream.js');
var crypto = require('crypto');
var store = require('memory-blob-store');
var util = require('util');
var crypto = require('crypto');
var KeyPair = require('storj-lib/lib/crypto-tools/keypair.js');

module.exports = function(self) {
  // TODO: implement
  /**
    * Conveinence function for emitting an error. If there is a registered
    * listener on the File, then we will emit there, otherwise we will attempt to
    * emit on the client. If there is not a client, we throw the error. Client may
    * throw an unhandled error event exception if no listeners are registered.
    * @private
   */
  var _error = function (e) {
    // if(this.listenerCount('error') > 0) {
    //   return this.emit('error', e);
    // }
    // if(self._client) {
    //   return self._client.emit('error', e);
    // }
    throw e;
  };
  /*
   * Create new file and add it to supplied bucketId
   * @param bucketId
   * @param fileName
   * @param stream
   * @param callback
  */
  return function(bucketId, fileName, stream, cb)  {
    // assume single file, file is a stream, public bucket, and basic http auth
    // bucket ID, operation, cb
    self._client.createToken(bucketId, 'PUSH', function(err, token) {
      if(err) {
        self.emit('error', err);
        return;
      };

      if(token.encryptionKey !== '') {
        //self._key = new KeyPair(token.encryptionKey);
        self._key = token.encryptionKey;
      } else {
        if(self._key === undefined) {
          self.emit('error', new Error('You must supply an encryption key to upload to private buckets.'));
          return;
        }
      };

      var fileId = calculateFileId(bucketId, fileName);
      var fileKey = KeyIV.getDeterministicKey(self._key.getPrivateKey(), fileId);
      var secret = KeyIV(fileKey, fileId);
      var encrypter = new EncryptStream(secret);
      var tmpName = crypto.randomBytes(6).toString('hex');
      var _meta = {
        secret: secret,
        encrypter: encrypter,
        token: token,
        fileName: fileName,
        fileSize: 0,
        tmpName: tmpName,
        bucketId: bucketId
      }
      var storeStream = self._store.createWriteStream(tmpName);
      stream.pipe(_meta.encrypter).pipe(storeStream);
      stream.on('error', self.emit.bind(this, 'error'));
      _meta.encrypter.on('data', function(data) {
        _meta.fileSize = data.length;
      })
      _meta.encrypter.on('end', function() {
        self.emit('encrypted')
        storeStream.end()
      });
      storeStream.on('finish', function() {
        var rs = self._store.createReadStream(_meta.tmpName);
        self._client.storeFileInBucket(_meta.bucketId, _meta.token, rs, _meta, function(err, res) {
          if(err) {
            if(cb) {
              return cb(err, null);
            }
            return err;
          }
          if(cb) {
            return cb(null, res);
          }
          return res;
        });
      });
    });
  }
}
