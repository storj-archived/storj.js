'use strict';

module.exports = function updateBucketById(bucketId, updates, cb) {
  var self = this
  self._client.updateBucketById(bucketId, updates, function(e, resp) {
    if(e) {
      return cb(e);
    }
    return cb(null, resp);
  });
}
