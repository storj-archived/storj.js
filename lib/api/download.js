/**
  * @module storj/get-file
  * @license LGPL-3.0
  */

'use strict';

var DeterministicKeyIv =
  require('storj-lib/lib/crypto-tools/deterministic-key-iv');
var DecryptStream = require('storj-lib/lib/crypto-tools/decrypt-stream.js');
var crypto = require('crypto');
var stream = require('stream');

module.exports = function download(bucketId, fileId) {
  var self = this;
  var result = new stream.Readable();
  result._read = function() {};

  self.getFilePointers(bucketId, fileId, function(e, p) {
    if(e) {
      return result.emit('error', e);
    }

    // Determine the key for decrypting the file
    if(p.token.encryptionKey !== '') {
      // If we are uploading to a public bucket, use it's encryption key
      var key = DeterministicKeyIv.getDeterministicKey(
        p.token.encryptionKey, f.id);
    } else if(!self._mnemonic) {
      // Require a mnemonic if we are working on a private bucket
      return f.emit('error', new Error('This bucket requires a memonic'));
    } else {
      var bucketKey = DeterministicKeyIv.getDeterministicKey(
        self._mnemonic.toSeed(),
        Buffer.from(bucketId, 'hex')
      );

      var key = DeterministicKeyIv.getDeterministicKey(
        Buffer.from(bucketKey, 'hex'),
        Buffer.from(fileId, 'hex')
      );
    }

    var secret = new DeterministicKeyIv(key, fileId);

    self._client.resolveFileFromPointers(p.pointers, function resolve(e, file) {
      if(e) {
        return result.emit('error', e);
      }

      var decrypter = new DecryptStream(secret);

      // Begin streaming
      file.pipe(decrypter).on('data', function(d) {
        result.push(d);
      }).on('end', function(d) {
        result.push(null);
      });
    });
  });

  return result;
};
