Storj.Utils = {};

/**
  * options.type
  * options.url
  * options.responseType
  * options.data
  * options.callback
  */
Storj.Utils.request = function(options) {
  var type = options.type;
  var url = options.url;
  var responseType = options.responseType;
  var data = options.data;
  var callback = options.callback;

  var request = new XMLHttpRequest();
  request.open( type, url, true );
  request.responseType = responseType;
  request.setRequestHeader( 'Content-Type', 'application/json' );

  request.addEventListener( 'load', function ( event ) {
    var response = event.target.response;
    if (response.err) {
      return callback('Could not load asset') 
    }
    callback( null, response );
  });

  request.addEventListener( 'error', function( err ){
    callback('Could not load asset');
  });

  request.send(data);

};