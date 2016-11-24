var http = require('http');
var express = require('express');
var spawn = require('child_process').spawn;
var WebSocketServer = require('ws').Server;

var THERMAL_CAMERA = 1;
var WIDTH = 320;
var HEIGHT = 240;
var STREAM_MAGIC_BYTES = 'jsmp';

var server = http.createServer();

var app = express();

app.set('port', (process.env.PORT || 3001));

// Express only serves static assets in production
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

var ffmpegParams = [
	'-s', WIDTH + 'x' + HEIGHT,
	'-f', 'video4linux2',
	'-i', '/dev/video0',
	'-f', 'mpeg1video',
	'-r', '24',
	'-loglevel', 'error',
	'-'
];

var ffmpeg = spawn('ffmpeg', ffmpegParams);

ffmpeg.stdout.resume();

ffmpeg.stderr.pipe(process.stderr);

wss.on('connection', function (socket) {
  var streamHeader;

  streamHeader = new Buffer(8);
  streamHeader.write(STREAM_MAGIC_BYTES);
  streamHeader.writeUInt16BE(WIDTH, 4);
  streamHeader.writeUInt16BE(HEIGHT, 6);

  console.log('sending mpeg header');
  socket.send(streamHeader, { binary: true });
});

ffmpeg.stdout.on('data', function (chunk) {
  try {

    wss.clients.forEach(function each(client) {
      client.send(chunk, { binary: true });
    });

  } catch (e) {
    // ignore error
  }
});

// app.post('/die', function(req, res) {
// 	ffmpeg.kill('SIGTERM');
//
// 	ffmpeg.on('exit', function() {
// 		currentSocket.close();
// 		res.end('OK');
// 		server.close();
// 	});
// });

server.on('request', app);

server.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});



// const express = require('express');
//
// const app = express();
//
//
// app.get('/api/food', (req, res) => {
//   // const param = req.query.q;
//   //
//   // if (!param) {
//   //   res.json({
//   //     error: 'Missing required parameter `q`',
//   //   });
//   //   return;
//   // }
//   //
//   // // WARNING: Not for production use! The following statement
//   // // is not protected against SQL injections.
//   // const r = db.exec(`
//   //   select ${COLUMNS.join(', ')} from entries
//   //   where description like '%${param}%'
//   //   limit 100
//   // `);
//   //
//   // if (r[0]) {
//   //   res.json(
//   //     r[0].values.map((entry) => {
//   //       const e = {};
//   //       COLUMNS.forEach((c, idx) => {
//   //         // combine fat columns
//   //         if (c.match(/^fa_/)) {
//   //           e.fat_g = e.fat_g || 0.0;
//   //           e.fat_g = (
//   //             parseFloat(e.fat_g, 10) + parseFloat(entry[idx], 10)
//   //           ).toFixed(2);
//   //         } else {
//   //           e[c] = entry[idx];
//   //         }
//   //       });
//   //       return e;
//   //     })
//   //   );
//   // } else {
//   //   res.json([]);
//   // }
// });
