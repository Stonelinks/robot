/*
 *
 * CameraImg reducer
 *
 */

import { fromJS } from 'immutable';
import {
  CHANGE_CAMERA_IMG,
} from './constants';

const initialState = fromJS({
  frame: null,
});

function cameraImgReducer(state = initialState, action) {
  switch (action.type) {
    case CHANGE_CAMERA_IMG:
      return state.set('frame', `data:image/jpeg;base64,${action.frame}`);
    default:
      return state;
  }
}

export default cameraImgReducer;
