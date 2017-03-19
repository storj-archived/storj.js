/**
  * @module storj/get-keypair
  * @license LGPL-3.0
  */

'use strict';

module.exports = function getKeyList(cb) {
  this._client.getPublicKeys(cb)
}
