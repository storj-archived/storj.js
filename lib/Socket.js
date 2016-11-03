/**
  * options.url
  * options.onError
  * options.onOpen
  * options.onData
  */
Storj.Socket = function(options){
  var socket;
  this.open = function(){

    socket = new WebSocket( options.url );

    socket.onopen = function(){
      options.onOpen();
    };

    socket.onerror = function(){
      options.onError();
    };

    socket.onmessage= function( msg ) {
      options.onData(msg);
    }

  };

  this.close = function(){
    if( socket ) socket.close();
    socket = null;
  };

  this.send = function( data, callback ){
    if( !socket || socket.readyState != 1 ) return true;
    socket.send( data );
    return null;
  };

  this.open();

};