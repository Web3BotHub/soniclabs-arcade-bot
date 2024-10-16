import bip39 from 'bip39'
import log from './log.js'
import output from './output.js'

export function getPrivateKeyType(input) {
  if (bip39.validateMnemonic(input)) return 'Secret Phrase'
  if (/^[a-fA-F0-9]{64}$/.test(input)) return 'Private Key'
  return 'Unknown'
}

export function toHumanTime(duration) {
  const hours = Math.floor(duration / (1000 * 60 * 60))
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((duration % (1000 * 60)) / 1000)
  return `${hours}h ${minutes}m ${seconds}s`
}

export function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Linux; Android 8.0.0; Ilium Alpha 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.101 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 6.0; P027) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.81 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; rv:68.0) Gecko/20100101 Firefox/68.0 anonymized by Abelssoft 2028724395',
    'Mozilla/5.0 (Linux; Android 7.0; F3216) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.116 Mobile Safari/537.36 EdgA/45.07.4.5059',
    'Mozilla/5.0 (Linux; Android 7.0; BG2-U03) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 9; ANE-LX1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 YaBrowser/20.8.2.90.00 SA/3 Mobile Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/609.3.5.1.3 (KHTML, like Gecko) Version/13.1.2 Safari/609.3.5.1.3',
    'Mozilla/5.0 (Linux; Android 10; RMX2030) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 7.0; Twist (2018)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.101 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 9; S9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Safari/537.36',
  ]

  return userAgents[Math.floor(Math.random() * userAgents.length)]
}

export function wait(duration, message, app) {
  return new Promise(resolve => {
    let remainingTime = duration

    log.info(app.account, `Waiting for ${toHumanTime(remainingTime)}`)

    const showRemainingTime = () => {
      output.log(app, message, `${toHumanTime(remainingTime)}`)
    }

    showRemainingTime()
    const interval = setInterval(() => {
      remainingTime -= 1000
      showRemainingTime()
      if (remainingTime <= 0) {
        clearInterval(interval)
        resolve()
      }
    }, 1000)

    setTimeout(async () => {
      clearInterval(interval)
      await output.clearInfo()
      resolve()
    }, duration)
  })
}
