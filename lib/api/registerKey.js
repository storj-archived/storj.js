/**
  * @module storj/get-keypair
  * @license LGPL-3.0
  */

'use strict';

module.exports = function registerKey(publicKey, cb) {
  this._client.addPublicKey(publicKey, cb)
}
