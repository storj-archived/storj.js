/**
  * @module storj/get-file
  * @license LGPL-3.0
  */

var KeyIV = require('storj-lib/lib/crypto-tools/deterministic-key-iv');
var DecryptStream = require('storj-lib/lib/crypto-tools/decrypt-stream');

'use strict';

module.exports = function(self) {
  // TODO: implement
  /**
    * Conveinence function for emitting an error. If there is a registered
    * listener on the File, then we will emit there, otherwise we will attempt to
    * emit on the client. If there is not a client, we throw the error. Client may
    * throw an unhandled error event exception if no listeners are registered.
    * @private
   */
  var _error = function (e, cb) {
    // if(this.listenerCount('error') > 0) {
    //   return this.emit('error', e);
    // }
    // if(self._client) {
    //   return self._client.emit('error', e);
    // }
    throw e;
  };

  function createFileToken(file, cb) {
    file._client.createToken(file._bucketId, 'PULL', function(e, body) {
      if(e) {
        return _error(e, cb);
      }

      return handleTokens(file, body, cb);
    });
  }

  function handleTokens(file, body, cb) {
    if(body.encryptionKey === '' && file._key === undefined) {
      return _error(
        new Error('You must supply a keypair for private buckets'),
        cb
      );
    }

    file._encryptionKey = file._key;
    if(body.encryptionKey !== undefined && body.encryptionKey !== '') {
      file._encryptionKey = body.encryptionKey;
    }

    file._token = body.token;
    file._id = body.id;
    file._mimetype = body.mimetype;

    getFilePointers(file, cb);
  }

  function getFilePointers(file, cb) {
    var opts = {
      token: file._token,
      bucket: file._bucketId,
      file: file._fileId
    };

    file._client.getFilePointers(opts, function(e, pointers) {
      if(e) {
        return _error(e);
      }

      resolveFileFromPointers(file, pointers, cb);
    });
  }

  function resolveFileFromPointers(file, pointers, cb) {
    file._client.resolveFileFromPointers(pointers, function(e, muxer) {
      if(e) {
        return _error(e);
      }

      file._muxer = muxer;
      file.emit('ready');
      saveFile(file);
      return cb(null, file);
    });
  }

  function saveFile(file) {
    var stream = file._store.createWriteStream(file._fileId);
    var key = KeyIV.getDeterministicKey(file._encryptionKey, file._fileId);
    var secret = new KeyIV(key, file._fileId);
    var decrypter = new DecryptStream(secret);
    file._muxer.pipe(decrypter).pipe(stream);
    file._muxer.on('error', file.emit.bind(file, 'error'));
    stream.on('error', file.emit.bind(file, 'error'));
    stream.on('data', file.emit.bind(file, 'data'));
    file._muxer.on('end', function () {
      stream.end();
      delete file._muxer;
      file.emit('done');
    });
  };

  /*
   * Get a file stream by bucketId and fileId
   * @param bucketId
   * @param fileId
  */
  return function(bucketId, fileId, cb){
    var file = new self.File(self);
    file._bucketId = bucketId;
    file._fileId = fileId;
    file._key = self._key.getPrivateKey();

    // Start waterfall of above functions
    createFileToken(file, cb);

    // First grab the the token for downloading the file
    return file;
  }
}


