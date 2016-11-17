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

    var options = {
      bucket: self.bucketId,
      file: self.fileId,
      token: token.token,
      skip: self.skip,
      limit: self.limit,
      exclude: []
    };

    client.getFilePointers(options, function(err, pointers){
      self._resolvePointers(pointers);
    });
  });
};

Storj.Downloader.prototype._resolvePointers = function(pointers){
  console.log('resolve pointers');
  var self = this;
  var numPointers = pointers.length;
  var numStarted = 0;
  var completedPointers = 0;

  var _finishPointer = function(){
    completedPointers += 1;
    if( completedPointers == numPointers ){
      self._decrypt();
    } else {
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
        blobs.push(msg.data);
        currentSize += msg.data.size;
        console.log('msg', index, 100 * currentSize / totalSize);
        if( currentSize == totalSize ){
          socket.close();
          self.fileData[index] = blobs;
          _finishPointer();
        }
      }
    };
    var socket = new Storj.Socket( options );
  };

  var numImmediate = Math.min( numPointers, self.maxConcurrent );
  numStarted = numImmediate;
  for(var i = 0; i < numImmediate; i++){
    _resolvePointer(pointers[i], i);
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