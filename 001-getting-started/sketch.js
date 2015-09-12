/**
 *  Make sure to add your Piecemaker 2 username (email) and password to config/config.js!
 * 
 *  This sketch simply helps you fetch your API key using your normal login credentials.
 */

var pm2,
    api_key,
    text_elt,
    canvas;

function setup() {
  
  canvas = createCanvas( 640, 480 );
  
  var config = getConfig().piecemaker;

  pm2 = new PieceMakerApi( config );
  
  pm2.login( config.username, config.password, loggedIn );
}

function loggedIn ( _api_key ) {
  api_key = _api_key;
  
  // adding api_key as a div element so the text can be copied
  text_elt = createDiv( api_key );
  // div position and style
  text_elt.position( jQuery(canvas.elt).offset().left, height/1.9 );
  text_elt.style("color","white");
  text_elt.style("text-align","center");
  text_elt.style("width",width+"px");
  text_elt.style("font-size",34+"px");
  text_elt.style("font-family","Helvetica, Arial, sans serif");
}

function draw() {
  
  fill( 255 );
  textAlign( CENTER );
  textSize( 34 );
  
  if ( api_key ) {
    
    background( "#339911" );
    text( "Your API key:", width / 2, height / 2 );
    
  } else {
    
    background( "#113399" );
    text( "Logging you in …", width / 2, height / 2 );
  }
}