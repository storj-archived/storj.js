/**
 * @module storj/file
 * @license LGPL-3.0
 */
'use strict';

// TODO: File now needs to get the context from Storj to contact
// contact the global client we use

// File will emit events
var EventEmitter = require('events').EventEmitter;

// We use util to make File extend EventEmitter
var util = require('util');

// We use assert to test assumptions about user-provided data
var assert = require('assert');

// We use request for making HTTP requests to the bridge
var request = require('request');

// We use the BridgeClient for reconstructing a file given a set of pointers
var BridgeClient = require('storj-lib/lib/bridge-client');

// We use the storj DecryptStream to decrypt shards as they move into our
// abstract-chunk-store, and we use the keyring to generate the key.
var DecryptStream = require('storj-lib/lib/crypto-tools/decrypt-stream.js');
var KeyIV = require('storj-lib/lib/crypto-tools/deterministic-key-iv.js');

// stream-to-blob and stream-to-blob-url let us represent a shard as a blob in
// the web browser
var streamToBlob = require('stream-to-blob');
var streamToBlobUrl = require('stream-to-blob-url');

// render-media allows us to take a shard and write it directly to the page!
var render = require('render-media');

// We use from2 to give us a readableStream of our buffer for render-media
var from = require('from2');

var calculateFileId = require('storj-lib/lib/utils.js').calculateFileId;
var KeyIV = require('storj-lib/lib/crypto-tools/deterministic-key-iv.js');
var EncryptStream = require('storj-lib/lib/crypto-tools/encrypt-stream.js');
var crypto = require('crypto');
var storjutils = require('storj-lib/lib/utils.js');
var sha256 = require('storj-lib/lib/utils').sha256;
var store = require('memory-blob-store');
var util = require('util');
var crypt = require('crypto');

/**
 * Creates a new instance of a file
 * @constructor
 * @param {String} bucketId - The bucket that the file lives in
 * @param {String} file - The file id
 * @param {Object} [opts] - Control the behaviour of the file
 * @param {String} [opts.bridge=https://api.storj.io] - API base url
 * @param {String} [opts.protocol=http] - Protocol for downloading shards
 * @param {String} [opts.client] - The client that is controling this file
 * @param {Object} [opts.store] - Custom chunk store (must follow the
 * [abstract-chunk-store](https://www.npmjs.com/package/abstract-chunk-store)
 * API). In the browser, the default is memory-chunk-store, on the server it
 * is fs-chunk-store.
 * @prop {String} bucketId - The bucket id that the file lives in on the Bridge
 * @prop {Number} length - File length in bytes
 * @prop {Number} timeRemaining - Approximate time remaining until download
 * completes, measured in milliseconds
 * @prop {Number} received - Total bytes downloaded from peers, including
 * invalid data
 * @prop {Number} downloaded - Total verified bytes received from peers. A
 * verified byte is a byte belonging to a shard that has been verified to be
 * correct
 * @prop {Number} downloadSpeed - File download speed, in bytes/sec
 * @prop {Number} progress - File download progress, from 0 to 1
 * @prop {Number} numPeers - Total number of farmers we are actively connected
 * to
 * @implements {EventEmitter}
 */
 
//function File(bucketId, file, opts) { 
function File(self) {
  if(!(this instanceof File)) {
    //return new File(bucketId, file, opts);
    return new File(self);
  }

  //this._bucketId = bucketId;
  //this._file = file;

  // Ensure opts was passed in and is an object
  //opts = opts || {};
  //assert(typeof opts === 'object', 'File options must be an object');

  // we have access to these off self from Storj
  this._bridge = self._bridge;
  this._store = self._store;
  this._basicAuth = self._basicAuth;
  this._client = self._client;
  this._protocol = self._protocol;

  //this._bridge = opts.bridge || File.Defaults.bridge;
  //this._protocol = opts.protocol || File.Defaults.protocol;

  //this._client = opts.client;

  //this._chunkStore = opts.store || memoryChunkStore;

  //this._verifyConstructor();

  //this._bridgeClient = new BridgeClient({
  //  bridge: this._bridge
  //});

  // We now have enough to begin downloading the file async
  //this._fetchFile();

  return this;
}

// Make File extend the EventEmitter class
util.inherits(File, EventEmitter);

/**
 * A function supporting the File constructor, this ensures the values
 * provided to the constructor were valid.
 * @private
 */
