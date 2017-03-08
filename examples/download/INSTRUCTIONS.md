# Storj.js Download Example

Our only current working example for downloading a file in browser is pdf documents. Soon we will revisit and create all media type examples.

## Requirements

- Browserify or webpack
- storj.es6.js (this a bundle of storj.js used to access storj)
- pdf_example.html (the html serving storj.js and the other bundles)

## Install

```
git clone https://github.com/Storj/storj.js/tree/api
cd storj.js
npm i
npm run build
```

After creating the browserified bundle of storj.js. You can drop it in any of the example repos such as storj.js/examples/upload/storj.es6.js and it will be imported from up,oad.html in our example here. Or use it in your own application!

## Create a pubilc bucket

Create a public bucket. Currently only public buckets are able to serve decryption keys to the browser.

Place the bucket ID in the variable of pdf_example.html script.

Example:

```var bucket = '51ffcf13d349e2b199550bcc';``` 

## Upload a pdf

Use our new storj.js upload example or the cli to upload a pdf to your public bucket. 

Supply the file id to the File constructor

Example:

```
var pdf = new storj.File(bucket, 'db259e03219fa449c6a277b7',config)
  .on('done', function () { pdf.renderTo('#pdf'); });
```

## Configure Bridge URL

Supply your chosen bridge server to ```var config = { bridge: 'http://127.0.0.1:8080' };```

## Run

Launch pdf_example in firefox or chrome and watch the DOM be populated by the data stored on the Storj network!
