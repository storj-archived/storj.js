/**
  * @module storj/get-keypair
  * @license LGPL-3.0
  */
'use strict';

var KeyPair = require('storj-lib/lib/crypto-tools/keypair');

module.exports = function generateKeyPair(privateKey) {
  var key = new KeyPair(privateKey);
  return key;
}
