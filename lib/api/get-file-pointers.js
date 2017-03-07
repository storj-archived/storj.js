/**
  * @module storj/get-file-pointers
  * @license LGPL-3.0
  */

'use strict';

 /**
  * Get a list of pointers to a file from the bridge
  * @param bucketId
  * @oaram fileId
  * @param token
*/

module.exports = function(cb) {
  var self = this;
  var opts = {
    token: self._token,
    baseURI: self._bridge,
    bucket: self._bucketId,
    file: self._file
  };
  self._client.getFilePointers(opts, function(err, res) {
    cb(err,res);
  });
}
