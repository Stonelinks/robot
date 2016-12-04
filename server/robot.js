
import robotConfig from '../robotConfig'

import realFive from 'johnny-five'
import fiveMock from './_mocks'

const five = process.env.NODE_ENV === 'production' ? realFive : fiveMock

const SERVO_MOVE_DURATION_MS = process.env.SERVO_MOVE_DURATION_MS || 500

class Joint {
  constructor (jointConfig) {
    this.name = jointConfig.name
    this.servo = new five.Servo(jointConfig)
    console.log('joint initialized', jointConfig)
    this.angle = (jointConfig.range[1] - jointConfig.range[0]) / 2.0
    this.servo.to(this.angle, SERVO_MOVE_DURATION_MS)
  }

  moveServo (angle) {
    this.angle = parseInt(angle, 10)
    this.servo.to(angle, SERVO_MOVE_DURATION_MS)
  }

  onWSConnect (ws) {
    ws.on('message', (data) => {
      const msg = JSON.parse(data)
      if (msg.name === this.name) {
        this.moveServo(parseFloat(msg.angle))
        ws.broadcast(data)
      }
    })

    ws.send(JSON.stringify({
      name: this.name,
      angle: this.angle
    }))
  }
}

class Robot {
  constructor () {
    this.joints = robotConfig.devices.joints.map(this.createJoint)
    console.log('robot initialized')
  }

  createJoint (jointConfig) {
    return new Joint(jointConfig)
  }

  forEachJoint (cb) {
    this.joints.forEach((joint) => {
      cb(joint)
    })
  }

  onWSConnect (ws) {
    this.forEachJoint((joint) => {
      joint.onWSConnect(ws)
    })
  }

  onWSDisconnect () {
    console.log('robot ws disconnect')
  }
}

//   turnPumpOn: () => {
//     this.pumpmotor.turnOn();
//     this.pumpvalve.turnOff();
//   },
//
//   turnPumpOff: () => {
//     this.pumpmotor.turnOff();
//     this.pumpvalve.turnOn();
//     console.log('sup');
//   },
// });

export default function (app, wss) {
  const board = new five.Board({
    repl: false
  })

  board.on('ready', () => {
    const robot = new Robot()
    wss.on('connection', (ws) => {
      ws.broadcast = function (data) {
        wss.clients.forEach((client) => {
          if (client !== ws) {
            client.send(data)
          }
        })
      }
      robot.onWSConnect(ws)

      ws.on('disconnect', () => {
        robot.onWSDisconnect(ws)
      })
    })
  })
}
