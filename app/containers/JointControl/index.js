/*
 *
 * JointControl
 *
 */

import React from 'react';
import styles from './styles.css';
import JointControlItem from '../JointControlItem';
import robotConfig from '../../../robotConfig';

export class JointControl extends React.Component { // eslint-disable-line react/prefer-stateless-function
  get jointControlItems() {
    return robotConfig.devices.joints.map((joint) => <JointControlItem key={joint.name} name={joint.name} min={joint.range[0]} max={joint.range[1]} />);
  }

  render() {
    return (
      <div className={styles.jointControl}>
        {this.jointControlItems}
      </div>
    );
  }
}

export default JointControl;
