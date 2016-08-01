/*
 *
 * JointControlItem
 *
 */

import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import selectJointControlItem from './selectors';
import styles from './styles.css';
import { changeAngle } from './actions';
import Slider from '../../components/Slider';

export class JointControlItem extends React.Component { // eslint-disable-line react/prefer-stateless-function
  componentDidMount() {
    window.socket.on(`${this.props.name}:servo`, (servoData) => {
      this.props.onWebsocketEvent(this.props.name, servoData.value);
    });
  }

  proxySliderChange(mouseEvent, value) {
    this.props.onSliderChange(this.props.name, value);
  }

  render() {
    return (
      <div className={styles.jointControlItem}>
        <Slider name={this.props.name} min={this.props.min} max={this.props.max} value={this.props.value} onChange={::this.proxySliderChange} />
      </div>
    );
  }
}

JointControlItem.propTypes = {
  name: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  value: PropTypes.number,
  onSliderChange: PropTypes.func,
  onWebsocketEvent: PropTypes.func,
};

const mapStateToProps = selectJointControlItem();

function mapDispatchToProps(dispatch) {
  return {
    onSliderChange(jointName, angle) {
      dispatch(changeAngle(jointName, angle, true));
    },
    onWebsocketEvent(jointName, angle) {
      dispatch(changeAngle(jointName, angle));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(JointControlItem);
