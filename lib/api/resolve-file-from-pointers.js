/**
  * @module storj/resolve-file-from-pointers
  * @license LGPL-3.0
  */

'use strict';

/**
  * Given a list of pointers, this function will reconstruct the file
  * @private
*/
module.exports = function(pointers, opts, cb) {
  this._client.resolveFileFromPointers(pointers, opts, cb);
}
