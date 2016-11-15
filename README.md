# Storj.js
Extremely early version of the browser library for [Storj.io](https://storj.io/).

### Use:
  1. Install [core-cli](https://github.com/Storj/core-cli)
  
  ```
  npm install storj-cli --global
  storj login
  ```
  
  2. Generate a deterministic seed
  
  ```
  storj generate-seed
  ```
  
  3. Create a new bucket and make it public for downloads
  
  ```
  storj add-bucket PublicBucket
  storj make-public PublicBucket true
  ```
  
  4. Upload a small image file
  
  ```
  storj upload-file PublicBucket test.png
  ```
  
  5. Download the file in a browser

  ```html
  <html>
    <head>
    <title>Storj Download Example</title>
  </head>
  <body>
    <script type="text/javascript" src="../build/Storj.js"></script>
    <script>

    var options = {
      bucketId: '<bucket-id>', // || user: <email>, bucket: <bucket-name>
      file: 'test.png'
    };
    var downloader = new Storj.Downloader(options, function(err, data) {
      var blob = new Blob([data], {type: "image/jpg"});
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.src = url;
      document.body.appendChild(img);
    });

    </script>
    </body>
  </html>
  ```

### Completed:
  * Download files in public buckets
  * Initial version of audio and video streaming
  * Create documentation for creating public buckets

### To do:
  * Add progress indication for files and streams
  * Get seek to working for audio/video streams
  * Properly handle errors and issue retries
  * Add concurrent downloads for streaming
  * Use supplied mimetype of file and create DOM element
  * Automatically replace special browser storj tags with equivalent elements
  * Solve mixed content errors on https pages
    * WebRTC or CertBot

### Examples:
  * [Text](http://htmlpreview.github.io/?https://github.com/cpollard1001/storj.js/blob/master/examples/text.html)
  * [Small Image](http://htmlpreview.github.io/?https://github.com/cpollard1001/storj.js/blob/master/examples/small_image.html)
  * [Large Image](http://htmlpreview.github.io/?https://github.com/cpollard1001/storj.js/blob/master/examples/large_image.html)
  * [Video](http://htmlpreview.github.io/?https://github.com/cpollard1001/storj.js/blob/master/examples/video.html)
  * [Audio Streaming](http://htmlpreview.github.io/?https://github.com/cpollard1001/storj.js/blob/master/examples/audio_stream.html)
  * [Video Streaming](http://htmlpreview.github.io/?https://github.com/cpollard1001/storj.js/blob/master/examples/video_stream.html)
