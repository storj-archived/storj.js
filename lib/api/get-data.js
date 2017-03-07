/**
  * @module storj/get-data
  * @license LGPL-3.0
  */

'use strict';

var calculateFileId = require('storj-lib/lib/utils.js').calculateFileId;
var KeyIV = require('storj-lib/lib/crypto-tools/deterministic-key-iv.js');
var DecryptStream = require('storj-lib/lib/crypto-tools/decrypt-stream.js');

module.exports = function(bucketId, fileId, cb) {
  var self = this;
  var initDecryption = function(cb) {
    var key
    if(self._key) {
      key = KeyIV.getDeterministicKey(self._key.getPrivateKey(), self._file);
    } else {
      key = KeyIV.getDeterministicKey(self._encryptionKey, self._file);
    }
    var secret = new KeyIV(key, self._file);
    var decrypter = new DecryptStream(secret);
    self._muxer.pipe(decrypter);
    self._muxer.on('error', self.emit.bind(self, 'error'));
    if(cb){
      return cb(null, decrypter);
    }
    return decrypter;
  }

  self.createFileToken(bucketId, function(e, body) {
    console.log(body)
    if(body.encryptionKey === '' && self._key === undefined) {
      if(cb) {
        return cb(new Error('You must supply a decryption key for private buckets.'), null);
      };
      throw new Error('You must supply a decryption key for private buckets.');
    };

    if(body.encryptionKey !== '') {
      console.log(self)
      self._encryptionKey = body.encryptionKey;
    };

    self._file = fileId;
    self._bucketId = bucketId;
    if(e) { return _error(e); }
    self._token = body.token;
    self._id = body.id;
    self._mimetype = body.mimetype;
    // If successful, try to resolve the file pointers
    self.getFilePointers(function(e, pointers) {
      if(e) { return _error(e); }
      // We now have a reference to every piece of our file, let's assemble it!
      self.resolveFileFromPointers(pointers, {}, function (e, muxer) {
        if(e) { return _error(e); }
        self._muxer = muxer;
        self.emit('ready');
        initDecryption(cb);
      });
    });
  });
}
