Storj.Downloader = function(options, callback){
  var self = this;
  var utils = Storj.Utils;

  if (options.bucketId) {
    self.bucketId = options.bucketId;
  } else {
    self.bucketId = utils.calculateBucketId(options.user, options.bucket);
  }

  if (options.fileId) {
    self.fileId = options.fileId;
  } else {
    self.fileId = utils.calculateFileId(self.bucketId, options.file);
  }

  self.maxConcurrent = 6;
  self.client = new Storj.BridgeClient();
  self.callback = callback;
  self.stream = options.stream ? options.stream : function(){};
  self.skip = 0;
  self.limit = null;
  self.fileData = [];
  self._createToken();
};

Storj.Downloader.prototype._createToken = function(){
  console.log('create token');
  var self = this;
  var client = self.client;

  client.createToken(self.bucketId, 'PULL', function(err, token){
    self.token = token;
    self._createDecipher();
  });
};

Storj.Downloader.prototype._createDecipher = function(){
  var self = this;
  var utils = Storj.Utils;

  var bucketKey = self.token.encryptionKey;
  var fileId = self.fileId;

  self.decipher = utils.createDecryptor(bucketKey, fileId);

  var decrypted = [];

  self.decipher.on('readable', function(){
    var data = self.decipher.read();
    if (data) {
      self.stream(null, data);
      decrypted.push(data);
    }
  });

  self.decipher.on('end', function(){
    self.callback(null, new Blob(decrypted));
  });

  self._getPointers();
};

Storj.Downloader.prototype._getPointers = function(){
  var self = this;
  var utils = Storj.Utils;
  var client = self.client;

  var options = {
    bucket: self.bucketId,
    file: self.fileId,
    token: self.token.token,
    skip: self.skip,
    limit: self.limit,
    exclude: []
  };

  client.getFilePointers(options, function(err, pointers){
    self._resolvePointers(pointers);
  });

};

Storj.Downloader.prototype._resolvePointers = function(pointers){
  console.log('resolve pointers');
  var self = this;
  var numPointers = pointers.length;
  var numStarted =  Math.min( numPointers, self.maxConcurrent );
  var completedPointers = 0;
  var decryptionIndex = 0;

  var _finishDecryption = function(){
    decryptionIndex += 1;
    if( numPointers == decryptionIndex ){
      self.decipher.end();
    }
  }

  var decrypting = false;
  var _checkDecryption = function(){
    console.log('checkDecryption', decryptionIndex);
    if( decryptionIndex == 0 ) return;
    if( decrypting ) return;
    var nextBlob = self.fileData[ decryptionIndex ];
    if( nextBlob ){
      decrypting = true;
      self._decryptBlob( new Blob( nextBlob ), function(){
        decrypting = false;
        _finishDecryption();
        _checkDecryption();
      });
    }
  };

  var _finishPointer = function(){
    completedPointers += 1;
    _checkDecryption();
    if( completedPointers < numPointers ){
      var nextPointerIndex = completedPointers + self.maxConcurrent - 1;
      var nextPointer = pointers[nextPointerIndex];
      if( nextPointer ){
        _resolvePointer(nextPointer, nextPointerIndex);
      }
    }
  };

  var _resolvePointer = function(pointer, index){
    var farmer = pointer.farmer;
    var blobs = [];
    var currentSize = 0;
    var totalSize = pointer.size;
    var options = {
      url: 'ws://' + farmer.address + ':' + farmer.port,
      onOpen: function(){
        socket.send(JSON.stringify({
          token: pointer.token,
          hash: pointer.hash,
          operation: 'PULL'
        }));
      },
      onData: function(msg){
        if( index == 0 ){
          self._decryptBlob(msg.data);
        }
        blobs.push(msg.data);
        currentSize += msg.data.size;
        console.log('shard: ', index, (100 * currentSize / totalSize) + '%');
        if( currentSize == totalSize ){
          socket.close();
          if( index == 0 ){
            _finishDecryption();
          }
          self.fileData[index] = blobs;
          _finishPointer();
        }
      }
    };
    var socket = new Storj.Socket( options );
  };

  for(var i = 0; i < numStarted; i++){
    _resolvePointer(pointers[i], i);
  }
};

Storj.Downloader.prototype._decryptBlob = function(blob, callback) {
  var self = this;
  var exports = Storj.Exports;
  var decipher = self.decipher;
  callback = callback ? callback : function(){};

  var fileReader = new FileReader();
  fileReader.onload = function() {
    var encrypted = this.result;
    var decrypted = [];
    var buffer = exports.Buffer(encrypted, 'binary');
    var chunkSize = 50000;
    for(var i = 0; i < buffer.length; i += chunkSize){
      decipher.write(buffer.slice(i, i + chunkSize));
    }
    callback();
  };
  fileReader.readAsBinaryString(blob);
};