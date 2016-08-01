import { createSelector } from 'reselect';

/**
 * Direct selector to the cameraImg state domain
 */
const selectCameraImgDomain = () => state => state.get('cameraImg');

/**
 * Other specific selectors
 */


/**
 * Default selector used by CameraImg
 */

const selectCameraImg = () => createSelector(
  selectCameraImgDomain(),
  (substate) => ({
    src: substate.toJS().frame,
  })
);

export default selectCameraImg;
export {
  selectCameraImgDomain,
};
