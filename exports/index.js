'use strict'

Storj.Exports = {};

Storj.Exports.createHash = require('create-hash');

var hashes = ['sha1', 'sha224', 'sha256', 'sha384', 'sha512', 'md5', 'rmd160'].concat(Object.keys(require('browserify-sign/algos')))
Storj.Exports.getHashes = function () {
  return hashes
}

var p = require('pbkdf2')
Storj.Exports.pbkdf2 = p.pbkdf2
Storj.Exports.pbkdf2Sync = p.pbkdf2Sync