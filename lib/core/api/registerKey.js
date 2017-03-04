/**
  * @module storj/get-keypair
  * @license LGPL-3.0
  */

'use strict';

var KeyPair = require('storj-lib/lib/crypto-tools/keypair.js');

module.exports = function registerKey(publicKey, cb) {
  this._client.addPublicKey(publicKey, cb)
}
