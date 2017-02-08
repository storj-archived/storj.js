'use strict'

// Use bridge client for now
var Client = require('storj-lib/lib/bridge-client');
var KeyPair = require('storj-lib/lib/crypto-tools/keypair.js');

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

  /*
  this._client = new Client(this._bridge,
    {
      basicAuth: this._basicAuth,
      store: this._store
    });
  */

  this._protocol = opts.protocol || Storj.DEFAULTS.protocol;

  this.setupAlias();
  this.initInputs();
}

Storj.DEFAULTS = {
  bridge: 'https://api.storj.io',
  protocol: 'http'
};

Storj.prototype.setupAlias = function() {
  this.bucket = api.bucket(this);
  this.createBucket = this.bucket.createBucket; // alias for createBucket
  this.deleteBucket = this.bucket.deleteBucket; // alias for deleteBucket
  this.getBuckets = this.bucket.getBuckets; // alias for getBuckets
  this.getBucket = this.bucket.getBucket; // alias for getBucket
  this.createFile = api.createFile(this);
  this.getFile = api.getFile(this);
  this.createFileToken = api.createFileToken(this);
  this.getFilePointers = api.getFilePointers(this);
  this.initStore = api.initStore(this);
  this.File = new file(this);
}

/**
 * Call initInputs after the constructor has finished setting all of it's
 * properties based on user input. initInputs will take the fresh Storj object
 * and do any validation and async maintenance necessary. Validation causes
 * this function to throw an Error. Async setup causes this function to emit
 * events on the new Storj object.
 */
Storj.prototype.initInputs = function() {
  assert(typeof this._bridge === 'string', 'Expect bridge to be a string');
  assert(typeof this._store === 'object',
    'Expect store to be an implementation of abstract-blob-store');
  assert(typeof this._store.createReadStream === 'function',
    'Expect store to be an implementation of abstract-blob-store');
  assert(typeof this._store.createWriteStream === 'function',
    'Expect store to be an implementation of abstract-blob-store');
  assert(typeof this._store.exists === 'function',
    'Expect store to be an implementation of abstract-blob-store');
  assert(typeof this._store.remove === 'function',
    'Expect store to be an implementation of abstract-blob-store');

  if(this._basicAuth) {
    return this.initBasicAuth();
  }

  return this.initKey();
}

Storj.prototype.initBasicAuth = function initBasicAuth() {
  var self = this;
  // Create a new client using basic auth allowing us to talk to the bridge
  self._client = new Client(self._bridge, {
    basicAuth: self._basicAuth,
    store: self._store
  });

  // Create a new private/public key pair
  var key = new KeyPair();

  self._client.addPublicKey(key.getPublicKey(), function(e) {
    if(e) {
      return self.emit('error', e);
    }
    self._key = key;
    self.initKey();
  });
}

Storj.prototype.initKey = function initKey() {
  return setImmediate(this.emit.bind(this), 'ready');
}

// Storj emits events
util.inherits(Storj, EventEmitter);

module.exports = Storj;
