'use strict';
var request = require('request');
var qs = require('querystring');
var bc = require('storj-lib/lib/bridge-client');

function BridgeClient(opts) {
  if(!(this instanceof BridgeClient)) {
    return new BridgeClient(opts);
  }

  this.bridge = opts.bridge;
  this.bc = new bc(this.bridge);

  return this;
}

BridgeClient.prototype.createToken = function(bucket, file, cb) {
  var self = this;
  request({
    method: 'POST',
    url: `${self.bridge}/buckets/${bucket}/tokens`,
    json: true,
    body: {
      operation: 'PULL',
      file: file
    }
  }, function (e, res, body) {
    return cb(e, body);
  });
};

BridgeClient.prototype.getFilePointers = function(opts, cb) {
  var self = this;
  var query = qs.stringify({
    skip: opts.skip,
    limit: opts.limit,
    exclude: opts.exclude
  });
  var url =
    `${self.bridge}/buckets/${opts.bucket}/files/${opts.file}?${query}`;
  request({
    method: 'GET',
    url: url,
    json: true,
    headers: {
      'x-token': opts.token
    },
  }, function(e, res, body) {
    return cb(e, body);
  });
};

BridgeClient.prototype.resolveFileFromPointers = function(pointers, mOpts, cb) {
  this.bc.resolveFileFromPointers(pointers, mOpts, cb);
};

module.exports = BridgeClient;
