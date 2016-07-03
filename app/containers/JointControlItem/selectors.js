import { createSelector } from 'reselect';

/**
 * Direct selector to the jointControlItem state domain
 */
const selectJointControlItemDomain = () => state => state.get('jointControlItem');

/**
 * Other specific selectors
 */


/**
 * Default selector used by JointControlItem
 */

const selectJointControlItem = () => createSelector(
  selectJointControlItemDomain(),
  (substate) => substate.toJS()
);

export default selectJointControlItem;
export {
  selectJointControlItemDomain,
};
