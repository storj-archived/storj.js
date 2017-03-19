'use strict';

module.exports = function getFilePointers(bucketId, fileId, cb) {
  var self = this;
  var result = {}

  self._client.getFileInfo(bucketId, fileId, function metadata(e, metadata) {
    if(e) {
      return cb(e);
    }
    result.metadata = metadata
    self._client.createToken(bucketId, 'PULL', function token(e, token) {
      if(e) {
        return cb(e);
      }
      result.token = token;
      var clientOpts = { bucket: bucketId, file: fileId, token: token.token };
      self._client.getFilePointers(clientOpts, function pointers(e, pointers){
        if(e) {
          return cb(e);
        }
        result.pointers = pointers;
        return cb(null, result);
      });
    });
  });
}
