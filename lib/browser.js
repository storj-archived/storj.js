'use strict';

require('setimmediate')

const Storj = require('./core');
Storj.DEFAULTS.store = require('memory-blob-store');

exports = module.exports = Storj
