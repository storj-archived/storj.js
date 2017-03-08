'use strict';

module.exports = function createBucket(bucketName, cb) {
  if(!this._key) {
    return cb(new Error('creating a bucket requires key authentication'));
  }

  this._client.createBucket({
    pubkeys: [
      this._key.getPublicKey()
    ],
    name: bucketName
  }, function(e, meta) {
    if(e) {
      return cb(e);
    }
    return cb(null, meta);
  });
}
