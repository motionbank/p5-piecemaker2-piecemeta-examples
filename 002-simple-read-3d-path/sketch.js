/**
 * Make sure to add your Piecemaker 2 API key to the config/config.js
 * before running this sketch.
 * 
 * This sketch shows how to load and display a 3D path from one of the
 * Deborah Hay recordings of the solo "No Time To Fly":
 * http://scores.motionbank.org/dh/#/set/april-2011-nttf-solo-recordings
 */

var api,
    groupId = 29,
    pma_host, channel_uuid,
    channel, streams,
    loaded = false,
    current_pos = 0;

function setup() {
  
  var canvas = createCanvas( 640, 640 );

  api = new PieceMakerApi( getConfig().piecemaker );
  
  api.listEventsOfType( groupId, "video", videosLoaded ); 
}


function draw() {
  
  fill( 255 );
  textAlign( CENTER );
  textSize( 34 );
  
  if ( loaded ) {
    background( "#888" );
    fill( "#999" );
    noStroke();
    rect( 20, 20, height-40, height-40 );
    noFill();
    stroke( "white" );
    beginShape();
    for ( var i = 0, k = streams[0].frames.length; i < k ; i+=5 ) {
      vertex( map( streams[0].frames[i], 0, 12, 20, height-20) , 
              map( streams[1].frames[i], 0, 12, height-20, 20) );
    }
    endShape();
    fill( "#993311" );
    noStroke();
    ellipse( map( streams[0].frames[current_pos], 0, 12, 20, height-20), 
             map( streams[1].frames[current_pos], 0, 12, height-20, 20), 10, 10 );
    current_pos++;
    current_pos %= streams[0].frames.length;
    
  } else {
    
    background( "#331199" );
    text( "Loading events and data …", width / 2, height / 2 );
  }
}

// callback function, see setup()
// receives all events in the group of type "video"
function videosLoaded ( videos ) {
  for ( var v in videos )
  {
    var video = videos[v];
    if ( video.fields["title"] == "D06T02_Janine_sync_AJA_1" )
    {
      api.listEventsForTimespan( groupId, 
                                 video.utc_timestamp, 
                                 video.utc_timestamp.getTime() + (video.duration * 1000.0), 
                                 'intersecting',
                                 eventsLoaded );
      break;
    }
  } 
}

// callback function, see videosLoaded()
// receives all events that intersect with one specific video time span
function eventsLoaded ( events ) 
{
  for ( var e in events ) 
  {
    var event = events[e];
    
    if ( event.type == "data" )
    {
      // println( "ID: " + event.id + " / Title: " + event.fields["title"] );
      
      pma_host = event.fields["pma-server"], 
      channel_uuid = event.fields["pma-channel-uuid"];
      
      loadJSON( "http://"+pma_host+"/channels/"+channel_uuid+".json", channelLoaded );
      
      break;
    }
  }
}

// callback function, see eventsLoaded()
// receives information about one channel
function channelLoaded ( _channel )
{
  channel = _channel;
  
  loadJSON( "http://"+pma_host+"/channels/"+channel_uuid+"/streams.json", streamsLoaded );
}

// callback function, see channelLoaded()
// receives an array of streams (without the actual frame data)
function streamsLoaded ( _streams )
{
  streams = _streams;
  
  // println( "channel \"" + channel.title + "\" / streams: " + streams.length );
  
  var numLoaded = 0;
    
  for ( var i = 0, k = streams.length; i < k; i++ )
  {
    loadJSON( "http://"+pma_host+"/streams/"+streams[i].uuid+".json" + "?skip=2", 
    // this iffy creates a callback function with the local counters ("i") value bound to it's scope
    (function(j){
      return function ( _stream ) {
        streams[j] = _stream;
        numLoaded++;
        if ( numLoaded == k ) {
          // fully loaded!
          loaded = true;
        }
      }
    })(i) );
  }
}
