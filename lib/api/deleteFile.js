'use strict';

module.exports = function deleteFile(bucketId, fileId, cb) {
  this._client.removeFileFromBucket(bucketId, fileId, cb);
}
