# Storj.js
Extremely early version of the browser library for [Storj.io](https://storj.io/). This library currently exposes [storj core bridge-client](https://github.com/Storj/core/tree/master/lib/bridge-client) to the browser. 

A [discussion](https://github.com/Storj/storj.js/issues/2) has started about moving the bridge-client and requests to bridge out of core and into storj.js api and documentation.

## Table of Contents

- [Install](#install)
  - [npm](#npm)
- [Usage](#usage)
  - [Use in Node.js](#use-in-nodejs)
  - [Use in the browser with browserify](#use-in-the-browser-with-browserify)
  - [Tutorials and Examples](#tutorials-and-examples)
  - [API](#api)
      - [File API](#file-api)
        - [Get Blob](#getblob)
        - [Get Blob URL](#getbloburl)
        - [Render to DOM](#renderto)
      - [Core API](#core-api)
        - [Create Bucket](#createbucket)
        - [Get Bucket](#getbucket)
        - [Get Buckets](#getbuckets)
        - [Delete Bucket](#deletebucket)
        - [Make Public Bucket](#makepublic)
        - [Create File](#createfile)
        - [Get File](#getfile)
        - [Create File Token](#createfileToken)
        - [Get File Pointers](#getfilepointers)
        - [Get File Buffer](#getbuffer)
- [Packages](#packages)

## Install

### npm
This project is available through [npm](https://www.npmjs.com/). To install:

```bash
> npm install storj-js --save
```

### Use in Node.js

To include this project programmatically:

```javascript
var Storj = require('storj-js');

var options = {
  bridge: 'http://localhost:8080',
  basicAuth: {
    email: 'email',
    password: 'pass'
  }
};

var storj = new Storj(options)
```

## Usage

### Use in the browser with browserify

Load this module as browserified or webpacked bundle and import with `<script>` tags

```html
<!-- loading the minified version -->
<script src="storj.min.js"></script>

<!-- loading the human-readable (not minified) version -->
<script src="storj.js"></script>

<script>
  var options = {
    bridge: 'http://localhost:8080',
    basicAuth: {
      email: 'email',
      password: 'pass'
    }
  };
  
  var storj = new Storj(options);
</script>
```
---

## API

Storj.js extends the node implementation [API](https://storj.io/api.html) with a wrapper for the browser. It also creates a new API called `File` that has browser specific utilites such as events for full upload and downloads and web workers. 

## File API

---

#### getBuffer

---

#### getBlobUrl

---

#### getBlob

---

#### renderTo

---

### Core API

#### createBucket

```javascript

storj.createBucket()
```

#### getBucket

```javascript

storj.getBucket()
```

#### getBuckets

```javascript

storj.getBuckets()
```

#### makePublic

```javascript

storj.makePublic()
```

#### deleteBucket

```javascript
storj.deleteBucket()
```

#### createFile

Upload a file to the given bucket

Params:
  - bucketId (string): The id of the bucket to be uploaded to
  - fileName (string): The name of the file to be uploaded
  - stream (readable): A readable stream of the file contents
  - callback (function): (err, res)

```javascript
storj.createFile(bucketId, fileName, stream, function(err, res) {
  // if res then file uploaded
})
```

Response: Callback
  - err: Failed to upload
  - res: Success message

---

#### getFile

Retrieve a file by bucket and file id.

Params:
  - bucketId (string): The id of the bucket to be uploaded to
  - fileId (string): The id of the file to be uploaded
  - callback (function): (err, res)

```javascript
storj.getFile(bucketId, fileId, function(err, stream) {
  // get a stream of data
})
```

Response: callback
  - err: Error
  - stream: a readable stream of the decrypted and constructed file

---

#### createFileToken

Params:
  - bucketId (string): The id of the bucket to be uploaded to
  - callback (function): (err, res)

```javascript
storj.createFileToken(bucketId, function(err, token) {
  // Get file token
})
```

Response: callback
  - err: Error
  - token: a file token with encryption key

---

#### getFilePointers

Get file pointers to the location of files

Params:
  - bucketId (string): The id of the bucket to be uploaded to
  - fileId (string): The id of the file to be uploaded
  - callback (function): (err, res)

```javascript
storj.getFilePointers(bucketId, fileId, function(err, pointers){
  // get file pointers
})
```

Response: callback
  - err: Error
  - pointer: pointers to a file

---

### Tutorials and Examples

#### Download the file in a browser

  ```html
  <html>
    <head>
    <title>Storj Download Example</title>
  </head>
  <body>
    <script type="text/javascript" src="storj.es6.js"></script>
    <script>
      var bucket = '<bucket-id>';
      var config = { bridge: 'http://127.0.0.1:8080' };
      var pdf = new File(bucket, '<file-id>',config)
        .on('done', function () { pdf.renderTo('#pdf'); });
      var video = new File(bucket, '<file-id>', config)
        .on('done', function () { video.appendTo('body'); });
    </script>
    </body>
  </html>
  ```

  Extra Credit: Upload a file in a browser

  ```html
  <html>
    <head>
    <title>Storj Upload Example</title>
  </head>
  <body>
    <script type="text/javascript" src="storj.es6.js"></script>
    <script>
      var bucketId = '77845a36aadcb966fc76d5da'
      var shard = '603d9480ab2e9b66705f3896'

      var options = {
        bridge: 'http://localhost:8080',
        basicAuth: {
          email: 'email',
          password: 'pass'
        }
      }
      
      var storj = new Storj(options)

      window.remove = DragDrop('.box', {
        onDrop: function (files, pos) {
          var stream = window.getFileStream(files);
          var opts = {
            body: stream
          }

          storj.createFile(bucketId, files, opts, (err, res) => {
            if (err) {
              alert('File failed to upload' + err);
            }
            alert('File finished uploading! ' + JSON.stringify(res))
          });
        },
        onDropText: function (text, pos) {
          storj.createFile(bucketId, text)
        }
      })
    </script>
    </body>
  </html>
  ```
### More Examples: WIP
 * [Upload](https://github.com/Storj/storj.js/blob/api/examples/upload/INSTRUCTIONS.md)
 * [Download](https://github.com/Storj/storj.js/blob/api/examples/download/INSTRUCTIONS.md)

### Completed:
  * Download files in public buckets
  * Initial version of audio and video streaming
  * Create documentation for creating public buckets
  * Refactor Stream.js to use Download.js logic
  * Add concurrent downloads for streaming
  * Perform decryption in separate thread or in way that doesn't freeze interface
  * Add progress indication for files and streams

### To do:
  * **Solve mixed content errors on https pages (important!)**
    * WebRTC or "Let's Encrypt"
  * Properly handle errors and issue X retries per shard
    * Add failed pointers to exclude list

### Wishlist:
  * Figure out efficient distributed streaming method
    * Requires out of order decryption
  * Get seek to working for audio/video streams
    * Requires out of order decryption + more meta data

