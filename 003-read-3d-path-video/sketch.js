/**
 * Make sure to add your Piecemaker 2 API key to the config/config.js
 * before running this sketch.
 * 
 * This sketch shows how to synchronize a video with a 3D-path of one
 * Deborah Hay recording of the solo "No Time To Fly":
 * http://scores.motionbank.org/dh/#/set/april-2011-nttf-solo-recordings
 */

var api,
    groupId = 29,
    pma_host, channel_uuid,
    channel, streams,
    loaded = false,
    current_pos = 0,
    video_elt,
    video,
    data,
    time_offset,
    canvas,
    back_img;

function setup() {
  
  canvas = createCanvas( 360, 360 );

  api = new PieceMakerApi( getConfig().piecemaker );
  api.listEventsOfType( groupId, "video", videosLoaded ); 
}


function draw() {
  
  fill( 255 );
  textAlign( CENTER );
  textSize( 20 );
  
  if ( loaded ) {
    if ( !back_img ) {
      back_img = createGraphics( width, height );
      back_img.background( "#888" );
      back_img.fill( "#999" );
      back_img.stroke(0,0,0,0); // noStroke() not working
      back_img.rect( 20, 20, height-40, height-40 );
      back_img.fill(0,0,0,0); // noFill not working
      back_img.stroke( "white" );
      back_img.beginShape();
      for ( var i = 0, k = streams[0].frames.length; i < k ; i+=5 ) {
        back_img.vertex( map( streams[0].frames[i], 0, 12, 20, height-20) , 
                         map( streams[1].frames[i], 0, 12, height-20, 20) );
      }
      back_img.endShape();
    }
    image( back_img, 0, 0 );
    
    updateVideoTime();
    
    fill( "#993311" );
    noStroke();
    ellipse( map( streams[0].frames[current_pos], 0, 12, 20, height-20), 
             map( streams[1].frames[current_pos], 0, 12, height-20, 20), 10, 10 );
    
  } else {
    
    background( "#331199" );
    text( "Loading events and data …", width / 2, height / 2 );
  }
}

// callback function, see setup()
// receives all events in the group of type "video"
function videosLoaded ( videos ) {
  for ( var i in videos )
  {
    var v = videos[i];
    if ( v.fields["title"] == "D06T02_Janine_sync_AJA_1" )
    {
      api.listEventsForTimespan( groupId, 
                                 v.utc_timestamp, 
                                 v.utc_timestamp.getTime() + (v.duration * 1000.0), 
                                 'intersecting',
                                 eventsLoaded );
      video = v;
      console.log( video );
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
      
      data = event;
      
      time_offset = (data.utc_timestamp.getTime() - video.utc_timestamp.getTime()) / 1000.0;
      
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
          finishedLoadingData();
          data.duration = (_stream.frames.length / 25.0); // speed-fix, duration was missing on data event
        }
      }
    })(i) );
  }
}

// called from streamsLoaded() once all data has been loaded
function finishedLoadingData ()
{
  video_elt = createVideo( "http://d35vpnmjdsiejq.cloudfront.net/dh/piecemaker/" + video.fields.title + ".mp4", videoReady );
  video_elt.style("width", "640px");
  video_elt.style("height", height+"px");
  video_elt.showControls();
}

function videoReady () {
  loaded = true;
}

function updateVideoTime () {
  current_pos = parseInt( (video_elt.elt.currentTime - time_offset) * 25.0 );
  if ( current_pos < 0 ) current_pos = 0;
  if ( current_pos >= streams[0].frames.length ) current_pos = streams[0].frames.length-1;
}