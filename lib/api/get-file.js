/**
  * @module storj/get-file
  * @license LGPL-3.0
  */

'use strict';

/*
 * Create new file and add it to supplied bucketId
 * @param bucketId
 * @param fileName
 * @param stream
 * @param callback
*/
module.exports = function(bucketId, fileId, cb) {
  var file = new self.File(self);
  file.getFile(bucketId, fileId)

  if(cb === undefined) { return file };

  return cb(file);
}