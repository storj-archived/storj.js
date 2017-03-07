'use strict'

module.exports = function getFileList(bucketId, cb) {
  this._client.listFilesInBucket(bucketId, cb)
}
