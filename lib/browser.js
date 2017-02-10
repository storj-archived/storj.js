'use strict';

require('setimmediate')

self.Storj = require('./core');
Storj.DEFAULTS.store = require('memory-blob-store');
