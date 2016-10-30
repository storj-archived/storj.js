var express = require('express');
var app = express();

var port = 8080;

app.use('/examples', express.static('examples'));
app.use('/build', express.static('build'));

app.listen(port, function () {
  console.log('Listening on port ' + port);
});