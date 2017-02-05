# Storj.js Upload Example

This will serve as an example for developers wishing to create applications with storj.js

## Requirements

- Browserify or webpack
- nginx (needed to server the html for Feross drag-drop, use html uploader for no server)
- storj.es6.js (this a bundle of storj.js used to access storj)
- stream_bundle.js (this is a bundle of file_stream.js to get a file stream from the browser)
- dragdrop_bundle.js (this is a bundle of drag-drop)
- create_file.html (the html serving storj.js and the other bundles)

## Install

Until the PR is landed, we will be working with isomorphic-bridge-client branch on core and the api branch on storj.js

```
git clone https://github.com/Storj/storj.js/tree/api
git clone https://github.com/retrohacker/core/tree/isomorphic-bridge-client
cd core
npm i
npm link
cd ..
cd storj.js
npm link storj-lib
npm i
npm run build
```

After creating the browserified bundle of storj.js. You can drop it in any of the example repos such as storj.js/examples/upload/storj.es6.js will be imported from create_file.html in our example here. Or use it in your own application!

## Start web server

Since this example is using Feross drag-drop. We need to use a web server to indicate to the browser that we are not intending to drop the file to the file system. 

Any web server will work. Just server storj.js/examples/uploads/ as the root directory and use create_file.html as your entry point index.html.

## Create a pubilc bucket

Create a public bucket (or private if not serving downloads to the browser) with the storj-cli and place the ID in the bucketId variable in create_file.html. This can be used by the api to server your downloads in the browser if public.

## Input bridge url and auth credentials

Currently we need to auth with the bridge server to request file shard frames for upload. The default bridge url is currently set to the storj main bridge but you can change this to a local running bridge for testing. See storj integration for instructions on how to run a test storj netowork. 

Provide your email and password to the create_file.html basicAuth object.

## Run

With create_file.html being servered, visit your webservers port in browser and try an upload! You should be able to drag and reasonably sized file into the browser. Currently encryption is a bit slow until webworkers are implemented and there is no indication that anything is happening in browser other than network traffic to the bridge and farmer you are uploading to. If the upload is succesfull an alert will display showing the farmer information that you just uploaded to. 

Happy hacking!