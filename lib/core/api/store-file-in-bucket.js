/**
  * @module storj/init-store
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

  // TODO: This needs refactor for mem-blob-store
  /**
    * Once a file has a _muxer, this function will initialize the backend _store
    * with the data from the _muxer.
    * @private
   */
  return function(cb){
    console.log('store in bucket')
    var rs = this._store.createReadStream(this._meta.tmpName);
    var options = {
      fileName: this._meta.fileName,
      tmpName: this._meta.tmpName,
      fileSize: this._meta.fileSize
    }
    this._client.storeFileInBucket(this._meta.bucketId, this._meta.token, rs, options, function(err, file) {
      if (err) {
        cb(err);
      }
      cb(null,file);
    });
  }
}
