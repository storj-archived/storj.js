'use strict'

// Use bridge client for now
var Client = require('storj-lib/lib/bridge-client');

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var assert = require('assert');
var store = require('memory-blob-store');
var api = require('./api');
var file = require('./file.js');

/**
 * Creates a new Storj object for interacting with the Storj network
 * @constructor
 * @param {Object} [opts] - control the behaviour of the Storj object
 * @param {String} [opts.bridge=https://api.storj.io] - API base url
 * @param {String} [opts.protocol=http] - Protocol for downloading shards
 * @param {Object} [opts.store] - Currently only memory-blob-store supported
 * state for this object, defaults to fs on the server and memory in the browser
 * @param {String} [opts.key] - The private key that will be used to interact
 * @param {Object} [opts.basicAuth] - basic authentication strategy
 * with the server when needed for authenticated actions, this can either be
 * a key for the blobstore, a filesystem path, or the plaintext key.
 */
function Storj(opts) {
  if(!(this instanceof Storj)) {
    return new Storj(opts);
  }

  opts = opts || {}
  assert(typeof opts === 'object', 'opts must be an object');

  this._bridge = opts.bridge || Storj.DEFAULTS.bridge;
  this._store = opts.store || new store();
  this._basicAuth = opts.basicAuth;
  this._key = opts.key;
  this._protocol = opts.protocol || Storj.DEFAULTS.protocol;

  setupAlias(this);
  initInputs(this);
  //initFile(this);
}

Storj.DEFAULTS = {
  bridge: 'https://api.storj.io',
  protocol: 'http'
};

function setupAlias(self) {
  self.bucket = api.bucket(self);
  self.createBucket = self.bucket.createBucket; // alias for createBucket
  self.deleteBucket = self.bucket.deleteBucket; // alias for deleteBucket
  self.getBuckets = self.bucket.getBuckets; // alias for getBuckets
  self.getBucket = self.bucket.getBucket; // alias for getBucket
  self.createFile = api.createFile(self);
  self.getFile = api.getFile(self);
  self.createFileToken = api.createFileToken(self);
  self.getFilePointers = api.getFilePointers(self);
  self.resolveFileFromPointers = api.resolveFileFromPointers(self);
  self.initStore = api.initStore(self);
  self.getKeypair = api.getKeypair(self);
  self.registerKey = api.registerKey(self);
  self.File = file;
}

/**
 * Call initInputs after the constructor has finished setting all of it's
 * properties based on user input. initInputs will take the fresh Storj object
 * and do any validation and async maintenance necessary. Validation causes
 * this function to throw an Error. Async setup causes this function to emit
 * events on the new Storj object.
 */
function initInputs(self) {
  assert(typeof self._bridge === 'string', 'Expect bridge to be a string');
  assert(typeof self._store === 'object',
    'Expect store to be an implementation of abstract-blob-store');
  assert(typeof self._store.createReadStream === 'function',
    'Expect store to be an implementation of abstract-blob-store');
  assert(typeof self._store.createWriteStream === 'function',
    'Expect store to be an implementation of abstract-blob-store');
  assert(typeof self._store.exists === 'function',
    'Expect store to be an implementation of abstract-blob-store');
  assert(typeof self._store.remove === 'function',
    'Expect store to be an implementation of abstract-blob-store');

  if(self._basicAuth) {
    return initBasicAuth(self);
  }

  return initKey(self);
}

function initBasicAuth(self) {
  // Create a new client using basic auth allowing us to talk to the bridge
  self._client = new Client(self._bridge, {
    basicAuth: self._basicAuth,
    store: self._store
  });
  return setImmediate(self.emit.bind(self), 'ready');
}

function initKey(self) {
  return setImmediate(self.emit.bind(self), 'ready');
}

function initFile(self) {
  return new file(self);
}

// Storj emits events
util.inherits(Storj, EventEmitter);

module.exports = Storj;
