'use strict'

// Use bridge client for now
var Mnemonic = require('bitcore-mnemonic')
var Client = require('storj-lib/lib/bridge-client');
var KeyPair = require('storj-lib/lib/crypto-tools/keypair.js');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var assert = require('assert');
var api = require('./api');
var File = require('./file.js');

/**
 * Creates a new Storj object for interacting with the Storj network
 * @constructor
 * @param {Object} [opts] - control the behaviour of the Storj object
 * @param {String} [opts.bridge=https://api.storj.io] - API base url
 * @param {String} [opts.protocol=http] - Protocol for downloading shards
 * @param {Object} [opts.store] - used to persist state, defaults to fs on the
 * server and memory in the browser
 * @param {String} [opts.key] - The private key that will be used to interact
 *  with the bridge
 * @param {Object} [opts.memonic] - Plaintext memonic used with private key
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

  initOpts(this, opts);
  setupAlias(this);
  initInputs(this);
}

Storj.DEFAULTS = {
  bridge: 'https://api.storj.io',
  protocol: 'http'
};

Storj.File = File;

Storj.generateMnemonic = api.generateMnemonic;

function initOpts(self, opts) {
  self._bridge = opts.bridge || Storj.DEFAULTS.bridge;

  // In Node.js, DEFAULTS.store will be null, in the browser it will be a
  // memory-blob-store
  self._store = opts.store || Storj.DEFAULTS.store;
  self._basicAuth = opts.basicAuth;

  if(typeof opts.key === 'string') {
    self._key = new KeyPair(opts.key);
  }

  if(opts.mnemonic) {
    self._mnemonic = new Mnemonic(opts.mnemonic);
  }

  self._protocol = opts.protocol || Storj.DEFAULTS.protocol;
}


function setupAlias(self) {
  var methods = Object.keys(api)

  // Expose all of our api methods off of our newly created object
  for(let i = 0; i < methods.length; i++) {
    self[methods[i]] = api[methods[i]]
  }

  self.File = File;
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

  if(self._mnmemonic) {
    assert(typeof self._mnemonic === 'string', 'Expext memonic to be a string');
  }

  self._client = new Client(self._bridge, {
    basicAuth: self._basicAuth,
    store: self._store,
    keyPair: self._key
  });

  self._store = self._client._store;
  return setImmediate(self.emit.bind(self), 'ready');
}

// Storj emits events
util.inherits(Storj, EventEmitter);

module.exports = Storj;
