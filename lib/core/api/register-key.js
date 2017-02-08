/**
  * @module storj/get-keypair
  * @license LGPL-3.0
  */

'use strict';

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
   * Save a public key on the client bridge
   * @param key {Object} Public/Private keypair
   * @param callback
  */
  return function(key, cb)  {
    self._client.addPublicKey(key.getPublicKey(), function(e) {
      if(e) {
        return self.emit('error', e);
      }
      self._key = key;
      if(cb === undefined) { return key };

      return cb(key);
    });
  }
}
