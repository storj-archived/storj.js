'use strict';

var DeterministicKeyIv =
  require('storj-lib/lib/crypto-tools/deterministic-key-iv');

module.exports = function makePublic(bucketId, permissions, cb) {
  if (!this._mnemonic) {
    return cb(new Error('makePublic requires a mnemonic.'));
  }
  var bucketKey = DeterministicKeyIv.getDeterministicKey(
    this._mnemonic.toSeed(),
    Buffer.from(bucketId, 'hex')
  );

  permissions = permissions.map((v) => v.toUpperCase())
  for (var i=0; i < permissions.length; i++) {
    if (permissions[i] !== 'PULL' && permissions[i] !== 'PUSH') {
      return cb(new Error(`Invalid value ${permissions[i]} for makePublic`));
    }
  }

  return this._client.updateBucketById(bucketId, {
    publicPermissions: permissions,
    encryptionKey: bucketKey
  }, cb);
};
