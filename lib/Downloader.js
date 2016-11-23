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
  self.options = options;
  self._createToken();
};

Storj.Downloader.Worker = function(){
  var workerString = function(){

    var decipher;

    var _init = function( url, bucketKey, fileId ){
      importScripts( url );
      decipher = Storj.Utils.createDecryptor( bucketKey, fileId );

      decipher.on('readable', function(){
        var data = decipher.read();
        if( data ){
          postMessage(data);
        }
      });
    };

    var _decrypt = function( blob ){
      var fileReader = new FileReader();
      fileReader.onload = function() {
        var encrypted = this.result;
        var decrypted = [];
        var buffer = Storj.Exports.Buffer(encrypted, 'binary');
        var chunkSize = 50000;
        for(var i = 0; i < buffer.length; i += chunkSize){
          decipher.write(buffer.slice(i, i + chunkSize));
        }
      };
      fileReader.readAsBinaryString(blob);
    };

    var _end = function(){
      decipher.end();
    };

    self.onmessage = function( event ){
      var obj = event.data;
      if( obj.type === 'init' ){
        _init( obj.url, obj.bucketKey, obj.fileId );
      } else if( obj.type === 'end' ){
        _end();
      } else {
        _decrypt( event.data );
      }
    }
  }.toString();
  var len = workerString.length;
  return workerString.substring( 'function(){'.length + 1, len - 1 );
};

Storj.Downloader.prototype._createToken = function(){
  console.log('create token');
  var self = this;
  var client = self.client;

  client.createToken(self.bucketId, 'PULL', self.fileId, function(err, token){
    self.token = token;
    self._createDecipher();
  });
};

Storj.Downloader.prototype._createDecipher = function(){
  var self = this;
  var utils = Storj.Utils;

  var decrypted = [];
  var currentSize = 0;
  var fileSize = self.token.size ? self.token.size : self.options.size;

  var workerBlob = new Blob([Storj.Downloader.Worker()], {type: 'application/javascript'});
  self.worker = new Worker( URL.createObjectURL( workerBlob ) );
  self.worker.onmessage = function( event ){
    currentSize += event.data.length;
    self.stream( null, event.data );
    decrypted.push( event.data );
    if( currentSize == fileSize ){
      self.callback( null, new Blob( decrypted ) );
      self.worker.postMessage({ type: 'end' });
    }
  };

  var bucketKey = self.token.encryptionKey;
  var fileId = self.fileId;

  self.worker.postMessage({
    type: 'init',
    url: utils.getScriptPath(),
    bucketKey: bucketKey,
    fileId: fileId
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

  var _checkDecryption = function(){
    console.log('checkDecryption', decryptionIndex);
    if( decryptionIndex == 0 ) return;
    var nextBlob = self.fileData[ decryptionIndex ];
    if( nextBlob ){
      self._decryptBlob( new Blob( nextBlob ) );
      decryptionIndex += 1;
      _checkDecryption();
    }
  };

  var _finishPointer = function(){
    console.log('_finishPointer')
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
        blobs.push(msg.data);
        currentSize += msg.data.size;
        console.log('shard: ', index, (100 * currentSize / totalSize) + '%');
        if( index == 0 ){
          self._decryptBlob(msg.data);
        }
        if( currentSize == totalSize ){
          if( index == 0 ){ decryptionIndex += 1; }
          socket.close();
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

Storj.Downloader.prototype._decryptBlob = function(blob) {
  var self = this;
  self.worker.postMessage(blob);
};