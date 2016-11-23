var express = require('express');
var storj = require('storj-lib');
var app = express();

var port = 8080;

app.use('/examples', express.static('examples'));
app.use('/build', express.static('build'));

var client = new storj.BridgeClient( 'https://api.storj.io', {
  basicAuth: {
    email: 'email',
    password: 'password'
  }
});
app.get('/token-proxy', function( req, res, next ){
  client.createToken( 'ab5517b0232f29778a1d36e0', 'PULL', function( err, token ){
    if( err ){ return res.json({ err: 'Could not connect to bridge' }) }
    token.size = 59477;
    token.fileId = '635b7c212398a7cdbcfb5b63';
    res.json( token );
  });
});

app.listen(port, function () {
  console.log('Listening on port ' + port);
});