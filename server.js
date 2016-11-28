var http = require('http');
var express = require('express');
var spawn = require('child_process').spawn;
var Splitter = require('stream-split');
var WebSocketServer = require('ws').Server;

var WIDTH = 320 * 2;
var HEIGHT = 240 * 2;

var NALseparator = new Buffer([0, 0, 0, 1]);
var splitter = new Splitter(NALseparator);

var server = http.createServer();

var app = express();

app.set('port', (process.env.PORT || 3001));

// only serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
}

let wssOptions = {}
if (process.env.REACT_APP_WSS_PORT) {
  console.log(`websocket listening on ${process.env.REACT_APP_WSS_PORT}`);
  wssOptions.port = process.env.REACT_APP_WSS_PORT
  console.log('turn off CORS');
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
} else {
  console.log(`websocket listening on ${app.get('port')}`);
  wssOptions.server = server
}

var wss = new WebSocketServer(wssOptions);

app.use(express.static('public'));
app.use(express.static('node_modules/broadwayjs/Player'));

// var source = spawn('avconv', [
// 	'-f', 'video4linux2',
// 	'-i', '/dev/video0',
//   '-r', 30, // framerate
//   '-s', WIDTH + 'x' + HEIGHT,
//   '-pix_fmt', 'yuv420p',
//   '-c:v', 'libx264',
//   '-b:v', '600k',
//   '-bufsize', '600k',
//   '-vprofile', 'baseline',
//   '-tune', 'zerolatency',
//   '-f', 'rawvideo',
//   '-'
// ]);

var source = spawn('raspivid', [
  '-fps', 30,
  '-w', WIDTH,
  '-h', HEIGHT,
  '-b', '6000000',
  '-pf', 'baseline',
  '-t', '0',
  '-ih',
  '-n',
  '-o', '-'
]);

source.stdout.resume();

source.stderr.pipe(process.stderr);

// wss.on('connection', function (socket) {
//   console.log('new websocket connection');
//   // var streamHeader;
//   //
//   // streamHeader = new Buffer(8);
//   // streamHeader.write(STREAM_MAGIC_BYTES);
//   // streamHeader.writeUInt16BE(WIDTH, 4);
//   // streamHeader.writeUInt16BE(HEIGHT, 6);
//   //
//   // console.log('sending mpeg header');
//   // socket.send(streamHeader, { binary: true });
// });


source.stdout.pipe(splitter);

splitter.on('data', function (chunk) {
  try {
    wss.clients.forEach(function each(client) {

      if (client.busy) {
        return;
      }

      client.busy = true;
      client.busy = false;

      client.send(Buffer.concat([NALseparator, chunk]), {
        binary: true
      }, function (error) {
        client.busy = false;
      });
    });
  } catch (e) {
    // ignore error
  }
});

server.on('request', app);

server.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});
