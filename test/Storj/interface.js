'use strict';

// var stream = require('stream');
var test = require('tape');
var Storj = require('../../lib/Storj.js');
var Client = new Storj();

test('it should instantiate a Storj object', function(t) {
  t.true(Client, 'Client exists');
  t.true(Client instanceof Storj, 'Client is an instance of Storj');
  // TODO: More thorough testing needed of initial object setup
});

test('it should create a file', function(t) {
  var bucketId = 1234;
  var fileName = 'myFileName.jpg';
  var opts = {};
  Client.createFile(bucketId, fileName, opts, function(err, file) {
    console.log(err, file)
    t.error(err, 'Create file failed');
    t.true(file);
  });
});

test('it should get a list of files in a bucket', function(t) {
  var bucketId = 1234;
  Client.getFiles(bucketId, function(err, files) {
    t.error(err, 'Get files failed');
    t.true(files);
  })
});

test('it should get a file', function(t) {
  var bucketId = 1234;
  var fileName = 'fileName.jpg';
  Client.getFile(bucketId, fileName, function(err, file){
    t.true(file);
    t.error(err, 'Get file failed');
  });
});

test('it should delete a file', function(t) {
  var bucketId = 1234;
  var fileId = 1234;
  Client.deleteFile(bucketId, fileId, function(err, file) {
    t.pass(file);
    t.error(err, 'Delete file failed');
  })
});
