Storj.Utils = {};

Storj.Utils.sha256 = function(input) {
  return Storj.Exports.sha256(input);
};

Storj.Utils.rmd160 = function(input, encoding) {
  return new Storj.Exports.rmd160().update(input, encoding).digest('hex');
};

Storj.Utils.rmd160sha256 = function(input) {
  return Storj.Utils.rmd160(
    Storj.Utils.sha256(input), 'hex'
  );
};

Storj.Utils.calculateBucketId = function(user, bucketName) {
  var rmd160sha256 = Storj.Utils.rmd160sha256;
  var hash = rmd160sha256(user + bucketName);
  return hash.substring(0, 24);
};

Storj.Utils.calculateFileId = function(bucket, fileName) {
  var rmd160sha256 = Storj.Utils.rmd160sha256;
  var hash = rmd160sha256(bucket + fileName);
  return hash.substring(0, 24);
};

Storj.Utils.calculateFileIdByName = function(user, bucketName, fileName) {
  var bucket = Storj.Utils.calculateBucketId(user, bucketName);
  var hash = Storj.Utils.calculateFileId(bucket, fileName);
  return hash;
};

/**
  * options.type
  * options.url
  * options.responseType
  * options.data
  * options.callback
  */
Storj.Utils.request = function(options) {
  var type = options.type;
  var url = options.url;
  var responseType = options.responseType;
  var data = options.data;
  var callback = options.callback;

  var request = new XMLHttpRequest();
  request.open( type, url, true );
  request.responseType = responseType;
  request.setRequestHeader( 'Content-Type', 'application/json' );

  request.addEventListener( 'load', function ( event ) {
    var response = event.target.response;
    if (response.err) {
      return callback('Could not load asset') 
    }
    callback( null, response );
  });

  request.addEventListener( 'error', function( err ){
    callback('Could not load asset');
  });

  request.send(data);

};