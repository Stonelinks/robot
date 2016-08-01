/*
 *
 * CameraImg actions
 *
 */

import {
  CHANGE_CAMERA_IMG,
} from './constants';

export function changeCameraImg(frame) {
  return {
    type: CHANGE_CAMERA_IMG,
    frame,
  };
}
