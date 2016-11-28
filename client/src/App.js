import React, { Component } from 'react';
import './App.css';

import Broadway from 'broadwayjs'

class WebCam extends Component {

  componentDidMount() {
    this.initialize()
  }

  initialize() {
    const client = new WebSocket(this.props.address);
    client.binaryType = 'arraybuffer';

    const decoderURL = (process.env.REACT_APP_BROADWAY_PLAYER_WORKER ? window.location.protocol + '//' + window.location.hostname + process.env.REACT_APP_BROADWAY_PLAYER_WORKER : '/Decoder.js')
    var response;

    var get = new XMLHttpRequest();
    get.open("GET", decoderURL, false);
    get.onreadystatechange = function () {
      if (get.readyState == 4 && get.status == 200) {
        response = 'var global = {};\n' + get.responseText;
      }
    }
    get.send();

    var blob;
    try {
      blob = new Blob([response], { type: 'application/javascript' });
    } catch (e) { // Backwards-compatibility
      window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
      blob = new BlobBuilder(); // eslint-disable-line
      blob.append(response);
      blob = blob.getBlob();
    }

    var p = new Broadway.Player({
      useWorker: true,
      workerFile: URL.createObjectURL(blob),
      reuseMemory: true,
      size: {
        height: this.props.height,
        width: this.props.width
      }
    });

    this.container.appendChild(p.canvas)

    client.onmessage = function (e) {
      const frame = new Uint8Array(e.data)
      var naltype
      if (frame.length > 4) {
        if (frame[4] == 0x65) {
          naltype = "I frame";
        } else if (frame[4] == 0x41) {
          naltype = "P frame";
        } else if (frame[4] == 0x67) {
          naltype = "SPS";
        } else if (frame[4] == 0x68) {
          naltype = "PPS";
        }
      }
      // console.log(naltype);
      p.decode(frame)
    }

    client.addEventListener('close', function () {
      console.log('Got close event, reconnecting');
      // player.stop()
      setTimeout(this.initialize, 1000);
    });
  }
  render() {
    return (
      <div
        ref={(c) => this.container = c}
        height={this.props.height}
        width={this.props.width}
        style={{
          height:`${this.props.height}px`,
          width:`${this.props.width}px`,
          margin: '0 auto'
        }} />
    )
  }
}

WebCam.defaultProps = {
  address: null,
  width: 320 * 2,
  height: 240 * 2
};

class App extends Component {
  render() {

    const websocketAddress = 'wss://' + (process.env.REACT_APP_WSS_PORT ? window.location.hostname + ':' + process.env.REACT_APP_WSS_PORT : window.location.host)
    console.log(`websocket address: ${websocketAddress}`);

    return (
      <div className="App">
        <div className="App-header">
          <h2>Luke's Robot</h2>
        </div>
        <div className="App-intro">
          <WebCam address={websocketAddress}/>
        </div>
      </div>
    );
  }
}

export default App;
