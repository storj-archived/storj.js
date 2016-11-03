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

Storj.Utils.pbkdf2Sync = Storj.Exports.pbkdf2Sync;

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

Storj.Utils.createDecryptor = function(bucketKey, fileId) {
  var utils = Storj.Utils;
  var exports = Storj.Exports;
  var fileKey = utils.rmd160sha256(bucketKey + fileId);

  var hashedKey = utils.sha256(fileKey);
  var hashedSalt = utils.rmd160(fileId);

  return exports.createDecipheriv(
    'aes-256-ctr',
    new exports.Buffer(hashedKey, 'hex'),
    new exports.Buffer(hashedSalt, 'hex').slice(0, 16)
  );
};

Storj.Utils.decryptBlob = function(blob, decipher, callback) {
  var exports = Storj.Exports;

  var fileReader = new FileReader();
  fileReader.onload = function() {
    var encrypted = this.result;
    var buffer = exports.Buffer(encrypted, 'binary');
    decipher.write(buffer);
    callback(null, decipher.read());
  };
  fileReader.readAsBinaryString(blob);
};

/**
  * options.method
  * options.url
  * options.responseType
  * options.data
  * options.callback
  */
Storj.Utils.request = function(options, callback) {
  var method = options.method;
  var url = options.url;
  var responseType = options.responseType;
  var data = options.data;
  var headers = options.headers ? options.headers : {};
  var qs = options.qs ? options.qs : {};

  var _serialize = function(obj) {
    var str = [];
    for(var p in obj){
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
      }
    }
    return '?' + str.join('&');
  }

  var request = new XMLHttpRequest();
  url += _serialize(qs);
  request.open( method, url, true );
  request.responseType = responseType;
  request.setRequestHeader( 'Content-Type', 'application/json' );
  for(var type in headers){
    request.setRequestHeader(type, headers[type]);
  }

  request.addEventListener( 'load', function ( event ) {
    var response = event.target.response;
    if(response && response.err) {
      return callback('Could not load asset') 
    }
    callback( null, response );
  });

  request.addEventListener( 'error', function( err ){
    console.log('asdf', err);
    callback('Could not load asset');
  });

  request.send(data);

};