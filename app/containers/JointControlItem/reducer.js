/*
 *
 * JointControlItem reducer
 *
 */

import { fromJS } from 'immutable';
import {
  CHANGE_ANGLE,
} from './constants';

const initialState = fromJS({
  isInital: true,
  joints: {},
});
function jointControlItemReducer(state = initialState, action) {
  // hack to load window.initialSyncData correctly
  if (state.get('isInital')) {
    state = fromJS({ // eslint-disable-line
      isInital: false,
      joints: window.initialSyncData && window.initialSyncData.joints,
    });
  }

  let joints = state.get('joints');
  switch (action.type) {
    case CHANGE_ANGLE:
      joints = joints.set(action.jointName, {
        angle: action.angle,
      });
      return state.set('joints', joints);
    default:
      return state;
  }
}

export default jointControlItemReducer;
