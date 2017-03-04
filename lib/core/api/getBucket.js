'use strict';

module.exports = function getBucket(bucketId, cb) {
  var self = this
  self._client.getBucketById(bucketId, function(e, resp) {
    if(e) {
      return cb(e);
    }
    self._client.listFilesInBucket(bucketId, function(e, files) {
      if(e) {
        return cb(e);
      }
      resp.files = files
      return cb(null, resp);
    });
  });
}
