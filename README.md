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
  storj make-public PublicBucket --pull
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
    <script type="text/javascript" src="storj.es6.js"></script>
    <script>
      var bucket = '51ffcf13d349e2b199550bcc';
      var config = { bridge: 'http://127.0.0.1:8080' };
      var pdf = new storj.File(bucket, 'db259e03219fa449c6a277b7',config)
        .on('done', function () { pdf.renderTo('#pdf'); });
      var video = new storj.File(bucket, 'e92547cc0c74f588a20b80a0', config)
        .on('done', function () { video.appendTo('body'); });
    </script>
    </body>
  </html>
  ```

### Completed:
  * Download files in public buckets
  * Initial version of audio and video streaming
  * Create documentation for creating public buckets
  * Refacto Stream.js to use Download.js logic
  * Add concurrent downloads for streaming
  * Perform decryption in separate thread or in way that doesn't freeze interface
  * Add progress indication for files and streams

### To do:
  * **Solve mixed content errors on https pages (important!)**
    * WebRTC or "Let's Encrypt"
  * Automatically replace special browser storj tags with equivalent elements
  * Use supplied file size, requires PR deployment
  * Use supplied mimetype of file and create DOM element
    * Requires [this pull request](https://github.com/Storj/bridge/pull/288) to be merged
  * Properly handle errors and issue X retries per shard
    * Add failed pointers to exclude list

### Wishlist:
  * Figure out efficient distributed streaming method
    * Requires out of order decryption
  * Get seek to working for audio/video streams
    * Requires out of order decryption + more meta data

### Examples: WIP
  * [Upload](https://github.com/Storj/storj.js/blob/api/examples/upload/INSTRUCTIONS.md)
  * [Download](https://github.com/Storj/storj.js/blob/api/examples/download/INSTRUCTIONS.md)

