/**
 * @module storj/storj
 * @license LGPL-3.0
 */
'use strict';

// File will emit events
var EventEmitter = require('events').EventEmitter;

// Used to enforce expecations about our provided params
var assert = require('assert');

// Util allows us to extend objects
var util = require('util');

/**
 * Creates a new Storj object for interacting with the Storj network
 * @constructor
 * @param {Object} [opts] - control the behaviour of the Storj object
 * @param {String} [opts.bridge=https://api.storj.io] - API base url
 * @param {Object} [opts.store] - The abstract-blob-store to use for persisting
 * state for this object, defaults to fs on the server and memory in the browser
 * @param {String} [opts.key] - The private key that will be used to interact
 * with the server when needed for authenticated actions, this can either be
 * a key for the blobstore, a filesystem path, or the plaintext key.
 */
function Storj(opts) {
  if(!(this instanceof Storj)) {
    return new Storj(opts);
  }

  opts = opts || {}
  assert(typeof opts === 'object', 'Storj must be an object');

  this._bridge = opts.bridge;

  if(opts.key) {
    /* TODO */
    throw new Error('key not yet implemented');
  }
}

Storj.DEFAULTS = {
  bridge: 'https://api.storj.io'
};

// Storj emits events
util.inherits(Storj, EventEmitter);

/**
 * Upload a new file to the Storj bridge
 * @prop {String} BucketId
 * @prop {String} FileId
 * @prop {Object} opts - Controls what file is uploaded
 * @prop {String|Buffer|ReadableStream} [body] - Either a string/buffer
 * representation of the file contents or a ReadableStream of the contents
 * @prop {String} [path] - The path to the file on the filesystem
 * @prop {String} [mime] - Mime-type of the file we are uploading
 * @prop {Function} [cb] - Invoked when the file has finished uploading or when
 * the upload fails
 */
Storj.createFile = function() {
};

/**
 * Download a file from the Storj bridge
 * @prop {String} BucketId
 * @prop {String} FileId
 * @prop {Function} - Invoked when the file has been downloaded or when an
 * errors occurs
 */
Storj.getFile = function() {
};

/**
 * Get a list of all files in a bucket, returning a set of pointers to files
 * but not the contents, to fetch the contents call `.download()` on the
 * pointer
 * @prop {String} - BucketId
 * @prop {Function} - Invoked when the file pointers have been fetched  or when
 * an error occurs
 */
Storj.getFiles = function() {
};

/**
 * Remove a file from the bridge
 * @prop {String} - BucketId
 * @prop {String} - FileId
 * @prop {Function} - Invoked when the file has been removed or when an error
 * occurs
 */
Storj.deleteFile = function() {
};
