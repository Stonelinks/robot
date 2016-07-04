/*
 *
 * JointControlItem
 *
 */

import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import selectJointControlItem from './selectors';
import styles from './styles.css';
import { changeAngle } from './actions';
import H3 from '../../components/H3';
import Slider from '../../components/Slider';

export class JointControlItem extends React.Component { // eslint-disable-line react/prefer-stateless-function

  proxySliderChange(mouseEvent, value) {
    this.props.onSliderChange(this.props.name, value);
  }

  render() {
    return (
      <div className={styles.jointControlItem}>
        <H3><code>{this.props.name}</code></H3>
        <Slider min={this.props.min} max={this.props.max} onChange={::this.proxySliderChange} />
      </div>
    );
  }
}

JointControlItem.propTypes = {
  name: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  onSliderChange: PropTypes.func,
};

const mapStateToProps = selectJointControlItem();

function mapDispatchToProps(dispatch) {
  return {
    onSliderChange(jointName, angle) {
      dispatch(changeAngle(jointName, angle));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(JointControlItem);
