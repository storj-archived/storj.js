// /**
//  * @module storj/file
//  * @license LGPL-3.0
//  */
// 'use strict';

// // File will emit events
// var EventEmitter = require('events').EventEmitter;

// // We use util to make File extend EventEmitter
// var util = require('util');

// // We use assert to test assumptions about user-provided data
// var assert = require('assert');

// // We use request for making HTTP requests to the bridge
// var request = require('request');

// // We use the BridgeClient for reconstructing a file given a set of pointers
// var BridgeClient = require('storj-lib/lib/bridge-client');

// // We use the storj DecryptStream to decrypt shards as they move into our
// // abstract-chunk-store, and we use the keyring to generate the key.
// var DecryptStream = require('storj-lib/lib/crypto-tools/decrypt-stream.js');
// var KeyIV = require('storj-lib/lib/crypto-tools/deterministic-key-iv.js');


// // We use memory-chunk-store as the default chunk store since it works in all
// // environments
// var memoryChunkStore = require('memory-chunk-store');

// // chunkStoreStream allows us to stream data into and out of a chunk store
// //var chunkStoreStream = require('chunk-store-stream');

// // stream-to-blob and stream-to-blob-url let us represent a shard as a blob in
// // the web browser
// var streamToBlob = require('stream-to-blob');
// var streamToBlobUrl = require('stream-to-blob-url');

// // render-media allows us to take a shard and write it directly to the page!
// var render = require('render-media');

// // We use from2 to give us a readableStream of our buffer for render-media
// var from = require('from2');

// /**
//  * Creates a new instance of a file
//  * @constructor
//  * @param {String} bucketId - The bucket that the file lives in
//  * @param {String} file - The file id
//  * @param {Object} [opts] - Control the behaviour of the file
//  * @param {String} [opts.bridge=https://api.storj.io] - API base url
//  * @param {String} [opts.protocol=http] - Protocol for downloading shards
//  * @param {String} [opts.client] - The client that is controling this file
//  * @param {Object} [opts.store] - Custom chunk store (must follow the
//  * [abstract-chunk-store](https://www.npmjs.com/package/abstract-chunk-store)
//  * API). In the browser, the default is memory-chunk-store, on the server it
//  * is fs-chunk-store.
//  * @prop {String} bucketId - The bucket id that the file lives in on the Bridge
//  * @prop {Number} length - File length in bytes
//  * @prop {Number} timeRemaining - Approximate time remaining until download
//  * completes, measured in milliseconds
//  * @prop {Number} received - Total bytes downloaded from peers, including
//  * invalid data
//  * @prop {Number} downloaded - Total verified bytes received from peers. A
//  * verified byte is a byte belonging to a shard that has been verified to be
//  * correct
//  * @prop {Number} downloadSpeed - File download speed, in bytes/sec
//  * @prop {Number} progress - File download progress, from 0 to 1
//  * @prop {Number} numPeers - Total number of farmers we are actively connected
//  * to
//  * @implements {EventEmitter}
//  */
// function file(bucketId, file, opts) {
//   if(!(this instanceof File)) {
//     return new File(bucketId, file, opts);
//   }

//   this._bucketId = bucketId;
//   this._file = file;

//   this._bridgeClient = new BridgeClient({
//     bridge: this._bridge
//   });

//   // We now have enough to begin downloading the file async
//   this._fetchFile();

//   return this;
// }

// // Make File extend the EventEmitter class
// util.inherits(file, EventEmitter);

// /**
//  * Kicks off downloading the file from the network using the values provided
//  * in the constructor. This function emits errors on the File object.
//  * @private
//  */
// file.prototype._fetchFile = function() {
//   var self = this;
//   // First grab the the token for downloading the file
//   self._createFileToken(function(e, body) {
//     if(e) { return self._error(e); }
//     self._token = body.token;
//     self._key = body.encryptionKey;
//     self._id = body.id;
//     self._mimetype = body.mimetype;
//     // If successful, try to resolve the file pointers
//     self._getFilePointers(function(e, pointers) {
//       if(e) { return self._error(e); }
//       // We now have a reference to every piece of our file, let's assemble it!
//       self._resolveFileFromPointers(pointers, {}, function (e, muxer) {
//         if(e) { return self._error(e); }
//         self._muxer = muxer;
//         self.emit('ready');
//         self._initStore();
//       });
//     });
//   });
// };

