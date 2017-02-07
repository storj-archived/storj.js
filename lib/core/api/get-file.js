/**
  * @module storj/file
  * @license LGPL-3.0
  */

'use strict';

var assert = require('assert');
var calculateFileId = require('storj-lib/lib/utils.js').calculateFileId;
var KeyIV = require('storj-lib/lib/crypto-tools/deterministic-key-iv.js');
var EncryptStream = require('storj-lib/lib/crypto-tools/encrypt-stream.js');
//var Client = require('storj-lib/lib/bridge-client');
var crypto = require('crypto');
var storjutils = require('storj-lib/lib/utils.js');
var sha256 = require('storj-lib/lib/utils').sha256;
var store = require('memory-blob-store');
var util = require('util');
var crypt = require('crypto');



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
      if(e) { return _error(e); }
      self._token = body.token;
      self._key = body.encryptionKey;
      self._id = body.id;
      self._mimetype = body.mimetype;
      // If successful, try to resolve the file pointers
      self.getFilePointers(bucketId, fileId, function(e, pointers) {
        if(e) { return _error(e); }
        // We now have a reference to every piece of our file, let's assemble it!
        self.resolveFileFromPointers(pointers, {}, function (e, muxer) {
          if(e) { return _error(e); }
          self._muxer = muxer;
          self.emit('ready');
          _initStore(cb);
        });
      });
    });



  }
}