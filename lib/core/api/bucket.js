'use strict';

module.exports = function bucket (self) {
  var _internal = function(cb) {

  }

  return {
    createBucket: function(name, opts, cb) {
      if(typeof opts === 'function') {
        cb = opts;
        opts = null;
      }
      self._client.createBucket({
        pubkeys: [
          self._key.getPublicKey()
        ],
        name
      }, function(e, meta) {
        if(e) {
          return cb(e);
        }
        return cb(null, {
          id: meta.id
        });
      });
    },
    getBucket: function(id, cb) {
      self._client.getBucketById(id, function(e, resp) {
        if(e) {
          return cb(e);
        }
        self._client.listFilesInBucket(id, function(e, files) {
          if(e) {
            return cb(e);
          }

          resp.files = files
          return cb(null, resp);
        });
      });
    },
    getBuckets: function(cb) {
      self._client.getBuckets(function(e, resp) {
        if(e) {
          return cb(e);
        }

        return cb(null, resp.map((v) => ({ id: v.id, name: v.name}) ));
      });
    },
    deleteBucket: function(id, cb) {

    },
    /**
      * makes a specific storage bucket public, uploading bucket key to bridge
      * @param
    */
    makePublic: function(){

    }
  }

}
