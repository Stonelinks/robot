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
  angle: 0,
});

function jointControlItemReducer(state = initialState, action) {
  switch (action.type) {
    case CHANGE_ANGLE:
      return state.set('angle', action.angle);
    default:
      return state;
  }
}

export default jointControlItemReducer;
