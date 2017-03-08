/**
 * @module storj/file
 * @license LGPL-3.0
 */
'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var streamToBlob = require('stream-to-blob');
var streamToBlobUrl = require('stream-to-blob-url');
var render = require('render-media');
var util = require('util');
var streamToBuffer = require('stream-with-known-length-to-buffer');

/**
 * Creates a new instance of a file
 * @constructor
 * @param {Object} self - context of the Storj object
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

function File() {
  if(!(this instanceof File)) {
    return new File();
  }

  // File is simply a puppet, it is driven by the logic contained in the
  // `/lib/api/*.js` files.

  return this;
}

// Make File extend the EventEmitter class
util.inherits(File, EventEmitter);

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
/*
File.Defaults = {
  bridge: self._client
};
*/

/**
 * Emitted when the file is uploaded to storj network
 * @event File#done
 */

/**
 * Emitted when the file has finished downloading
 * @event File#downloaded
 */

 /**
 * Emitted when the file has rendered to the DOM
 * @event File#rendered
 */

/**
 * Emitted when the file encounters an unrecoverable error, if a listener is
 * not registered for this event it will propogate up to client.
 * @event File#error
 * @type {error}
 */

File.prototype.getBuffer = function getBuffer(cb) {
  return streamToBuffer(this.createReadStream(), this.size, cb);
};

File.prototype.createReadStream = function getReadStream() {
  return this._store.createReadStream(this._storeKey);
}

File.prototype.appendTo = function appendTo(rootElem, cb) {
  cb = cb || function () {};
  var file = {
    name: `file${self._getExtension()}`,
    createReadStream: function() {
      return this.createReadStream();
    }
  };
  render.append(file, rootElem, cb);
};

File.prototype.renderTo = function renderTo(rootElem, cb) {
  cb = cb || function () {};
  var file = {
    name: `file${self._getExtension()}`,
    createReadStream: function() {
      return this.createReadStream();
    }
  };
  render.render(file, rootElem, cb);
};

File.prototype._getExtension = function () {
  var keys = Object.keys(render.mime);
  var index = keys.map((v) => render.mime[v]).indexOf(this.mimetype);
  if(index < 0) {
    return '.unknown';
  }
  return keys[index];
};

File.prototype.getBlob = function getBlob(cb) {
  return streamToBlob(this.createReadStream(), cb);
};

File.prototype.getBlobUrl = function getBlobUrl(cb) {
  return streamToBlobUrl(this.createReadStream(), cb);
};

// Export the File class
module.exports = File;
