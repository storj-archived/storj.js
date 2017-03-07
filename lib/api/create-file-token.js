/**
  * @module storj/create-file-token
  * @license LGPL-3.0
  */

'use strict';

/**
  * Fetch a token for this File from the bridge.
  * @param bucketId
*/
module.exports = function(bucketId, cb) {
  this._client.createToken(bucketId, 'PUSH', function(err, token) {
    cb(err, token);
  });
}
