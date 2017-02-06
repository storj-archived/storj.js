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
// stream-to-blob and stream-to-blob-url let us represent a shard as a blob in
// the web browser
var streamToBlob = require('stream-to-blob');
var streamToBlobUrl = require('stream-to-blob-url');

// render-media allows us to take a shard and write it directly to the page!
var render = require('render-media');

// We use from2 to give us a readableStream of our buffer for render-media
var from = require('from2');



module.exports = function file(self) {
  var _meta;
  /*
   * Once the file is done encrypting, call the core bridge_client
   * with the readable stream generated from the file encryption
   * @private
  */
  var _storeFileInBucket = function(cb) {
    var rs = self._store.createReadStream(_meta.tmpName);
    var options = {
      fileName: _meta.fileName,
      tmpName: _meta.tmpName,
      fileSize: _meta.fileSize
    }
    self._client.storeFileInBucket(_meta.bucketId, _meta.token, rs, options, function(err, file) {
      if (err) {
        cb(err);
      }
      cb(null,file);
    });
  };

  // TODO: This needs refactor for mem-blob-store
  /**
    * Once a file has a _muxer, this function will initialize the backend _store
    * with the data from the _muxer.
    * @private
   */
  var _initStore = function(cb) {
    var stream = self._store.createWriteStream('tmpName');
    var key = KeyIV.getDeterministicKey(self._key, self._file);
    var secret = new KeyIV(key, self._file);
    var decrypter = new DecryptStream(secret);
    self._muxer.pipe(decrypter).pipe(stream);
    self._muxer.on('error', self.emit.bind(self, 'error'));
    stream.on('error', self.emit.bind(self, 'error'));
    self._muxer.on('end', function () {
      delete self._muxer;
      self.emit('done');
      cb(null, stream)
    });
  };

  /**
    * Given a list of pointers, this function will reconstruct the file
    * @private
  */
  var _resolveFileFromPointers = function(pointers, opts, cb) {
    self._client.resolveFileFromPointers(pointers, opts, cb);
  };
  
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
   * Given a mime-type, return the corresponding extension.
   * @private
   * TODO: PR for render-media allowing us to directly specify the mime-type
   */
  var _getExtension = function() {
    var keys = Object.keys(render.mime);
    //var index = keys.map((v) => render.mime[v]).indexOf(self._mimetype);
    // if(index < 0) {
    //   return '.unknown';
    // }
    return keys[index];
  };

  return {
    /*
     * Create new file and add it to supplied bucketId
     * @param bucketId
     * @param fileName
     * @param stream
     * @param callback
    */
    createFile: function(bucketId, fileName, stream, cb) {
      if(stream.readable) {
        var fstream = stream;
      }
      // assume single file, file is a stream, public bucket, and basic http auth
      // bucket ID, operation, cb
      self._client.createToken(bucketId, 'PUSH', function(err, token) {
        if (err) {
          return err;
        };  
        var fileId = calculateFileId(bucketId, fileName);
        var fileKey = KeyIV.getDeterministicKey(token.encryptionKey, fileId);
        var secret = KeyIV(fileKey, fileId);
        var encrypter = new EncryptStream(secret);
        var tmpName = crypto.randomBytes(6).toString('hex');
        _meta = {
          secret: secret,
          encrypter: encrypter,
          token: token,
          fileName: fileName,
          fileSize: 0,
          tmpName: tmpName,
          bucketId: bucketId
        }
        var storeStream = self._store.createWriteStream(tmpName);
        fstream.pipe(_meta.encrypter).pipe(storeStream);
        fstream.on('error', self.emit.bind(this, 'error'));
        _meta.encrypter.on('data', function(data) {
          _meta.fileSize = data.length;
        })
        _meta.encrypter.on('end', function() {
          storeStream.end()
        });
        storeStream.on('finish', function() {
          _storeFileInBucket(function(err, res) {
            if(err) {
              self.emit.bind(this, err)
              cb(err, null)
            }
            cb(null, res)
          });
        });
      });
    },
    /*
     * Get a file stream by bucketId and fileId
     * @param bucketId
     * @param fileId
    */
    getFile: function(bucketId, fileId, cb) {
      // First grab the the token for downloading the file
      self.file.createFileToken(bucketId, function(e, body) {
        if(e) { return _error(e); }
        self._token = body.token;
        self._key = body.encryptionKey;
        self._id = body.id;
        self._mimetype = body.mimetype;
        // If successful, try to resolve the file pointers
        self.file.getFilePointers(bucketId, fileId, function(e, pointers) {
          if(e) { return _error(e); }
          // We now have a reference to every piece of our file, let's assemble it!
          self.file.resolveFileFromPointers(pointers, {}, function (e, muxer) {
            if(e) { return _error(e); }
            self._muxer = muxer;
            self.emit('ready');
            _initStore(cb);
          });
        });
      });
    },
    /**
      * Fetch a token for this File from the bridge.
      * @param bucketId
    */
    createFileToken: function(bucketId, cb) {
      self._client.createToken(bucketId, 'PUSH', function(err, token) {
        cb(err, token);
      });
    },
    /**
      * Get a list of pointers to a file from the bridge
      * @param bucketId
      * @oaram fileId
    */
    getFilePointers: function(bucketId, fileId, cb) {
      var opts = {
       baseURI: this._bridge,
       bucket: bucketId,
       file: fileId
      };
      self._client.getFilePointers(opts, function(err, res) {
        cb(err,res);
      });
    },
    // TODO refactor for mem-blob-store
    /**
    * Get the contents of the file as a Buffer
    * @param {File~getBufferCallback} cb
    */
    getBuffer: function(cb) {
      this._store.get(0, cb);
    },
    // TODO: mem-blob-store
    /**
     * Get a url which can be used in the browser to refer to the file
     * @param {File~getBlobUrl} cb
     */
    getBlobUrl: function(cb) {
      var clength = self._store.chunkLength;
      var shards = self._store.chunks.length;
      var length = clength * shards;
      var stream = chunkStoreStream.read(self._store, clength, { length: length });
      return streamToBlobUrl(stream, cb);
    },
    /**
     * Get a W3C Blob object which contains the file data
     * @param {File~getBlobCallback} cb
     */
    getBlob: function(cb) {
      var clength = self._store.chunkLength;
      var shards = self._store.chunks.length;
      var length = clength * shards;
      var stream = chunkStoreStream.read(self._store, clength, { length: length });
      return streamToBlob(stream, cb);
    },
    /**
     * @callback File~appendToCallback
     * @param {Error} error
     * @param {HTMLElement} element - The new DOM node that is displaying the
     * content
     */

    /**
     * Like file.appendTo but renders directly into the given element
     * @param {File~renderToCallback} cb
     */
    renderTo: function(rootElem, cb) {
      cb = cb || function () {};
      self._store.get(0, function(e, buffer) {
        if(e) { return cb(e); }
        var file = {
          name: `file${self._getExtension()}`,
          createReadStream: function(opts) {
            opts = opts || {};
            return from([
              buffer.slice(opts.start || 0, opts.end || (buffer.length - 1))
            ]);
          }
        };
        render.render(file, rootElem, cb);
      });
    },
    /**
     * @callback File~getBufferCallback
     * @param {Error} error
     * @param {Buffer} buffer
     */

    // TODO: Pull render out into its own api section
    /**
     * Show the file in a browser by appending it to the DOM. This is a powerful
     * function that handles many file types like video (.mp4, .webm, .m4v, etc.),
     * audio (.m4a, .mp3, .wav, etc.), images (.jpg, .gif, .png, etc.), and other
     * file formats (.pdf, .md, .txt, etc.).
     *
     * This call is safe to call on a file that has not finished downloading yet,
     * it will wait until the file is fully available before rendering.
     *
     * `rootElem` is a container element (CSS selector or reference to DOM node)
     * that the content will be shown in. A new DOM node will be created for the
     * content and appended to `rootElem`.
     *
     * If provided, callback will be called once the file is visible to the user.
     * @param {File~appendToCallback} cb
     */
    appendTo: function(rootElem, cb) {
      cb = cb || function () {};
      self._store.get(0, function(e, buffer) {
        if(e) { return cb(e); }
        var file = {
          name: `file${self._getExtension()}`,
          createReadStream: function(opts) {
            opts = opts || {};
            return from([
              buffer.slice(opts.start || 0, opts.end || (buffer.length - 1))
            ]);
          }
        };
        render.append(file, rootElem, cb);
      });
    }
  }
}
