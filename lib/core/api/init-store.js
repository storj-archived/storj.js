/**
  * @module storj/init-store
  * @license LGPL-3.0
  */

'use strict';

var assert = require('assert');
var calculateFileId = require('storj-lib/lib/utils.js').calculateFileId;
var KeyIV = require('storj-lib/lib/crypto-tools/deterministic-key-iv.js');
var DecryptStream = require('storj-lib/lib/crypto-tools/decrypt-stream.js');
//var Client = require('storj-lib/lib/bridge-client');
var crypto = require('crypto');
var storjutils = require('storj-lib/lib/utils.js');
var sha256 = require('storj-lib/lib/utils').sha256;
var store = require('memory-blob-store');
var util = require('util');
var crypt = require('crypto');



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

  // TODO: This needs refactor for mem-blob-store
  /**
    * Once a file has a _muxer, this function will initialize the backend _store
    * with the data from the _muxer.
    * @private
   */
  return function(cb){
    var stream = self._store.createWriteStream(self._file);
    var key = KeyIV.getDeterministicKey(self._encryptionKey, self._file);
    var secret = new KeyIV(key, self._file);
    var decrypter = new DecryptStream(secret);
    self._muxer.pipe(decrypter).pipe(stream);
    self._muxer.on('error', self.emit.bind(self, 'error'));
    stream.on('error', self.emit.bind(self, 'error'));
    self._muxer.on('end', function () {
      stream.end();
      delete self._muxer;
      self.emit('done');
      cb(null, self._store.createReadStream(self._file));
    });
  }
}
