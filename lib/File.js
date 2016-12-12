/**
 * @module storjjs/file
 * @license LGPL-3.0
 */
'use strict';

// File will emit events
var EventEmitter = require('events').EventEmitter;

// We use util to make File extend EventEmitter
var util = require('util');

/**
 * Creates a new instance of a file
 * @constructor
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
  /* TODO */
}

// Make File extend the EventEmitter class
util.inherits(File, EventEmitter);

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
