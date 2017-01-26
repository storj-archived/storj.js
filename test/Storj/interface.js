'use strict';

// var stream = require('stream');
var test = require('tape');
var assert = require('assert');
var Storj = require('../../lib/Storj.js');
var Client = new Storj();

test('it should instantiate a Storj object', function(t) {
  t.true(Client, 'Client exists');
  t.true(Client instanceof Storj, 'Client is an instance of Storj');
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
  var fileName = 'fileName.jpg';

  Client.getFiles(bucketId, fileName, function(files) {
    console.log(files);
    t.true(files);
    t.error(err, 'Get file failed');
  });
});

test('it should get a file', function(t) {

});

test('it should delete a file', function(t) {

});
