Storj.Stream = function(options, callback){
  var self = this;
  var utils = Storj.Utils;

  var dataQueue = [];

  self.element = options.element;
  self.codec = options.codec
  self.segmentCount = 0;

  var mediaSource = new MediaSource();
  self.element.src = URL.createObjectURL(mediaSource);

  mediaSource.addEventListener('sourceopen', function(){
    var sourceBuffer = mediaSource.addSourceBuffer(self.codec);
    sourceBuffer.mode = 'sequence';

    var waiting = false;
    var handleNextSegment = function(){
      if( sourceBuffer.updating ) return;
      if( dataQueue.length === 0 ) return;
      if( waiting ) return;
      var next = dataQueue.shift();
      try {
        sourceBuffer.appendBuffer(next);
        waiting = false;
      } catch (err) {
        // handle QuotaExceeded error this way
        dataQueue.unshift(next);
        waiting = true;
        setTimeout( handleNextSegment, 1000 );
      }
    };

    sourceBuffer.addEventListener('updateend', function () {
      self.segmentCount += 1;
      handleNextSegment();
      if (self.element.paused && self.segmentCount == 1){
        self.element.play();
      }
    });

    options.stream = function(err, data) {
      dataQueue.push(data);
      handleNextSegment();
    };

    var Downloader = new Storj.Downloader(options, function(){});

  });
};