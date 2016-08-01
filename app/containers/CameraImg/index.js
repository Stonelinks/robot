/*
 *
 * CameraImg
 *
 */

import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import selectCameraImg from './selectors';
import styles from './styles.css';
import { changeCameraImg } from './actions';
import Img from '../../components/Img';

export class CameraImg extends React.Component { // eslint-disable-line react/prefer-stateless-function
  componentDidMount() {
    window.socket.on('frame', (cameraData) => {
      this.props.onWebsocketEvent(cameraData.frame);
    });
  }

  render() {
    return (
      <div className={styles.cameraImg}>
        <Img src={this.props.src || ''} alt="webcam" />
      </div>
    );
  }
}

CameraImg.propTypes = {
  src: PropTypes.string,
  onWebsocketEvent: PropTypes.func,
};

const mapStateToProps = selectCameraImg();

function mapDispatchToProps(dispatch) {
  return {
    onWebsocketEvent(cameraData) {
      dispatch(changeCameraImg(cameraData));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(CameraImg);
