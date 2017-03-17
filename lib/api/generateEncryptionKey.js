'use strict';

var Mnemonic = require('bitcore-mnemonic')

module.exports = function generateEncryptionKey() {
  // Don't expose the Mnemonic object to the end user, they only need to keep
  // track of the string and we can derive the object.
  return (new Mnemonic(Mnemonic.Words.ENGLISH)).toString();
}
