<img style="text-align: center;" src="http://i.imgur.com/ikzVmnd.png"></img>

The official Storj library, for **node.js** and the **browser**.

> Note: This library is currently in beta. If you are building a Node.js application you plan on shipping to production soon, we recommend you use the utility libary [storj-lib](http://github.com/storj/core). For browser applications, Storj.js is the only supported option for development.

## Table of Contents

- [Install](#install)
  - [npm](#npm)
- [Usage](#usage)
  - [Use in Node.js](#use-in-nodejs)
  - [Use in the browser with browserify](#use-in-the-browser-with-browserify)
  - [Tutorials and Examples](#tutorials-and-examples)
  - [API](#api)
      - [File API](#file-api)
        - [Create File](#createfile)
        - [Get File](#getfile)
        - [Get Blob](#getblob)
        - [Get Blob URL](#getbloburl)
        - [Render to DOM](#renderto)
      - [Core API](#core-api)
        - [Generate Keypair](#generatekeypair)
        - [Register Public Key](#registerkey)
        - [Create Bucket](#createbucket)
        - [Get Bucket](#getbucket)
        - [Get Buckets](#getbuckets)
        - [Delete Bucket](#deletebucket)
        - [Make Public Bucket](#makepublic)
        - [Create File Token](#createfileToken)
        - [Get File Pointers](#getfilepointers)
        - [Get File Buffer](#getbuffer)
- [Packages](#packages)

## Install

### Node.js

If you are building an application that will run outside of a browser, such as a web server, you should use Node.js. From the root of your project directory, alongside your package.json, run:

```
npm install --save storj
```

> Note: during the beta, this package will not be available via npm. Instead, install with the following syntax:
> `npm install --save https://github.com/storj/storj.js`

### Browser

Download the Storj.js library from our [releases page]() and place it alongside the `index.html` file for your website, saving it as `storj.js`. Then, in `index.html` include:

```html
<html>
  <head>...</head>
  <body>
    ...
    <script src="./storj.js"></script>
    ...
  </body>
</html>
```

The files on our releases page are named after the version of the [ECMAScript](https://en.wikipedia.org/wiki/ECMAScript) they target. If you are wanting to target older browsers, use `storj.es5.js` which targets [ES5](https://en.wikipedia.org/wiki/ECMAScript#5th_Edition), othwise use `storj.es6.js`.

## Usage

### Use in Node.js

To include this project programmatically:

```javascript
var Storj = require('storj');
var storj = new Storj()
```

### Use in the browser

Load this module as browserified or webpacked bundle and import with `<script>` tags

```html
<script src="storj.js"></script>
<script>
  var storj = new Storj(options);
  ...
</script>
```
---

## API

Storj.js extends the node implementation [API](https://storj.io/api.html) with a wrapper for the browser. It also creates a new API called `File` that has browser specific utilites such as events for full upload and downloads and web workers. 

## Storj Object

### `var storj = new Storj(opts)`

Instantiate a new `Storj` object used to communicate with the storj network. The `opts` object controls the behaviour of the returned object.

`opts`:

```
{
  bridge: STRING, // The url of the bridge to talk to, defaults to https://api.storj.io
  basicAuth: OBJECT, // Used for any requests that require authentication
  key: STRING, // Private key, used for any requests that require authentication
}
```

`basicAuth` should be of the form:

```
{
  user: STRING,
  password: STRING
}
```

If you need to use authentication in your application, we strongly suggest you use the `key` method as it provides a higher level of security.

Both `basicAuth` and `key` are optional, but you may only provide one or the other. If you use `basicAuth`, the library will assume that you already have registered a public key with the bridge you are authenticating with. To create a public/private key pair for you and register it to your account you can use the `getKeypair` and `registerKeypair` API. If you provide a `key`, this key will be used to authenticate every request moving forward.

### `storj.on('error', function (e) ...`

Emitted when the library reaches a catastrophic error that will probably prevent normal operation moving forward.

### `storj.on('ready', function () ...`

Emitted when all setup is complete. As soon as the `storj` object has been configured to use your `basicAuth` or `key`, `ready` will be emitted.

## File API

---

#### createFile

Upload a file to the given bucket

Params:
  - bucketId (string): The id of the bucket to be uploaded to
  - fileName (string): The name of the file to be uploaded
  - stream (readable): A readable stream of the file contents
  - callback (function): (file) Returns a File object

```javascript
storj.createFile(bucketId, fileName, stream, function(err, res) {
  // res is a file object
})
```

Response: Callback
  - file: 
    File extends the following events
      - uploaded
      - ready
      - error

---

#### getFile

Retrieve a file by bucket and file id.

Params:
  - bucketId (string): The id of the bucket to be uploaded to
  - fileId (string): The id of the file to be uploaded
  - callback (function): (file)

```javascript
storj.getFile(bucketId, fileId, function(err, stream) {
  // get a file object 
})
```

Response: callback
  - file:
    File extends the following events
    - uploaded
    - ready
    - error

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

#### generateKeypair

create a new public/private keypair.

Params:
  - callback (function): (keypair)

```javascript
storj.generateKeypair(function(keypair) {
  // get a keypair object
})
```

Response: callback
  - keypair: an ECDSA keypair

---

#### registerKey

Register a public key with the supplied client bridge.

Params:
  - publicKey (String): An ECDSA public key
  - callback (function): (keypair)

```javascript
storj.registerKey(publicKey, function(err, res) {
  // Res is a success message of uploaded key
})
```

Response: callback
  - err: Key failed to upload
  - res: Key is now registered with bridge

---

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
          storj.createFile(bucketId, files, opts, (file) => {
            file.on('error', (err) => {
              alert(err);
            });
            
            file.on('uploaded', (res) => {
              alert('file finished uploading!');
            })
          });
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

