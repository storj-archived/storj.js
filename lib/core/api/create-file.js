/**
  * @module storj/create-file
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
  /*
   * Create new file and add it to supplied bucketId
   * @param bucketId
   * @param fileName
   * @param stream
   * @param callback
  */
  return function(bucketId, fileName, stream, cb)  {
    var file = new self.File(self);
    file.createFile(bucketId, fileName, stream, cb)

    if(cb === undefined) { return file };

    return cb(file);
  }
}
