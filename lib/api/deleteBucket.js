'use strict';

module.exports = function deleteBucket(bucketId, cb) {
  this._client.destroyBucketById(bucketId, cb);
}
