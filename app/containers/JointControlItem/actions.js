/*
 *
 * JointControlItem actions
 *
 */

import {
  CHANGE_ANGLE,
} from './constants';

export function changeAngle(jointName, angle, socketEmit) {
  if (socketEmit) {
    window.socket.emit(`${jointName}:servo`, {
      value: angle,
    });
  }
  return {
    type: CHANGE_ANGLE,
    jointName,
    angle,
  };
}
