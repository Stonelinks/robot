/*
 *
 * JointControlItem actions
 *
 */

import {
  CHANGE_ANGLE,
} from './constants';

import io from 'socket.io-client';

function getSocketURL(jointName) {
  return `${window.location.protocol}//${window.location.hostname}:3001/api/robots/7bot/devices/${jointName}`;
}

const jointSockets = {};
function getOrCreateJointSocket(jointName) {
  if (!jointSockets[jointName]) {
    const socket = io(getSocketURL(jointName));
    // socket.on('/', function() {
    //   debugger
    // })
    // socket.emit('/')
    jointSockets[jointName] = socket;
  }
  return jointSockets[jointName];
}

export function changeAngle(jointName, angle) {
  console.log(jointName, angle);
  const socket = getOrCreateJointSocket(jointName);
  socket.emit('angle', angle);
  return {
    type: CHANGE_ANGLE,
    jointName,
    angle,
  };
}
