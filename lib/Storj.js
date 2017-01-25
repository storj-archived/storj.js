/**
 * @module storj/storj
 * @license LGPL-3.0
 */
'use strict';
var EventEmitter = require('events').EventEmitter;
var assert = require('assert');
var calculateFileId = require('storj-lib/lib/utils.js').calculateFileId;
var KeyIV = require('storj-lib/lib/crypto-tools/deterministic-key-iv.js');
var EncryptStream = require('storj-lib/lib/crypto-tools/encrypt-stream.js');
var Client = require('storj-lib/lib/bridge-client');
var crypto = require('crypto');
var storjutils = require('storj-lib/lib/utils.js');
var sha256 = require('storj-lib/lib/utils').sha256;
var store = require('memory-blob-store');
var util = require('util');
var crypt = require('crypto');

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
  this._store = opts.store || store;
  this._client = new Client(this._bridge, 
    {    
      basicAuth: {
        email: 'email',
        password: 'pass'
      },
      store: this._store
    });

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
Storj.prototype.createFile = function(bucketId, fileName, opts, cb) {
  var self = this;

  if(opts.body.readable) {
    var fstream = opts.body;
  }
  // assume single file, file is a stream, public bucket, and no auth assumption
  // bucket ID, operation, cb
  self._client.createToken(bucketId, 'PULL', function(err, token) {
    if (err) {
      return err;
    };
    
    var fileId = calculateFileId(bucketId, fileName);
    var fileKey = KeyIV.getDeterministicKey(token.encryptionKey, fileId);
    var secret = KeyIV(fileKey, fileId);
    var encrypter = new EncryptStream(secret);
    var tmpName = crypto.randomBytes(8).toString('hex');

    self._meta = {
      secret: secret,
      encrypter: encrypter,
      token: token,
      tmpName: tmpName,
      bucketId: bucketId
    }

    var storeStream = memStore.createWriteStream(tmpName)
    fstream.pipe(self._meta.encrypter).pipe(storeStream);
    fstream.on('error', self.emit.bind(this, 'error'))
    fstream.on('end', function () {
      console.log('encrypt stream finished')
      storeStream.end('done', ()=> {
        console.log('store write stream finished')
        self._storeFileInBucket(function(err, res) {
          console.log(err)
          console.log(res)
        })
      });
    });
  });
};

Storj.prototype._storeFileInBucket = function() {
  var rs = this_store.createReadStream(this._meta.tmpName);
  this._client.storeFileInBucket(this._meta.bucketId, this._meta.token, rs, function(err, file) {
    if (err) {
      return err;
    }

    return file;
  });
}

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
Storj.getFiles = function(bucketId) {
  console.log('Listing files in bucket ', bucketId);
  
  client.listFilesInBucket(bucketId, function(err, files) {
    console.log(files)
  });
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

// Export the File class
module.exports = Storj;
