'use strict'

var file = require('./file.js');
var bucket = require('./bucket.js');
//var Client = require('./Client.js');
// Use bridge client for now
var Client = require('storj-lib/lib/bridge-client');

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var assert = require('assert');
var store = require('memory-blob-store');

/**
 * Creates a new Storj object for interacting with the Storj network
 * @constructor
 * @param {Object} [opts] - control the behaviour of the Storj object
 * @param {String} [opts.bridge=https://api.storj.io] - API base url
 * @param {Object} [opts.store] - The abstract-blob-store to use for persisting
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
  assert(typeof opts === 'object', 'Storj must be an object');

  this._bridge = opts.bridge;
  this._store = opts.store || new store();
  this._basicAuth = opts.basicAuth;
  this._client = new Client(this._bridge,
    {    
      basicAuth: this._basicAuth,
      store: this._store
    });
  
  // core components 
  this.file = file(this);
  this.bucket = bucket(this);
  this.createBucket = this.bucket.createBucket; // alias for createBucket
  this.deleteBucket = this.bucket.deleteBucket; // alias for deleteBucket
  this.createFile = this.file.createFile; // alias for createFile
  this.getFile = this.file.getFile; // alias for getFile

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

module.exports = Storj;
