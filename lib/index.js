'use strict';

var File = require('./File.js');
var bucket = 'ff1be7f1c1c81df4405bb278';
var file = 'a6a85bb9a8d0fdef69814856';

// Trigger a download
var file = File(bucket, file, {
  bridge: 'http://127.0.0.1:8080',
  protocol: 'HTTP',
}).on('done', function () {
  file.renderTo('#foobar');
});
