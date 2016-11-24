import React, { Component } from 'react';
import './App.css';

import jsmpeg from 'jsmpeg'

class WebCam extends Component {

  componentDidMount() {
    this.initialize()
  }

  initialize() {
    const client = new WebSocket(this.props.address);
    const player = new jsmpeg(client, {
      canvas: this.canvas,
      forceCanvas2D: true
    });

    client.addEventListener('close', function () {
      console.log('Got close event, reconnecting');
      player.stop()
      setTimeout(this.initialize, 1000);
    });
  }

  render() {
    return (
      <canvas
        ref={(canvas) => this.canvas = canvas}
        height={this.props.height}
        width={this.props.width}
        style={{
          height:`${this.props.height}px`,
          width:`${this.props.width}px`
        }} />
    )
  }
}

WebCam.defaultProps = {
  address: 'ws://' + window.location.host,
  width: 320,
  height: 240
};

class App extends Component {
  render() {

    const websocketAddress = 'ws://' + (process.env.REACT_APP_WSS_PORT ? window.location.hostname + ':' + process.env.REACT_APP_WSS_PORT : window.location.host)
    console.log(`websocket address: ${websocketAddress}`);

    return (
      <div className="App">
        <div className="App-header">
          <h2>Robot</h2>
        </div>
        <p className="App-intro">
          <WebCam address={websocketAddress}/>
        </p>
      </div>
    );
  }
}

export default App;
