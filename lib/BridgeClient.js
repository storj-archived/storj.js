Storj.BridgeClient = function(){
  var self = this;
  var config = Storj.Config;
  var utils = Storj.Utils;

  self.createToken = function(bucket, operation, file, callback){
    utils.request({
      method: 'POST',
      url: config.bridge + '/buckets/' + bucket + '/tokens',
      responseType: 'json',
      data: JSON.stringify({ operation: operation, file: file }),
    }, callback);
  };

  /**
    * options.bucket
    * options.file
    * options.token
    * options.skip
    * options.limit
    * options.exclude
    */
  self.getFilePointers = function(options, callback) {
    var self = this;

    utils.request({
      method: 'GET',
      url: config.bridge + '/buckets/' + options.bucket + '/files/' + options.file,
      responseType: 'json',
      headers: {
        'x-token': options.token
      },
      qs: {
        skip: options.skip,
        limit: options.limit,
        exclude: Array.isArray(options.exclude) ? options.exclude.join() : null
      }
    }, callback);

  };

};