/*
 *
 * JointControlItem actions
 *
 */

import {
  CHANGE_ANGLE,
} from './constants';

import _ from 'lodash';

const DEBOUNCE_INTERVAL = 500;

const debounceEmitSocketEvent = _.debounce((jointName, angle) => {
  window.socket.emit(`${jointName}:servo`, {
    value: angle,
  });
}, DEBOUNCE_INTERVAL);

export function changeAngle(jointName, angle, socketEmit) {
  if (socketEmit) {
    debounceEmitSocketEvent(jointName, angle);
  }
  return {
    type: CHANGE_ANGLE,
    jointName,
    angle,
  };
}
