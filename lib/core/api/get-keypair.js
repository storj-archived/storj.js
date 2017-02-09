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
   * Create new keypair
   * @param key (String) The private key to genereate the keypair
   * @param callback
  */
  return function(key, cb)  {
    // if no private key is supplied, a random one will be generated.
    var key = new KeyPair(key);
    self._key = key;
    self._pubKey = key.getPublicKey();
    self._encryptionKey = key.getPrivateKey();
    if(cb === undefined) { return key };

    return cb(key);

  }
}
