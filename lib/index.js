var Client = require('./Client.js');

var c = new Client({ bridge: 'http://127.0.0.1:8080' });
var bucket = 'ff1be7f1c1c81df4405bb278';
var file = 'a6a85bb9a8d0fdef69814856';

c.add({
  bucketId: bucket,
  file: file
});
