![storj.js](http://i.imgur.com/ikzVmnd.png)

The official Storj library, for **node.js** and the **browser**.

> Note: This library is currently in beta. If you are building a Node.js application you plan on shipping to production soon, we recommend you use the utility libary [storj-lib](http://github.com/storj/core). For browser applications, Storj.js is the only supported option for development.

## Table of Contents

- [Install](#install)
  - [npm](#modejs)
  - [browser](#browser)
- [Usage](#usage)
  - [Use in Node.js](#use-in-nodejs)
  - [Use in the browser](#use-in-the-browser)
- [API](#api)
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

### `var storj = new Storj([opts])`

Create a new `Storj` instance, which will be used to talk across the storj protocol. This object will emit the `ready` event when it has finished being configured.

The optional `opts` allows you to override the default behaviour of this object. The `opts` object is how you will pass in your user credentials if you need to work with private buckets.

`opts`:

```
{
  bridge: STRING, // The url of the bridge to talk to, defaults to https://api.storj.io
  basicAuth: OBJECT, // Used for any requests that require authentication, this is your username and password
  key: STRING, // Private key, used for any requests that require authentication
  mnemonic: STRING // Used to encrypt and decrypt data stored in private buckets
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

Both `basicAuth` and `key` are optional, but you may only provide one or the other. If you use `basicAuth`, the library will assume that you already have registered a public key with the bridge you are authenticating with. To create a public/private key pair for you and register it to your account you can use the `generateKeyPair` and `registerKey` API.

If you provide a `key`, this key will be used to authenticate every request moving forward.

### `storj.on('error', function (e) {})`

Emitted when the library encounters a catastrophic error that will probably prevent normal operation moving forward. When an `error` is emitted, you should cleanup your `Storj` object and create a new one.

### `storj.on('ready', function () {})`

Emitted when the `Storj` object is ready to communicate with the storj network.

### `var keypair = storj.generateKeyPair([privateKey])`

Create a new public/private `KeyPair` for authenticating against the Storj network. Note, this function will _not_ register this key with your account, you must provide `storj.registerKey` with the returned public key to do that.

### `storj.registerKey(publicKey, function cb(e) {})`

Register a public key with the Storj network. `cb` will be called with an `Error` if something goes wrong or `null` otherwise.

```javascript
var keypair = storj.generateKeyPair();
storj.registerKey(keypair.getPublicKey(), function(e) {
  if(e) { /* failed to register key */ }
});
```

### `storj.removeKey(publicKey, function cb(e) {})`

Remove a public key from the Storj network. `cb` will be called with an `Error` if something goes wrong or `null` otherwise.

### `var mnemonic = storj.generateMnemonic()`

Create a new mnemonic, which can be used to encrypt/decrypt files on the storj network. Certain operations, such as `createFile`, require that `Storj` was provided a mnemonic when constructed. Keep track of this, as it will be necessary to retrieve your files in the future.

```js
var key = storj.generateKeyPair().getPrivateKey();
var mnemonic = storj.generateMnemonic();
var storj = new Storj({ key, mnemonic });
// storj can now perform bucket operations and upload/download files
```

### `storj.createBucket(bucketName, function cb(e, meta) {})`

Create's a bucket on the storj network with the requested name. `cb` will be invoked with an error if creating the bucket fails, otherwise `meta` will contain metadata for the bucket created.

`meta` has the following properties:

```js
{
  id: String, // The bucket id of the newly created bucket
  name: String // the name of the newly created bucket
}
```

### `storj.getBucket(bucketId, function cb(e, meta) {})`

Get the metadata for a bucket. `cb` will be invoked with an error if getting the meta-data fails, otherwise `meta` will have the following properties:

```js
{
  id: String, // The id of the bucket
  name: String // The name of the bucket
}
```

### `storj.getBucketList(function cb(e, buckets) {})`

Get a list of all buckets associated with the currently authenticated account on the storj network. `cb` will be invoked with an error if getting the list of buckets fails, or with an array of meta-data about the buckets. Each element of the `buckets` array will have the following properties:

```js
{
  id: String, // the bucketID of the bucket
  name: String // the name of the bucket
}
```

### `storj.makePublic(bucketId, [opts], cb(e) {})`

TODO

### `storj.deleteBucket(bucketId, function cb(e) {})`

Remove a bucket from the Storj network. `cb` will be invoked with an error if the operation fails, or `null` otherwise.

### `var file = storj.createFile(bucketId, fileName, file, [opts], cb)`

Upload a file to a bucket.

`bucketId` - the id of the bucket that we will be uploading the file to (`String`)
`fileName` - the name of the file we are uploading, with it's extension (`String`)
`file` - the contents of the file and can be any of the following:
  - a [`stream.Readable`](https://nodejs.org/api/stream.html#stream_readable_streams)
  - a `String` with the plain-text contents of the file
  - a [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob)
  
`opts` is optional, and allows you to specify some of the file's metadata:

```js
{
  fileSize: Number, // Size of the file in bytes, required if `file` is a stream
}
```

`cb` is an optional `function` that will be registered as a [listener](https://nodejs.org/api/events.html) on the returned `File`'s `done` event.

### `var file = storj.getFile(bucketId, fileId, function cb() {})`

`bucketId` - the id of the bucket the file lives in (`String`)
`fileId` - the id of the file itself (`String`)
`cb` - an optional `function` that will be registered as a listener for the `done` event on the returned `file` object

### `storj.getFileList(bucketId, function cb(e, files) {})`

Get a list of files stored in a bucket on the Storj network. `cb` will be invoked with an `Error` first if the operation fails, or `null` otherwise. `files` will be an array of meta-data about the files, each element will have the following properties:

```js
{
  id: String, // the id of the file
  name: String, // the name of the file
  mimetype: String // the mime-type of the file
}
```

### `storj.deleteFile(bucketId, fileId, function cb(e) {})`

Remove a file from the Storj network. `cb` will be invoked with an `Error` first if the operation fails, or `null` otherwise.

## File API

> TODO: Define behaviour of `createReadStream`, `renderTo`, `appendTo`, etc. when _uploading_ a file.

### `file.name`

The name of the file.

### `file.mimetype`

The mimetype of the file.

### `file.length`

The length of the file in bytes.

### `file.progress`

A number between 0 and 1 (inclusive) reflecting what percentage of the file has been downloaded from the network. To determine how many bytes have been downloaded, you can multiply `file.length` by `file.progress`.

### `file.on('done', function cb() {})`

Emitted when a `File` has finished either uploading or downloading it's contents.

### `file.on('ready', function cb() {})`

Emitted when the `File` has finished being setup and is ready to begin transfering data. You can listen for this event if you are planning on tracking the progress of an upload/download.

### `file.on('error', function cb(e) {})`

Emitted when the `File` encounters an unrecoverable error either during setup or during upload/download. If this is emitted, it is safe to assume the `File` is in a corrupted state and the upload/download should be restarted from the beginning.

### `file.on('data', function cb(data) {})`

Emitted when data has been downloaded from the network, this can be used for tracking the value of `file.progress`. The callback will be provided the chunk of data that was pulled over the network.

### `file.createReadStream()`

Create a [readable stream](https://nodejs.org/api/stream.html#stream_class_stream_readable) to the file. Pieces of the file will become available from the stream as soon as they are downloaded from the network.

### `file.getBuffer(function cb(e, buffer) {})`

Returns a `Buffer` representation of the `file`. If the `file` is downloading when `getBuffer` is called, the `cb` will be called with a `Buffer` as soon as the `file` finishes downloading.

### `file.appendTo(rootElem, [opts], [function cb(e, elem) {}])` (BROWSER ONLY)

Show the file in a the browser by appending it to the DOM. This is a powerful function
that handles many file types like video (.mp4, .webm, .m4v, etc.), audio (.m4a, .mp3,
.wav, etc.), images (.jpg, .gif, .png, etc.), and other file formats (.pdf, .md, .txt,
etc.).

The file will be fetched from the network and streamed into the page (if it's video or audio).
In some cases, video or audio files will not be streamable because they're not in a format that
the browser can stream so the file will be fully downloaded before being played. For other
non-streamable file types like images and PDFs, the file will be downloaded then displayed.

`rootElem` is a container element (CSS selector or reference to DOM node) that the content
will be shown in. A new DOM node will be created for the content and appended to
`rootElem`.

If provided, `opts` can contain the following options:

- `autoplay`: Autoplay video/audio files (default: `true`)
- `controls`: Show video/audio player controls (default: `true`)
- `maxBlobLength`: Files above this size will skip the "blob" strategy and fail (default: `200 * 1000 * 1000` bytes)

If provided, `callback` will be called once the file is visible to the user.
`callback` is called with an `Error` (or `null`) and the new DOM node that is
displaying the content.

```js
file.appendTo('#containerElement', function (err, elem) {
  if (err) throw err // file failed to download or display in the DOM
  console.log('New DOM node with the content', elem)
})
```

Streaming support depends on support for `MediaSource` API in the browser. All
modern browsers have `MediaSource` support.

For video and audio, storj.js tries multiple methods of playing the file:

- [`videostream`][videostream] -- best option, supports streaming **with seeking**,
  but only works with MP4-based files for now (uses `MediaSource` API)
- [`mediasource`][mediasource] -- supports more formats, supports streaming
  **without seeking** (uses `MediaSource` API)
- Blob URL -- supports the most formats of all (anything the `<video>` tag supports
  from an http url), **with seeking**, but **does not support streaming** (entire
  file must be downloaded first)

[videostream]: https://www.npmjs.com/package/videostream
[mediasource]: https://www.npmjs.com/package/mediasource

The Blob URL strategy will not be attempted if the file is over
`opts.maxBlobLength` (200 MB by default) since it requires the entire file to be
downloaded before playback can start which gives the appearance of the `<video>`
tag being stalled. If you increase the size, be sure to indicate loading progress
to the user in the UI somehow.

For other media formats, like images, the file is just added to the DOM.

For text-based formats, like html files, pdfs, etc., the file is added to the DOM
via a sandboxed `<iframe>` tag.

### `file.renderTo(rootElem, [opts], [function cb(e, elem) {}])` (BROWSER ONLY)

Like `file.appendTo` but renders directly into given element (or CSS selector).

### `file.getBlob(function cb(e, blob) {})` (BROWSER ONLY)

Get a W3C `Blob` object which contains the file data.

The file will be fetched from the network, and `callback` will be called once the file is ready. `callback` must be specified, and will be called with a an `Error` (or `null`) and the `Blob` object.

### `file.getBlobUrl(function cb(e, url) {})` (BROWSER ONLY)

Get a url which can be used in the browser to refer to the file.

The file will be fetched from the network and `callback` will be called once the file is ready. `callback` must be specified, and will be called with a an `Error` (or `null`) and the Blob URL (`String`).

This method is useful for creating a file download link, like this:

```js
file.getBlobURL(function (err, url) {
  if (err) throw err
  var a = document.createElement('a')
  a.download = file.name
  a.href = url
  a.textContent = 'Download ' + file.name
  document.body.appendChild(a)
})
```

## KeyPair API

### `var key = keypair.getPrivateKey()`

Get the private key component of the `KeyPair`.

### `var key = keypair.getPublicKey()`

Get the public key component of the `KeyPair`.

### `var signature = keypair.sign(message)`

Sign a message with this key. `message` should be either a `String` or a `Buffer`, and the returned signature will be a `String`.

### `var id = keypair.getNodeID()`

Get your client's NodeID on the Storj network, which is derived from this `KeyPair`.

### `var address = keypair.getAddress()`

Return a bitcoin-format address derived from this `KeyPair`.
