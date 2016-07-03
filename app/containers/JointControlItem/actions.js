/*
 *
 * JointControlItem actions
 *
 */

import {
  CHANGE_ANGLE,
} from './constants';

import io from 'socket.io-client';
import _ from 'lodash';

function getSocketURL(jointName) {
  return `${window.location.protocol}//${window.location.hostname}:3001/api/robots/7bot/devices/${jointName}`
}

let _jointSockets = {};
function getOrCreateJointSocket(jointName) {
  if (!_jointSockets[jointName]) {
    let socket = io(getSocketURL(jointName));
    // socket.on('/', function() {
    //   debugger
    // })
    // socket.emit('/')
    _jointSockets[jointName] = socket
  }
  return _jointSockets[jointName];
}

export function changeAngle(jointName, angle) {
  console.log(arguments);
  let socket = getOrCreateJointSocket(jointName);
  socket.emit('angle', angle);
  return {
    type: CHANGE_ANGLE,
    jointName,
    angle,
  };
}
