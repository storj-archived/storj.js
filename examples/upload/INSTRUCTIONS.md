# Storj.js Upload Example

In its current state, Storj.js uploads are a bit confusing and are under a few assumptions that need to be addressed by the developer using Storj.js

This will server as a guide for developers wishing to create applications with storj.js

## Requirements

- Browserify or webpack
- nginx (needed to server the html for feross drag-drop)
- storj.es6.js (this a bundle of storj.js used to access storj)
- bundle.js (this is a bundle of file_stream.js to get a file stream from the browser)
- dragdrop.js (this is a bundle of feross drag-drop)
- create_file.html (the html serving storj.js and the other bundles)

## Install

```
git clone https://github.com/Storj/storj.js
cd storj.js
npm i
npm run build
```

After creating the browserified bundle of storj.js. You can drop it in any of the example repos such as storj.js/examples/upload/storj.es6.js will be imported from create_file.html in our example here. Or use it in your own application!

## Start web server

Since this example is using feross drag-drop. We need use a web server to indicate to the browser that we not intending to drop the file to the file system. 

Any web server will work. Just server storj.js/examples/uploads/ as the root directory and use create_file.html as your entry point index.html.

## Create a pubilc bucket

Create a public bucket with the storj-cli and place the name in the bucketId variable in create_file.html

This will be used by the api 

## Input bridge url and auth credentials

Currently we need to auth with the bridge server to request file shard frames for upload. The default bridge url is currently set to the storj main bridge but you can change this to a local running bridge for testing. See storj intigration for instructions on how to run a test storj netowork. 

Provide your email and password to the create_file.html basicAuth object.

## Run

With create_file.html being servered, visit your webservers port in browser and try an upload! You should be able to drag and reasonably sized file into the browser. Currently encryption is a bit slow until webworkers are implemented and there is no indication that anything is happening in browser other than network traffic to the bridge and farmer you are uploading to. If the upload is succesfull an alert will display showing the farmer information that you just uploaded to. 

Happy hacking!