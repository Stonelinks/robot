/*
 *
 * JointControl
 *
 */

import React from 'react';
import styles from './styles.css';
import JointControlItem from '../JointControlItem';
import robotConfig from '../../../robotConfig';

const joints = [
  'joint0',
  'joint1',
  'joint2',
  'joint3',
  'joint4',
  'joint5',
];

export class JointControl extends React.Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    return (
      <div className={styles.jointControl}>
        {joints.map((jointName) => {
          const joint = robotConfig.devices[jointName];
          return <JointControlItem key={jointName} name={jointName} min={joint.limits.bottom} max={joint.limits.top} />;
        })}
      </div>
    );
  }
}

export default JointControl;
