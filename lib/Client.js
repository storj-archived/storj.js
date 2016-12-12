/**
 * @module storjjs/client
 * @license LGPL-3.0
 */
'use strict';

// We use assert to test user-provided data against our expectations
var assert = require('assert');

// Client will emit events
var EventEmitter = require('events').EventEmitter;

// We use util to make Client extend EventEmitter
var util = require('util');

/**
 * Creates a new client for interacting with the storj network.
 * @constructor
 * @prop {Array} files - An array of all files the client is tracking
 * @prop {Number} progress - Download progress across all files, a value
 * between 0 and 1
 * @prop {Number} downloadSpeed - Total download speed across all files,
 * measured in bytes/sec
 * @license LGPL-3.0
 * @see https://github.com/storj/storj.js
 * @param {Object} [opts] - Control the behaviour of the client
 * @param {String} [opts.bridge=https://api.storj.io] - API base url
 * @param {String} [opts.protocol=http] - Protocol for downloading shards
 * @implements {EventEmitter}
 */
function Client(opts) {
  // Be nice to our users. If they don't use `new`, do it for them.
  if(!(this instanceof Client)) {
    return new Client(opts);
  }

  // Scrub our incomming opts and configure our client's properties
  opts = opts || {};
  assert(typeof opts === 'object', 'Client options must be an object');
  this.bridge = opts.bridge || Client.Defaults.bridge;
  this.protocol = opts.protocol || Client.Defaults.protocol;
  assert(typeof this.bridge === 'string', 'Bridge url must be a string');
  assert(typeof this.protocol === 'string', 'Protocol must be a string');

  // Setup up magic values for our client


  // Done setting up our client!
  return this;
}

/**
 * Default values for new clients
 * @private
 */
Client.Defaults = {
  bridge: 'https://api.storj.io',
  protocol: 'http'
};


// Make Client extend the EventEmitter class
util.inherits(Client, EventEmitter);

/**
 * Emittted when a download begins and a file becomes available. The file may
 * not be fully downloaded yet.
 * @event Client#file
 * @type {File}
 */

/**
 * Emitted when the client encounters an error that isn't caught by another
 * handler
 * @event Client#error
 * @type {error}
 */

/**
 * Add a new file to be downloaded by the client
 * @param {Object} opts - Information about the file to be downloaded
 * @param {String} [opts.bucketId]
 * @param {String} [opts.user] - Required if bucketId not provided
 * @param {String} [opts.bucketName] - Required if bucketId not provided
 * @param {String} opts.file - Name of the file to download
 * @param {Function} [opts.store] - Custom chunk store (must
 * follow the
 * [abstract-chunk-store](https://www.npmjs.com/package/abstract-chunk-store)
 * API). In the browser, the default is memory-chunk-store, on the server it
 * is fs-chunk-store.
 * @param {String} [opts.type] - Mimetype of the file, may be required to render
 * @param {Function} [onFile] - Called when the file has started downloading
 */
Client.prototype.add = function add() {
  /* TODO */
};

/**
 * Remove a file from the client. This will close all active connections for
 * the file and will delete all saved data for the file.
 * @param {String} opts.bucketId
 * @param {String} opts.file - Name of the file to remove
 */
Client.prototype.remove = function remove() {
  /* TODO */
};

/**
 * Destroy the client, including all tracked files and connections.
 * @param {Function} cb - Called once the client has gracefully shutdown
 */
Client.prototype.destroy = function destroy() {
};

module.exports = Client;
