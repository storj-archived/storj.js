Storj.Downloader = function(options, callback){
  var utils = Storj.Utils;

  this.bucketId = utils.calculateBucketId(options.user, options.bucket);
  this.fileId = utils.calculateFileId(this.bucketId, options.file);

  this.client = new Storj.BridgeClient();
  this.callback = callback;
  this._createToken();
  this.skip = 0;
  this.limit = 6;
  this.fileData = [];

};

Storj.Downloader.prototype._createToken = function(){
  var self = this;
  var client = self.client;

  client.createToken(self.bucketId, 'PULL', function(err, token){
    self.token = token;
    self._getNextSlice();
  });
};

Storj.Downloader.prototype._getNextSlice = function(token){
  var self = this;
  var client = self.client;

  var options = {
    bucket: self.bucketId,
    file: self.fileId,
    token: self.token.token,
    skip: self.skip,
    limit: self.limit,
    exclude: []
  };

  self.skip += self.limit;

  client.getFilePointers(options, function(err, pointers){
    self._resolvePointers(pointers);
  });

};

Storj.Downloader.prototype._resolvePointers = function(pointers){
  var self = this;
  var numPointers = pointers.length;
  var completedPointers = 0;

  if(numPointers == 0){
    self._decrypt();
  }

  var _finishPointer = function(){
    completedPointers += 1;
    if( completedPointers == numPointers ){
      if(numPointers < self.limit){
        self._decrypt();
      } else {
        self._createToken();
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
        blobs.push(msg.data);
        currentSize += msg.data.size;
        if( currentSize == totalSize ){
          socket.close();
          self.fileData[index] = blobs;
          _finishPointer();
        }
      }
    };
    var socket = new Storj.Socket( options );
  };

  for(var i = 0; i < numPointers; i++){
    _resolvePointer(pointers[i], i + self.skip - self.limit);
  }
};

Storj.Downloader.prototype._decrypt = function(){
  var self = this;

  var utils = Storj.Utils;

  var blobArray = [].concat.apply([], self.fileData);
  var encryptedBlob = new Blob(blobArray);

  var bucketKey = self.token.encryptionKey;
  var fileId = self.fileId;

  var decipher = utils.createDecryptor(bucketKey, fileId);
  self._decryptBlob(encryptedBlob, decipher);
};

Storj.Downloader.prototype._decryptBlob = function(blob, decipher) {
  var self = this;
  var exports = Storj.Exports;

  var fileReader = new FileReader();
  fileReader.onload = function() {
    var encrypted = this.result;
    var decrypted = [];
    var buffer = exports.Buffer(encrypted, 'binary');

    decipher.on('readable', function(){
      var data = decipher.read();
      if (data) {
        decrypted.push(data);
      }
    });

    decipher.on('end', function(){
      self.callback(null, new Blob(decrypted));
    });

    var chunkSize = 50000;
    for(var i = 0; i < buffer.length; i += chunkSize){
      decipher.write(buffer.slice(i, i + chunkSize));
    }
    decipher.end();
  };
  fileReader.readAsBinaryString(blob);
};