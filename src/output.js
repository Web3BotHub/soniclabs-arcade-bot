import { Twisters } from 'twisters'
import { PRIVATE_KEYS, RPC } from './config.js'

class Output {
  constructor() {
    this.twisters = new Twisters()
  }

  log(app, message, waiting = 'running') {
    this.twisters.put(app.account, {
      text: `Account ${PRIVATE_KEYS.indexOf(app.account) + 1}
---------------------------------------------------------
Address      : ${app.address ?? '-'}
SmartAddress : ${app.smartAddress ?? '-'}
Balance      : ${app.balance ?? '-'} ${RPC.SYMBOL}
Points       : today: ${app.today_points ?? '-'} / total: ${app.total_points ?? '-'}
Status       : ${message}
Waiting      : ${waiting}
Game Status  :
- plinko     : ${app.gameStatus.plinko.message} (${app.gameStatus.plinko.waiting})
- singlewheel: ${app.gameStatus.singlewheel.message} (${app.gameStatus.singlewheel.waiting})
- mines      : ${app.gameStatus.mines.message} (${app.gameStatus.mines.waiting})
---------------------------------------------------------`
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
