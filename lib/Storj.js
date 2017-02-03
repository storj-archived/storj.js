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
var store = require('memory-blob-store');
var util = require('util');

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
  // assume single file, file is a stream, public bucket, and basic http auth
  // bucket ID, operation, cb
  self._client.createToken(bucketId, 'PULL', function(err, token) {
    if (err) {
      return err;
    };

    var fileId = calculateFileId(bucketId, fileName);
    var fileKey = KeyIV.getDeterministicKey(token.encryptionKey, fileId);
    var secret = KeyIV(fileKey, fileId);
    var encrypter = new EncryptStream(secret);
    var tmpName = crypto.randomBytes(6).toString('hex');

    self._meta = {
      secret: secret,
      encrypter: encrypter,
      token: token,
      fileName: fileName[0].name,
      fileSize: fileName[0].size,
      tmpName: tmpName,
      bucketId: bucketId
    }

    var storeStream = self._store.createWriteStream(tmpName);

    fstream.pipe(self._meta.encrypter).pipe(storeStream);
    fstream.on('error', self.emit.bind(this, 'error'));

    self._meta.encrypter.on('end', () => {
      storeStream.end()
    });

    storeStream.on('finish', ()=> {
      self._storeFileInBucket(function(err, res) {
        if(err) {
          self.emit.bind(this, err)
          cb(err, null)
        }
        cb(null, res)
      });
    });
  });
};

Storj.prototype._storeFileInBucket = function(cb) {
  var rs = this._store.createReadStream(this._meta.tmpName);
  var options = {
    fileName: this._meta.fileName,
    tmpName: this._meta.tmpName,
    fileSize: this._meta.fileSize
  }

  this._client.storeFileInBucket(
    this._meta.bucketId,
    this._meta.token,
    rs,
    options,
    function(err, file) {
      if (err) {
        cb(err);
      }
      cb(null,file);
    }
  );
}

/**
 * Download a file from the Storj bridge
 * @prop {String} BucketId
 * @prop {String} FileId
 * @prop {Function} cb - Invoked when the file has been downloaded or when an
 * errors occurs
 */
Storj.prototype.getFile = function(bucketId, fileId) {
  this._client.getFileInfo(bucketId, fileId, function(){
  });
};

/**
 * Get a list of all files in a bucket, returning a set of pointers to files
 * but not the contents, to fetch the contents call `.download()` on the
 * pointer
 * @prop {String} - BucketId
 * @prop {Function} - Invoked when the file pointers have been fetched  or when
 * an error occurs
 */
Storj.prototype.getFiles = function(bucketId) {
  this._client.listFilesInBucket(bucketId, function(err, files) {
    return files;
  });
};

/**
 * Remove a file from the bridge
 * @prop {String} - BucketId
 * @prop {String} - FileId
 * @prop {Function} - Invoked when the file has been removed or when an error
 * occurs
 */
Storj.prototype.deleteFile = function(bucketId, fileId, cb) {
  this._client.removeFileFromBucket(bucketId, fileId, function(){
    console.log(fileId, ' deleted.');
    cb();
  });
};

// Export the File class
module.exports = Storj;
