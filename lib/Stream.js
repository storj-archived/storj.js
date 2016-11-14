Storj.Stream = function(options, callback){
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

  self.client = new Storj.BridgeClient();

  self.skip = 0;
  self.fileData = [];
  self.element = options.element;
  self.codec = options.codec
  self.segmentCount = 0;

  var mediaSource = new MediaSource();
  self.element.src = URL.createObjectURL(mediaSource);

  var dataQueue = [];

  mediaSource.addEventListener('sourceopen', function(){
    var sourceBuffer = mediaSource.addSourceBuffer(self.codec);
    sourceBuffer.mode = 'sequence';

    var handleNextSegment = function(){
      if( sourceBuffer.updating ) return;
      if( dataQueue.length === 0 ) return;
      var next = dataQueue.shift();
      sourceBuffer.appendBuffer(next);
    };

    self.callback = function(err, data) {
      dataQueue.push(data);
      handleNextSegment();
    };

    sourceBuffer.addEventListener('updateend', function () {
      self.segmentCount += 1;
      handleNextSegment();
      if (self.element.paused && self.segmentCount == 1){
        self.element.play();
      }
    });

    self._createToken();
  });
};

Storj.Stream.prototype._createDecipher = function(){
  var self = this;
  var utils = Storj.Utils;

  var bucketKey = self.token.encryptionKey;
  var fileId = self.fileId;
  var decipher = utils.createDecryptor(bucketKey, fileId);

  decipher.on('readable', function(){
    var data = decipher.read();
    if( !data || data.length == 0 ) return;
    self.callback(null, data);
  });

  self.decipher = decipher;
};

Storj.Stream.prototype._createToken = function(){
  console.log('create token');
  var self = this;
  var client = self.client;
  var utils = Storj.Utils;

  client.createToken(self.bucketId, 'PULL', function(err, token){
    self.token = token;
    if(self.skip == 0){
      self._createDecipher();
    }

    self._getNextSlice();
  });
};

Storj.Stream.prototype._getNextSlice = function(token){
  console.log('getNextSlice');
  var self = this;
  var client = self.client;

  var options = {
    bucket: self.bucketId,
    file: self.fileId,
    token: self.token.token,
    skip: self.skip,
    limit: 1,
    exclude: []
  };

  self.skip += 1;

  client.getFilePointers(options, function(err, pointers){
    if(err || pointers.length == 0){
      return;
    }
    self._resolvePointer(pointers[0]);
  });

};

Storj.Stream.prototype._resolvePointer = function(pointer, index){
  console.log('resolvePointer');
  var self = this;
  var exports = Storj.Exports;
  var farmer = pointer.farmer;
  var currentSize = 0;
  var totalSize = pointer.size;
  var done = false;
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
      currentSize += msg.data.size;
      console.log('msg', currentSize / totalSize);
      var fileReader = new FileReader();
      fileReader.onload = function() {
        var encrypted = this.result;
        var buffer = exports.Buffer(encrypted, 'binary');

        var chunkSize = 50000;
        for(var i = 0; i < buffer.length; i += chunkSize){
          self.decipher.write(buffer.slice(i, i + chunkSize));
        }

        if( currentSize == totalSize && !done ){
          socket.close();
          done = true;
          console.log('done');
          self._createToken();
        }
      }

      fileReader.readAsBinaryString(msg.data);
    }
  };
  var socket = new Storj.Socket( options );
};