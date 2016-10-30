Storj.Downloader = function(options, callback){
  var utils = Storj.Utils;

  this.bucketId = utils.calculateBucketId(options.user, options.bucket);
  this.fileId = utils.calculateFileId(this.bucketId, options.file);

  this.client = new Storj.BridgeClient();

  this.load(callback);

};

Storj.Downloader.prototype.load = function(callback){
  var self = this;

  self.client.createToken(self.bucketId, 'PULL', function(err, token){
    callback(err, token);
  });

};