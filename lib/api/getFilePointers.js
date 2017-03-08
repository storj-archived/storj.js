'use strict';

module.exports = function getFilePointers(bucketId, fileId, cb) {
  var self = this;
  var result = {}

  self._client.createToken(bucketId, 'PULL', function token(e, token) {
    if(e) {
      return cb(e);
    }
    result.token = token;
    var clientOpts = { bucket: bucketId, file: fileId, token: token.token };
    self._client.getFilePointers(clientOpts, function pointers(e, pointers){
      result.pointers = pointers;
      return cb(null, result);
    })
  });
}
