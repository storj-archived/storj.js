'use strict';

var DeterministicKeyIv =
  require('storj-lib/lib/crypto-tools/deterministic-key-iv');
var DecryptStream = require('storj-lib/lib/crypto-tools/decrypt-stream.js');
var crypto = require('crypto');

module.exports = function getFile(bucketId, fileId, cb) {
  var self = this;
  var f = new self.File();
  f.id = fileId;
  f.progress = 0;
  // Allow the file to access it's own data from the persistant store
  f._store = self._store;

  // Register cb to done
  f.on('done', cb);

  self.getFilePointers(bucketId, fileId, function(e, p) {
    if(e) {
      return f.emit('error', e);
    }

    f.mimetype = p.token.mimetype;

    // Determine the key for decrypting the file
    if(p.token.encryptionKey !== '') {
      // If we are uploading to a public bucket, use it's encryption key
      f.key = DeterministicKeyIv.getDeterministicKey(
        p.token.encryptionKey, f.id);
    } else if(!self._encryptionKey) {
      // Require an encryption key if we are working on a private bucket
      return f.emit('error', new Error('Bucket requires an encryption key'));
    } else {
      var bucketKey = DeterministicKeyIv.getDeterministicKey(
        self._encryptionKey.toSeed(),
        Buffer.from(bucketId, 'hex')
      );

      f.key = DeterministicKeyIv.getDeterministicKey(
        Buffer.from(bucketKey, 'hex'),
        Buffer.from(f.id, 'hex')
      );
    }

    f.secret = new DeterministicKeyIv(f.key, f.id);

    // Compute the total size of the file encrypted
    f.size = p.pointers.reduce((p, c) => p += c.size, 0);
    f.downloaded = 0;

    // Track the size of the unencrypted file
    f._size = 0;

    self._client.resolveFileFromPointers(p.pointers, function resolve(e, file) {
      var decrypter = new DecryptStream(f.secret);

      f._storeKey = crypto.randomBytes(12).toString('hex');
      var storeStream = self._store.createWriteStream(f._storeKey);

      // Handle stream errors
      file.on('error', f.emit.bind(f, 'error'));
      storeStream.on('error', f.emit.bind(f, 'error'));

      // Track download progress
      file.on('data', function(d) {
        f.downloaded += d.length;
        f.progress = f.downloaded / f.size;
      });

      decrypter.on('data', function(d) {
        f._size += d.length;
      });

      storeStream.on('finish', function() {
        // Update size to reflect decrypted file
        f.size = f._size;
        f.emit('done');
      });

      // We now have a stream of the file coming across the network
      f.emit('ready');

      // Begin streaming
      file.pipe(decrypter).pipe(storeStream);
    });
  });

  return f;
}
