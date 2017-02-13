'use strict';

require('setimmediate')

self.Storj = require('./core');
self.Storj.DEFAULTS.store = new (require('memory-blob-store'))();

module.exports = self.Storj;
