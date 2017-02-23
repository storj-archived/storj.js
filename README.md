<img style="text-align: center;" src="http://i.imgur.com/ikzVmnd.png"></img>

The official Storj library, for **node.js** and the **browser**.

> Note: This library is currently in beta. If you are building a Node.js application you plan on shipping to production soon, we recommend you use the utility libary [storj-lib](http://github.com/storj/core). For browser applications, Storj.js is the only supported option for development.

## Table of Contents

- [Install](#install)
  - [npm](#modejs)
  - [browser](#browser)
- [Usage](#usage)
  - [Use in Node.js](#use-in-nodejs)
  - [Use in the browser with browserify](#use-in-the-browser)
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
- [Tutorials and Examples](#tutorials-and-examples)

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

```javascript
var Storj = require('storj');
var storj = new Storj()
```

### Use in the browser

```html
<script src="storj.js"></script>
<script>
  var storj = new Storj(options);
  ...
</script>
```

## API

Storj.js exposes an isomorphic API that works both in the **browser** and in **node.js**!

## Storj Object

### `var storj = new Storj(opts)`

Create a new `Storj` instance, which will be used to talk across the storj protocol. This object will emit the `ready` event when it has finished being configured.

The optional `opts` allows you to override the default behaviour of this object. The `opts` object is how you will pass in your user credentials if you need to work with private buckets.

`opts`:

```
{
  bridge: STRING, // The url of the bridge to talk to, defaults to https://api.storj.io
  basicAuth: OBJECT, // Used for any requests that require authentication, this is your username and password
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

Both `basicAuth` and `key` are optional, but you may only provide one or the other. If you use `basicAuth`, the library will assume that you already have registered a public key with the bridge you are authenticating with. To create a public/private key pair for you and register it to your account you can use the `getKeypair` and `registerKeypair` API.

If you provide a `key`, this key will be used to authenticate every request moving forward.

### `storj.on('error', function (e) ...`

Emitted when the library encounters a catastrophic error that will probably prevent normal operation moving forward. When an `error` is emitted, you should cleanup your `Storj` object and create a new one.

### `storj.on('ready', function () ...`

Emitted when the `Storj` object is ready to communicate with the storj network.

### `var file = storj.createFile(bucketId, fileName, file, opts, cb)`

Upload a file to a bucket.

`bucketId` - The id of the bucket that we will be uploading the file to (`String`)
`fileName` - The name of the file we are uploading, with it's extension (`String`)
`file` represents the contents of the file and can be any of the following:
  - a [`stream.Readable`](https://nodejs.org/api/stream.html#stream_readable_streams)
  - a `String` with the plain-text contents of the file
  - a [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob)
  
`opts` is optional, and allows you to specify some of the file's metadata:

```json
{
  fileSize: Number, // Size of the file in bytes, required if `file` is a stream
}
```

`cb` is an optional `function` that will be registered as a [listener](https://nodejs.org/api/events.html) on the returned `File`'s `done` event.

## File API

### `File.on('done', function cb() {})`

Emitted when a `File` has finished either uploading or downloading it's contents.

### `File.on('ready', function cb() {})`

Emitted when the `File` has finished being setup and is ready to begin transfering data. You can listen for this event if you are planning on tracking the progress of an upload/download.

### `File.on('error', function cb(e) {})`

Emitted when the `File` encounters an unrecoverable error either during setup or during upload/download. If this is emitted, it is safe to assume the `File` is in a corrupted state and the upload/download should be restarted from the beginning.

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

