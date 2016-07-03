/*
 *
 * JointControl
 *
 */

import React from 'react';
import { connect } from 'react-redux';
import styles from './styles.css';
import JointControlItem from '../JointControlItem';
import robotConfig from '../../../robotConfig';

export class JointControl extends React.Component { // eslint-disable-line react/prefer-stateless-function
  render() {

    let jointComponents = [];
    for (let deviceName in robotConfig.devices) {
      if (deviceName.startsWith('joint')) {
        let device = robotConfig.devices[deviceName];
        jointComponents.push(<JointControlItem key={deviceName} name={deviceName} min={device.limits.bottom} max={device.limits.top} />);
      }
    }

    return (
      <div className={styles.jointControl}>
        {jointComponents}
      </div>
    );
  }
}

export default JointControl;
