export default {

  Servo: function (config) {
    this.value = 0

    this.to = (ms) => {
      console.log('servo', config.name, 'move', ms)
      this.value = ms
    }

    return this
  },

  Board: function () {
    this.on = (_, cb) => {
      cb()
    }
    return this
  }
}
