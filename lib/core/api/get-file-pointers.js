/**
  * @module storj/get-file-pointers
  * @license LGPL-3.0
  */

'use strict';

module.exports = function(self) {
  // TODO: implement
  /**
    * Conveinence function for emitting an error. If there is a registered
    * listener on the File, then we will emit there, otherwise we will attempt to
    * emit on the client. If there is not a client, we throw the error. Client may
    * throw an unhandled error event exception if no listeners are registered.
    * @private
   */
  var _error = function (e) {
    // if(this.listenerCount('error') > 0) {
    //   return this.emit('error', e);
    // }
    // if(self._client) {
    //   return self._client.emit('error', e);
    // }
    throw e;
  };

  /**
    * Get a list of pointers to a file from the bridge
    * @param bucketId
    * @oaram fileId
  */
  return function(bucketId, fileId, cb){
    var opts = {
     baseURI: this._bridge,
     bucket: bucketId,
     file: fileId
    };
    self._client.getFilePointers(opts, function(err, res) {
      cb(err,res);
    });
  }
}