// /**
//  * Fetch a token for this File from the bridge.
//  * @private
//  */
// file.prototype._createFileToken = function (cb) {
//   var self = this;
//   request.post({
//     url: `${self._bridge}/buckets/${self._bucketId}/tokens`,
//     json: true,
//     body: {
//       operation: 'PULL',
//       file: self._file
//     }
//   }, function (e, res, body) {
//     // Ensure body is defined before trying to read its properties
//     body = body || {};
//     return cb(e, body);
//   });
// };

// /**
//  * Get a list of pointers to a file from the bridge
//  * @private
//  */
// file.prototype._getFilePointers = function(cb) {
//   var self = this;
//   var url =
//     `${self._bridge}/buckets/${self._bucketId}/files/${self._file}`;
//   request.get({
//     url: url,
//     json: true,
//     headers: {
//       'x-token': self._token
//     },
//   }, function(e, res, body) {
//     return cb(e, body);
//   });
// };

// /**
//  * Given a list of pointers, this function will reconstruct the file
//  * @private
//  */
// file.prototype._resolveFileFromPointers = function(pointers, opts, cb) {
//   this._bridgeClient.resolveFileFromPointers(pointers, opts, cb);
// };

// *
//  * Once a file has a _muxer, this function will initialize the backend _store
//  * with the data from the _muxer.
//  * @private
 
// file.prototype._initStore = function() {
//   var self = this;
//   self._store = new self._chunkStore(this._muxer._length);
//   var stream = new chunkStoreStream.write(self._store, this._muxer._length);
//   var key = KeyIV.getDeterministicKey(self._key, self._file);
//   var secret = new KeyIV(key, self._file);
//   var decrypter = new DecryptStream(secret);
//   self._muxer.pipe(decrypter).pipe(stream);
//   self._muxer.on('error', self.emit.bind(self, 'error'));
//   stream.on('error', self.emit.bind(self, 'error'));
//   self._muxer.on('end', function () {
//     delete self._muxer;
//     self.emit('done');
//   });
// };

// /**
//  * Conveinence function for emitting an error. If there is a registered
//  * listener on the File, then we will emit there, otherwise we will attempt to
//  * emit on the client. If there is not a client, we throw the error. Client may
//  * throw an unhandled error event exception if no listeners are registered.
//  * @private
//  */
// file.prototype._error = function (e) {
//   if(this.listenerCount('error') > 0) {
//     return this.emit('error', e);
//   }

//   if(this._client) {
//     return this._client.emit('error', e);
//   }

//   throw e;
// };

// /**
//  * Default values for new clients
//  * @private
//  */
// file.Defaults = {
//   bridge: 'https://api.storj.io',
//   protocol: 'http'
// };

// /**
//  * Emitted when the file is ready to use
//  * @event File#ready
//  */

// /**
//  * Emitted when the file has finished downloading
//  * @event File#done
//  */

// /**
//  * Emitted when the file encounters an unrecoverable error, if a listener is
//  * not registered for this event it will propogate up to client.
//  * @event File#error
//  * @type {error}
//  */

// /**
//  * Get the contents of the file as a Buffer
//  * @param {File~getBufferCallback} cb
//  */
// file.prototype.getBuffer = function getBuffer(cb) {
//   this._store.get(0, cb);
// };

// /**
//  * @callback File~getBufferCallback
//  * @param {Error} error
//  * @param {Buffer} buffer
//  */

// /**
//  * Show the file in a browser by appending it to the DOM. This is a powerful
//  * function that handles many file types like video (.mp4, .webm, .m4v, etc.),
//  * audio (.m4a, .mp3, .wav, etc.), images (.jpg, .gif, .png, etc.), and other
//  * file formats (.pdf, .md, .txt, etc.).
//  *
//  * This call is safe to call on a file that has not finished downloading yet,
//  * it will wait until the file is fully available before rendering.
//  *
//  * `rootElem` is a container element (CSS selector or reference to DOM node)
//  * that the content will be shown in. A new DOM node will be created for the
//  * content and appended to `rootElem`.
//  *
//  * If provided, callback will be called once the file is visible to the user.
//  * @param {File~appendToCallback} cb
//  */
// file.prototype.appendTo = function appendTo(rootElem, cb) {
//   var self = this;
//   cb = cb || function () {};
//   self._store.get(0, function(e, buffer) {
//     if(e) { return cb(e); }
//     var file = {
//       name: `file${self._getExtension()}`,
//       createReadStream: function(opts) {
//         opts = opts || {};
//         return from([
//           buffer.slice(opts.start || 0, opts.end || (buffer.length - 1))
//         ]);
//       }
//     };
//     render.append(file, rootElem, cb);
//   });
// };

