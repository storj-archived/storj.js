/**
  * @module storj/file
  * @license LGPL-3.0
  */

'use strict';

var assert = require('assert');
var calculateFileId = require('storj-lib/lib/utils.js').calculateFileId;
var KeyIV = require('storj-lib/lib/crypto-tools/deterministic-key-iv.js');
var EncryptStream = require('storj-lib/lib/crypto-tools/encrypt-stream.js');
var crypto = require('crypto');
var storjutils = require('storj-lib/lib/utils.js');
var sha256 = require('storj-lib/lib/utils').sha256;
var store = require('memory-blob-store');
var util = require('util');
var crypt = require('crypto');

module.exports = function file(self) {
  var _meta;
  /*
   * Once the file is done encrypting, call the core bridge_client
   * with the readable stream generated from the file encryption
   * @private
  */
  var _storeFileInBucket = function(cb) {
    var rs = self._store.createReadStream(_meta.tmpName);
    var options = {
      fileName: _meta.fileName,
      tmpName: _meta.tmpName,
      fileSize: _meta.fileSize
    }
    self._client.storeFileInBucket(_meta.bucketId, _meta.token, rs, options, function(err, file) {
      if (err) {
        cb(err);
      }
      cb(null,file);
    });
  };
  
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
    if(stream.readable) {
      var fstream = stream;
    }
    // assume single file, file is a stream, public bucket, and basic http auth
    // bucket ID, operation, cb
    self._client.createToken(bucketId, 'PUSH', function(err, token) {
      if (err) {
        return err;
      };  
      var fileId = calculateFileId(bucketId, fileName);
      var fileKey = KeyIV.getDeterministicKey(token.encryptionKey, fileId);
      var secret = KeyIV(fileKey, fileId);
      var encrypter = new EncryptStream(secret);
      var tmpName = crypto.randomBytes(6).toString('hex');
      _meta = {
        secret: secret,
        encrypter: encrypter,
        token: token,
        fileName: fileName,
        fileSize: 0,
        tmpName: tmpName,
        bucketId: bucketId
      }
      var storeStream = self._store.createWriteStream(tmpName);
      fstream.pipe(_meta.encrypter).pipe(storeStream);
      fstream.on('error', self.emit.bind(this, 'error'));
      _meta.encrypter.on('data', function(data) {
        _meta.fileSize = data.length;
      })
      _meta.encrypter.on('end', function() {
        storeStream.end()
      });
      storeStream.on('finish', function() {
        _storeFileInBucket(function(err, res) {
          if(err) {
            self.emit.bind(this, err)
            cb(err, null)
          }
          cb(null, res)
        });
      });
    });
  }
}
