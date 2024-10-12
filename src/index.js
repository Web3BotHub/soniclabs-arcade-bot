import App from './app.js'
import { GAMES, PRIVATE_KEYS, PROXIES } from './config.js'
import log from './log.js'
import Output from './output.js'
import { wait } from './utils.js'

async function run(account, proxy) {
  const app = new App(account, proxy)
  try {
    log.info(`Initializing account: ${PRIVATE_KEYS.indexOf(account) + 1}`)
    await app.connect()
    await app.getBalance()
    await app.connectToSonic()
    await app.getUser()
    await app.tryToUpdateReferrer()
    await app.createSession()
    await app.permitTypedMessage()

    // Game cycles
    for (const game in GAMES) {
      if (Object.prototype.hasOwnProperty.call(GAMES, game)) {
        try {
          while (!app.limitedGames[game]) {
            await app.playGame(game)
          }
        } catch (error) {
          throw error
        }
      }
    }

    // Schedule next cycle
    const duration = 4320000
    log.info(`Cycle complete for account ${app.address}. Pausing for ${Helper.msToTime(duration)}`)
    await wait(duration, account, `Delaying for next cycle: ${Helper.msToTime(duration)}`, app)

    return run(account, proxy)  // Restart cycle
  } catch (error) {
    log.info(`Account ${PRIVATE_KEYS.indexOf(account) + 1}: Error encountered. Retrying in 10 seconds.`)
    await wait(10000, account, `Error: ${error.message || JSON.stringify(error)}. Retrying in 10 seconds`, app)
    return run(account, proxy)  // Retry operation
  }
}

async function startBot() {
  try {
    Output.info('Starting Bot...')

    if (PROXIES.length !== PRIVATE_KEYS.length && PROXIES.length !== 0) {
      throw new Error(`Mismatch detected: ${PRIVATE_KEYS.length} accounts and ${PROXIES.length} proxies.`)
    }

    const tasks = PRIVATE_KEYS.map((account, index) => run(account, PROXIES[index]))
    await Promise.all(tasks)
  } catch (error) {
    console.error('Bot halted due to error:', error)
    log.error('Bot halted due to error:', error)
  }
}

(async () => {
  try {
    log.clear()
    console.clear()
    console.info('Application created!')
    console.log('----- SonicLabs Arcade Testnet BOT -----')
    console.log('Ensure your bot is up-to-date by running: git pull')
    console.log('---------------------------------------')

    await startBot()
  } catch (error) {
    Output.clearInfo()
    console.error('Critical error encountered, restarting...', error)
    await startBot()  // Retry after error
  }
})()
