<img style="text-align: center;" src="http://i.imgur.com/ikzVmnd.png"></img>

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

### `storj.on('error', function (e) {})`

Emitted when the library encounters a catastrophic error that will probably prevent normal operation moving forward. When an `error` is emitted, you should cleanup your `Storj` object and create a new one.

### `storj.on('ready', function () {})`

Emitted when the `Storj` object is ready to communicate with the storj network.

### `var keypair = storj.generateKeyPair()`

Create a new public/private `KeyPair` for authenticating against the Storj network. Note, this function will _not_ register this key with your account, you must provide `storj.registerKey` with the returned public key to do that.

### `storj.registerKey(pubkey, function cb(e) {})`

Register a public key with the Storj network. `cb` will be called with an `Error` if something goes wrong or `null` otherwise.

```javascript
var keypair = storj.generateKeyPair();
storj.registerKey(keypair.getPublicKey(), function(e) {
  if(e) { /* failed to register key */ }
});
```

### `storj.createBucket(bucketName, function cb(e) {})`

### `storj.getBucket(bucketId, function cb(e) {})`

### `storj.getBuckets(function cb(e) {})`

### `storj.makePublic(bucketId, cb(e) {})`

### `storj.deleteBucket(bucketId, function cb(e) {})`

### `var file = storj.createFile(bucketId, fileName, file, opts, cb)`

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

### `var file = storj.getFile(bucketId, fileId, cb)`

`bucketId` - the id of the bucket the file lives in (`String`)
`fileId` - the id of the file itself (`String`)
`cb` - an optional `function` that will be registered as a listener for the `done` event on the returned `file` object.
