Storj.BridgeClient = function(){
  var self = this;
  var config = Storj.Config;
  var utils = Storj.Utils;

  self.createToken = function(bucket, operation, callback){
    utils.request({
      type: 'POST',
      url: config.bridge + '/buckets/' + bucket + '/tokens',
      responseType: 'json',
      data: JSON.stringify({ operation: operation }),
      callback: callback
    })
  };

};