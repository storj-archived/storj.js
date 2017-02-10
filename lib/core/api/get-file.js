/**
  * @module storj/get-file
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
   * Get a file stream by bucketId and fileId
   * @param bucketId
   * @param fileId
  */
  return function(bucketId, fileId, cb){
    // First grab the the token for downloading the file
    self.createFileToken(bucketId, function(e, body) {
      if(body.encryptionKey === '' && self._key === undefined) {
        if(cb) {
          return cb(new Error('You must supply a decryption key for private buckets.'), null);
        };
        throw new Error('You must supply a decryption key for private buckets.');
      };

      if(body.encryptionKey !== '') {
        self._encryptionKey = body.encryptionKey;
      };

      self._file = fileId;
      self._bucketId = bucketId;
      if(e) { return _error(e); }
      self._token = body.token;
      self._id = body.id;
      self._mimetype = body.mimetype;
      // If successful, try to resolve the file pointers
      self.getFilePointers(function(e, pointers) {
        if(e) { return _error(e); }
        // We now have a reference to every piece of our file, let's assemble it!
        self.resolveFileFromPointers(pointers, {}, function (e, muxer) {
          if(e) { return _error(e); }
          self._muxer = muxer;
          self.emit('ready');
          self.initStore(cb);
        });
      });
    });



  }
}
