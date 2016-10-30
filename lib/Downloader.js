Storj.Downloader = function(options){
  var utils = Storj.Utils;

  this.bucketId = utils.calculateBucketId(options.user, options.bucket);
  this.fileId = utils.calculateFileId(this.bucketId, options.file);

};

Storj.Downloader.prototype.load = function(callback){
  var self = this;

  client.createToken(self.bucketId, 'PULL', function(err, token){
    callback(err, token);
  });

};