// /**
//  * @callback File~appendToCallback
//  * @param {Error} error
//  * @param {HTMLElement} element - The new DOM node that is displaying the
//  * content
//  */

// /**
//  * Like file.appendTo but renders directly into the given element
//  * @param {File~renderToCallback} cb
//  */
// file.prototype.renderTo = function renderTo(rootElem, cb) {
//   var self = this;
//   cb = cb || function () {};
//   self._store.get(0, function(e, buffer) {
//     if(e) { return cb(e); }
//     var file = {
//       name: `file${self._getExtension()}`,
//       createReadStream: function(opts) {
//         opts = opts || {};
//         return from([
//           buffer.slice(opts.start || 0, opts.end || (buffer.length - 1))
//         ]);
//       }
//     };
//     render.render(file, rootElem, cb);
//   });
// };

// /**
//  * Given a mime-type, return the corresponding extension.
//  * @private
//  * TODO: PR for render-media allowing us to directly specify the mime-type
//  */
// file.prototype._getExtension = function () {
//   var self = this;
//   var keys = Object.keys(render.mime);
//   var index = keys.map((v) => render.mime[v]).indexOf(self._mimetype);
//   if(index < 0) {
//     return '.unknown';
//   }
//   return keys[index];
// };

// /**
//  * @callback File~renderToCallback
//  * @param {Error} error
//  * @param {HTMLElement element - The new DOM node that is displaying the
//  * content
//  */

// /**
//  * Get a W3C Blob object which contains the file data
//  * @param {File~getBlobCallback} cb
//  */
// file.prototype.getBlob = function getBlob(cb) {
//   var self = this;
//   var clength = self._store.chunkLength;
//   var shards = self._store.chunks.length;
//   var length = clength * shards;
//   var stream = chunkStoreStream.read(self._store, clength, { length: length });
//   return streamToBlob(stream, cb);
// };

// /**
//  * @callback File~getBlobCallback
//  * @param {Error} error
//  * @param {Blob} blob
//  */

// /**
//  * Get a url which can be used in the browser to refer to the file
//  * @param {File~getBlobUrl} cb
//  */
// file.prototype.getBlobUrl = function getBlobUrl(cb) {
//   var self = this;
//   var clength = self._store.chunkLength;
//   var shards = self._store.chunks.length;
//   var length = clength * shards;
//   var stream = chunkStoreStream.read(self._store, clength, { length: length });
//   return streamToBlobUrl(stream, cb);
// };

// /**
//  * @callback File~getBlobCallback
//  * @param {Error} error
//  * @param {String} url
//  */

// // Export the File class
// module.exports = file;
'use strict';

var EventEmitter = require('events').EventEmitter;
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

module.exports = function file (self) {
  var _storeFileInBucket = function(cb) {
    var rs = this._store.createReadStream(this._meta.tmpName);
    var options = {
      fileName: this._meta.fileName,
      tmpName: this._meta.tmpName,
      fileSize: this._meta.fileSize
    }
    
    console.log(this._client)
    this._client.storeFileInBucket(this._meta.bucketId, this._meta.token, rs, options, function(err, file) {
      if (err) {
        cb(err);
      }
      cb(null,file);
    });
  }
  
  return {
    createFile: function(bucketId, fileName, stream, cb) {
      var self = this;
      console.log(fileName)

      console.log(self)

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

        self._meta = {
          secret: secret,
          encrypter: encrypter,
          token: token,
          fileName: fileName,
          fileSize: 0,
          tmpName: tmpName,
          bucketId: bucketId
        }

        var storeStream = self._store.createWriteStream(tmpName);

        fstream.pipe(self._meta.encrypter).pipe(storeStream);
        fstream.on('error', self.emit.bind(this, 'error'));

        self._meta.encrypter.on('data', (data) =>{
          self._meta.fileSize = data.length;
        })

        self._meta.encrypter.on('end', () => {
          storeStream.end()
        });

        storeStream.on('finish', ()=> {
          self._storeFileInBucket(function(err, res) {
            if(err) {
              self.emit.bind(this, err)
              cb(err, null)
            }
            cb(null, res)
          });
        });
      });
    },
    getFile: function(opt) {
      
    }
  }

}
