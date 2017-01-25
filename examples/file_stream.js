var fileReaderStream = require('filereader-stream');

window.getFileStream = function(files) {
  var first = files[0];
  var fstream = new fileReaderStream(first);
  return fstream;
}

module.exports = getFileStream;