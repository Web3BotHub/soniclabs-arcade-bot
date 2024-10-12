import { Twisters } from 'twisters'
import App from './app.js'
import { PRIVATE_KEYS, RPC } from './config.js'

class Output {
  constructor() {
    this.twisters = new Twisters()
  }

  log(account, address = '', app = new App(), waiting = 'running') {
    this.twisters.put(address, {
      text: `Account ${PRIVATE_KEYS.indexOf(address) + 1}
-----------------
Address  : ${app.address ?? '-'}
Balance  : ${app.balance ?? '-'} ${RPC.SYMBOL}
Status   : ${account}
Waiting  : ${waiting}
-----------------`
    })
  }

  info(message) {
    this.twisters.put(2, {
      text: `\n-----------------\nInfo: ${message}\n-----------------`
    })
  }

  clearInfo() {
    this.twisters.remove(2)
  }

  clear(message) {
    this.twisters.remove(message)
  }
}

export default new Output()
