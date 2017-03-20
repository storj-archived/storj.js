/**
  * @module storj/get-keypair
  * @license LGPL-3.0
  */

'use strict';

module.exports = function removeKey(publicKey, cb) {
  this._client.destroyPublicKey(publicKey, cb)
}
