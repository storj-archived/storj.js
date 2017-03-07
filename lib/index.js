'use strict'

// Use bridge client for now
var Client = require('storj-lib/lib/bridge-client');
var KeyPair = require('storj-lib/lib/crypto-tools/keypair.js');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var assert = require('assert');
var api = require('./api');
var file = require('./file.js');
var KeyPair = require('storj-lib/lib/crypto-tools/keypair.js');

/**
 * Creates a new Storj object for interacting with the Storj network
 * @constructor
 * @param {Object} [opts] - control the behaviour of the Storj object
 * @param {String} [opts.bridge=https://api.storj.io] - API base url
 * @param {String} [opts.protocol=http] - Protocol for downloading shards
 * @param {Object} [opts.store] - used to persist state, defaults to fs on the
 * server and memory in the browser
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
  // In Node.js, DEFAULTS.store will be null, in the browser it will be a
  // memory-blob-store
  this._store = opts.store || Storj.DEFAULTS.store;
  this._basicAuth = opts.basicAuth;

  if(opts.key) {
    this._key = new KeyPair(opts.key);
  }

  this._protocol = opts.protocol || Storj.DEFAULTS.protocol;

  setupAlias(this);
  initInputs(this);
}

Storj.DEFAULTS = {
  bridge: 'https://api.storj.io',
  protocol: 'http'
};

function setupAlias(self) {
  var methods = Object.keys(api)

  // Expose all of our api methods off of our newly created object
  for(let i = 0; i < methods.length; i++) {
    self[methods[i]] = api[methods[i]]
  }
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
  if(self._store) {
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
  }
  
  switch(self) {
    case self._basicAuth:
      return initBasicAuth(self);
    case self._key:
      return initKey(self);
    default:
      self._client = new Client(self._bridge, {
        store: self._store
      });
  }
}

function initBasicAuth(self) {
  // Create a new client using basic auth allowing us to talk to the bridge
  self._client = new Client(self._bridge, {
    basicAuth: self._basicAuth,
    store: self._store
  });

  // If not provided a store, use our created client's default
  self._store = self._client._store;

  return setImmediate(self.emit.bind(self), 'ready');
}

function initKey(self) {
  self._client = new Client(self._bridge, {
    keyPair: self._key,
    store: self._store
  });

  return setImmediate(self.emit.bind(self), 'ready');
}

// Storj emits events
util.inherits(Storj, EventEmitter);

module.exports = Storj;
