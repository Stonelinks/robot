/*
 *
 * JointControlItem actions
 *
 */

import {
  CHANGE_ANGLE,
} from './constants';

import io from 'socket.io-client';
const socket = io(window.location.origin);

export function changeAngle(jointName, angle) {
  console.log(jointName, angle);
  socket.emit(`${jointName}:servo`, {
    value: angle,
  });
  return {
    type: CHANGE_ANGLE,
    jointName,
    angle,
  };
}
