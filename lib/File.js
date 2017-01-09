/**
 * @module storjjs/file
 * @license LGPL-3.0
 */
'use strict';

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

/**
 * Creates a new instance of a file
 * @constructor
 * @param {String} bucketId - The bucket that the file lives in
 * @param {String} file - The file id
 * @param {Object} [opts] - Control the behaviour of the file
 * @param {String} [opts.bridge=https://api.storj.io] - API base url
 * @param {String} [opts.protocol=http] - Protocol for downloading shards
 * @param {String} [opts.client] - The client that is controling this file
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
function File(bucketId, file, opts) {
  if(!(this instanceof File)) {
    return new File(bucketId, file, opts);
  }

  this._bucketId = bucketId;
  this._file = file;

  // Ensure opts was passed in and is an object
  opts = opts || {};
  assert(typeof opts === 'object', 'File options must be an object');

  this._bridge = opts.bridge || File.Defaults.bridge;
  this._protocol = opts.protocol || File.Defaults.protocol;

  this._client = opts.client;

  this._verifyConstructor();

  this._bridgeClient = new BridgeClient({
    bridge: this._bridge
  });

  // We now have enough to begin downloading the file async
  this._fetchFile();

  return this;
}

// Make File extend the EventEmitter class
util.inherits(File, EventEmitter);

/**
 * A function supporting the File constructor, this ensures the values
 * provided to the constructor were valid.
 * @private
 */
File.prototype._verifyConstructor = function () {
  // Both the file and the bucket should be strings
  assert(typeof this._bucketId === 'string', 'bucketId must be a string');
  assert(typeof this._file === 'string', 'file must be a string');

  // Both the file and the bucket should be 24 character hex values
  assert(/^[0-9a-fA-F]{24}$/.test(this._bucketId),
    'bucketId must be 24 char hex');
  assert(/^[0-9a-fA-F]{24}$/.test(this._file),
    'file must be 24 char hex');

  // Both bridge and protocol should be strings
  assert(typeof this._bridge === 'string', 'Bridge url must be a string');
  assert(typeof this._protocol === 'string', 'Protocol must be a string');

  // We don't require client, but if it is here it must be an object
  assert(this._client === undefined || typeof this._client === 'object',
    'Client must be an object');

  return this;
};

/**
 * Kicks off downloading the file from the network using the values provided
 * in the constructor. This function emits errors on the File object.
 * @private
 */
File.prototype._fetchFile = function() {
  var self = this;
  // First grab the the token for downloading the file
  self._createFileToken(function(e, token) {
    if(e) { return self._error(e); }
    self._token = token;
    // If successful, try to resolve the file pointers
    self._getFilePointers(function(e, pointers) {
      if(e) { return self._error(e); }
      // We now have a reference to every piece of our file, let's assemble it!
      self._resolveFileFromPointers(pointers, {}, function (e, muxer) {
        if(e) { return self._error(e); }
        self._muxer = muxer;
      });
    });
  });
};

/**
 * Fetch a token for this File from the bridge.
 * @private
 */
File.prototype._createFileToken = function (cb) {
  var self = this;
  request.post({
    url: `${self._bridge}/buckets/${self._bucketId}/tokens`,
    json: true,
    body: {
      operation: 'PULL',
      file: self._file
    }
  }, function (e, res, body) {
    // Ensure body is defined before trying to read its properties
    body = body || {};
    return cb(e, body.token);
  });
};

/**
 * Get a list of pointers to a file from the bridge
 * @private
 */
File.prototype._getFilePointers = function(cb) {
  var self = this;
  var url =
    `${self._bridge}/buckets/${self._bucketId}/files/${self._file}`;
  request.get({
    url: url,
    json: true,
    headers: {
      'x-token': self._token
    },
  }, function(e, res, body) {
    return cb(e, body);
  });
};

/**
 * Given a list of pointers, this function will reconstruct the file
 * @private
 */
File.prototype._resolveFileFromPointers = function(pointers, opts, cb) {
  this._bridgeClient.resolveFileFromPointers(pointers, opts, cb);
};

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
  bridge: 'https://api.storj.io',
  protocol: 'http'
};

/**
 * Emitted when the file has finished downloading and is ready to use
 * @event File#done
 */

/**
 * Emitted when the file encounters an unrecoverable error, if a listener is
 * not registered for this event it will propogate up to client.
 * @event File#error
 * @type {error}
 */

/**
 * Get the contents of the file as a Buffer
 * @param {File~getBufferCallback} cb
 */
File.prototype.getBuffer = function getBuffer() {
  /* TODO */
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
File.prototype.appendTo = function appendTo() {
  /* TODO */
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
File.prototype.renderTo = function renderTo() {
  /* TODO */
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
File.prototype.getBlob = function getBlob() {
  /* TODO */
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
File.prototype.getBlobUrl = function getBlobUrl() {
  /* TODO */
};

/**
 * @callback File~getBlobCallback
 * @param {Error} error
 * @param {String} url
 */

// Export the File class
module.exports = File;
