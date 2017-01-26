/**
 * @module storj/storj
 * @license LGPL-3.0
 */
'use strict';
var EventEmitter = require('events').EventEmitter;
var fileReaderStream = require('filereader-stream');
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
// var crypt = require('crypto');
// var mbs = require('memory-blob-store');

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
  this._store = opts.store || new store();
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
Storj.createFile = function(bucket, fileName, opts, cb) {
  var files = [];
  var first = files[0];

  // assume single file, public bucket, and no auth assumption
  // bucket ID, operation, cb
  client.createToken(bucket, 'PULL', function(err, token) {
    if (err) {
      return err;
    };

    var fileId = calculateFileId(bucket, fileName);
    var fileKey = KeyIV.getDeterministicKey(token.encryptionKey, fileId);
    var secret = KeyIV(fileKey, fileId);
    var encrypter = new EncryptStream(secret);
    var tmpName = crypto.randomBytes(8).toString('hex');

    self._meta = {
      secret: secret,
<<<<<<< HEAD
      encrypter: encrypter
=======
      encrypter: encrypter,
      token: token,
      fileName: fileName[0].name,
      fileSize: fileName[0].size,
      tmpName: tmpName,
      bucketId: bucketId
>>>>>>> 9531444425a15d15dadd7068d4b1ad6643ae82a9
    }

    var storeStream = self._store.createWriteStream(tmpName)
    fstream.pipe(self._meta.encrypter).pipe(storeStream);
    fstream.on('error', self.emit.bind(this, 'error'))
    fstream.on('end', function () {
      storeStream.end('done', ()=> {
        console.log('store write stream finished')
        self._storeFileInBucket(function(err, res) {
          if(err) {
            self.emit.bind(this, err)
            cb(err, null)
          }
          cb(null, res)
        })
      });
    });
  });
};

Storj.prototype._storeFileInBucket = function(cb) {
  var rs = this._store.createReadStream(this._meta.tmpName);

  var options = {
    bucketId: this._meta.bucketId,
    token: this._meta.token,
    fileName: this._meta.fileName,
    fileSize: this._meta.fileSize,
    stream: rs
  }
  
  this._client.storeFileInBucket(options, function(err, file) {
    if (err) {
      cb(err);
    }
    cb(null,file);
  });
};

/**
 * Download a file from the Storj bridge
 * @prop {String} BucketId
 * @prop {String} FileId
 * @prop {Function} - Invoked when the file has been downloaded or when an
 * errors occurs
 */
Storj.getFile = function(bucketId, fileName) {
  client.listFilesInBucket(bucketId, function(err, files) {
    console.log(files);
  })
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
Storj.deleteFile = function(bucketId, fileId, callback) {
  client.removeFileFromBucket(bucketId, fileId, function(){
    console.log(fileId, ' deleted.');
    callback
  });
};
