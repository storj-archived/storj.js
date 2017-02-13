/**
  * @module storj/get-keypair
  * @license LGPL-3.0
  */

'use strict';

var KeyPair = require('storj-lib/lib/crypto-tools/keypair.js');

module.exports = function(self) {
  /*
   * Save a public key on the client bridge
   * @param key {Object} Public/Private keypair
   * @param callback
  */
  return function(key, cb)  {
    var key = new KeyPair(key);
    self._keypair = key;
    self._pubKey = key.getPublicKey();
    self._encryptionKey = key.getPrivateKey();
    self._client.addPublicKey(key.getPublicKey(), function(e) {
      if(cb && e) {
        return cb(e);
      }

      if(e && self._client) {
        return self._client.emit(e);
      }

      if(e) {
        throw e;
      }

      return cb && cb(null, key) ;
    });
  }
}