//File.prototype._verifyConstructor = function () {
  //console.log('test')

  // TODO: move assertions to individual functions
  // Both the file and the bucket should be strings
  //assert(typeof this._bucketId === 'string', 'bucketId must be a string');
  //assert(typeof this._file === 'string', 'file must be a string');

  // Both the file and the bucket should be 24 character hex values
  //assert(/^[0-9a-fA-F]{24}$/.test(this._bucketId),
  //  'bucketId must be 24 char hex');
  //assert(/^[0-9a-fA-F]{24}$/.test(this._file),
  //  'file must be 24 char hex');

  // Both bridge and protocol should be strings
  //assert(typeof this._bridge === 'string', 'Bridge url must be a string');
  //assert(typeof this._protocol === 'string', 'Protocol must be a string');

  // We don't require client, but if it is here it must be an object
  //assert(this._client === undefined || typeof this._client === 'object',
  //  'Client must be an object');

  //return this;
//};

/**
 * Conveinence function for emitting an error. If there is a registered
 * listener on the File, then we will emit there, otherwise we will attempt to
 * emit on the client. If there is not a client, we throw the error. Client may
 * throw an unhandled error event exception if no listeners are registered.
 * @private
 */
File.prototype._error = function (e) {
  if(this.listenerCount('error') > 0) {
    return this.emit('error', e);
  }

  if(this._client) {
    return this._client.emit('error', e);
  }

  throw e;
};

/**
 * Default values for new clients
 * @private
 */
File.Defaults = {
  client: self._client
};

/**
 * Emitted when the file is ready to use
 * @event File#ready
 */

/**
 * Emitted when the file has finished downloading
 * @event File#done
 */

/**
 * Emitted when the file encounters an unrecoverable error, if a listener is
 * not registered for this event it will propogate up to client.
 * @event File#error
 * @type {error}
 */

/*
 * Once the file is done encrypting, call the core bridge_client
 * with the readable stream generated from the file encryption
 * @private
*/
File.prototype._storeFileInBucket = function(cb) {
  var rs = this._store.createReadStream(_meta.tmpName);
  var options = {
    fileName: _meta.fileName,
    tmpName: _meta.tmpName,
    fileSize: _meta.fileSize
  }
  this._client.storeFileInBucket(this._meta.bucketId, this._meta.token, rs, options, function(err, file) {
    if (err) {
      cb(err);
    }
    cb(null,file);
  });
};

/*
 * Create new file and add it to supplied bucketId
 * @param bucketId
 * @param fileName
 * @param stream
 * @param callback
*/
File.prototype.createFile = function(bucketId, fileName, stream, cb) {
    var self = this;

    if(stream.readable) {
      var fstream = stream;
    }

    // assume single file, file is a stream, public bucket, and basic http auth
    // bucket ID, operation, cb
    this._client.createToken(bucketId, 'PUSH', function(err, token) {
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
      self._meta.encrypter.on('data', function(data) {
        self._meta.fileSize = data.length;
      })
      self._meta.encrypter.on('end', function() {
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
}
/**
 * Get the contents of the file as a Buffer
 * @param {File~getBufferCallback} cb
 */
File.prototype.getBuffer = function getBuffer(cb) {
  this._store.get(0, cb);
};

/**
 * @callback File~getBufferCallback
 * @param {Error} error
 * @param {Buffer} buffer
 */

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
File.prototype.appendTo = function appendTo(rootElem, cb) {
  var self = this;
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
};

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
File.prototype.renderTo = function renderTo(rootElem, cb) {
  var self = this;
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
};

/**
 * Given a mime-type, return the corresponding extension.
 * @private
 * TODO: PR for render-media allowing us to directly specify the mime-type
 */
File.prototype._getExtension = function () {
  var self = this;
  var keys = Object.keys(render.mime);
  var index = keys.map((v) => render.mime[v]).indexOf(self._mimetype);
  if(index < 0) {
    return '.unknown';
  }
  return keys[index];
};

/**
 * @callback File~renderToCallback
 * @param {Error} error
 * @param {HTMLElement element - The new DOM node that is displaying the
 * content
 */

/**
 * Get a W3C Blob object which contains the file data
 * @param {File~getBlobCallback} cb
 */
File.prototype.getBlob = function getBlob(cb) {
  var self = this;
  var clength = self._store.chunkLength;
  var shards = self._store.chunks.length;
  var length = clength * shards;
  var stream = chunkStoreStream.read(self._store, clength, { length: length });
  return streamToBlob(stream, cb);
};

/**
 * @callback File~getBlobCallback
 * @param {Error} error
 * @param {Blob} blob
 */

/**
 * Get a url which can be used in the browser to refer to the file
 * @param {File~getBlobUrl} cb
 */
File.prototype.getBlobUrl = function getBlobUrl(cb) {
  var self = this;
  var clength = self._store.chunkLength;
  var shards = self._store.chunks.length;
  var length = clength * shards;
  var stream = chunkStoreStream.read(self._store, clength, { length: length });
  return streamToBlobUrl(stream, cb);
};

/**
 * @callback File~getBlobCallback
 * @param {Error} error
 * @param {String} url
 */

// Export the File class
module.exports = File;
