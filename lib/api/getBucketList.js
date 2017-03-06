'use strict'

module.exports = function getBucketList(cb) {
  this._client.getBuckets(cb);
}
