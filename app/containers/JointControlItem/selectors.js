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

const selectJointControlItem = () => (state, props) => {
  const jointName = props.name;
  return createSelector(
    selectJointControlItemDomain(),
    (substate) => ({
      value: substate.toJS().joints[jointName].angle,
    })
  );
};

export default selectJointControlItem;
