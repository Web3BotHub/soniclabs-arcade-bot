import { ethers } from 'ethers'
import { Client } from './client.js'
import { CONTRACT as CONTRACT_ADDRESS, GAMES, PRIVATE_KEYS, REFERRER_CODE, RPC } from './config.js'
import log from './log.js'
import { getPrivateKeyType, wait } from './utils.js'

export default class App extends Client {
  constructor(account, smartAddress, proxy) {
    super('https://airdrop.soniclabs.com', proxy, 'airdrop.soniclabs.com')
    this.sessionId = 1
    this.wallet = null
    this.today_points = null
    this.total_points = null
    this.account = account
    this.address = null
    this.smartAddress = smartAddress
    this.permitSignature = null
    this.referrerCode = REFERRER_CODE
    this.limitedGames = {}
    this.provider = new ethers.JsonRpcProvider(RPC.RPCURL, RPC.CHAINID)
  }

  async connect() {
    try {
      const cleanPrivateKey = this.account.replace(/^0x/, '')
      await wait(2000, this.account, 'Connecting to account: ' + (PRIVATE_KEYS.indexOf(this.account) + 1), this)
      const accountType = getPrivateKeyType(cleanPrivateKey)
      log.info('Account type: ' + accountType)

      if (accountType === 'Mnemonic') {
        this.wallet = ethers.Wallet.fromMnemonic(cleanPrivateKey, this.provider)
      } else if (accountType === 'Private Key') {
        this.wallet = new ethers.Wallet(cleanPrivateKey, this.provider)
      } else {
        throw new Error('Invalid account Secret Phrase or Private Key')
      }

      this.address = this.wallet.address
      await wait(2000, this.account, 'Wallet address: ' + JSON.stringify(this.address), this)
    } catch (error) {
      throw error
    }
  }

  async createSession() {
    await wait(2000, this.account, 'Creating session', this)
    const response = await this.fetch('https://arcade.hub.soniclabs.com/rpc', 'POST', undefined, {
      jsonrpc: '2.0',
      id: this.sessionId,
      method: 'createSession',
      params: {
        owner: this.wallet.address,
        until: Date.now() + 86400000 // 24 hours in milliseconds
      }
    }, { network: 'SONIC', pragma: 'no-cache', 'x-owner': this.address }, 'https://arcade.soniclabs.com/', true)

    this.sessionId += 1
    if (response.status === 200) {
      await wait(500, this.account, 'Successfully create session', this)
    } else {
      throw Error('Failed to create session')
    }
  }

  async getBalance(refresh = false) {
    try {
      if (!refresh) {
        await wait(500, this.account, 'Fetching balance of address: ' + this.wallet.address, this)
      }
      this.balance = ethers.formatEther(await this.provider.getBalance(this.wallet.address))
      await wait(500, this.account, 'Balance updated: ' + this.balance, this)
    } catch (error) {
      log.error(`Failed to get balance: ${error}`)
      throw error
    }
  }

  async getPoints() {
    await wait(3000, this.account, "Getting user points", this)
    const response = await this.fetch("https://arcade.gateway.soniclabs.com/game/points-by-player?wallet=" + this.smartAddress, 'GET', undefined, undefined, undefined, 'https://arcade.soniclabs.com/', true)

    if (response.status == 200) {
      this.today_points = response.today
      this.total_points = response.totalPoints
      await wait(1500, this.account, "Successfully get total points", this)
    } else {
      throw Error("Failed to get points")
    }
  }

  async connectToSonic() {
    await wait(2000, this.account, 'Connecting to Sonic Arcade', this)

    const messageToSign = "I'm joining Sonic Airdrop Dashboard with my wallet, have been referred by " + this.referrerCode + ", and I agree to the terms and conditions.\nWallet address:\n" + this.address + "\n"
    log.info('Message to sign: ' + messageToSign)

    this.signatureMessage = await this.wallet.signMessage(messageToSign)
    log.info('signature: ' + this.signatureMessage)

    await wait(2000, this.account, 'Successfully connected to Sonic Dapp', this)
  }

  async getUser() {
    await wait(2000, this.account, 'Fetching user information', this)
    const response = await this.fetch(`/api/trpc/user.findOrCreate?batch=1&input=${encodeURIComponent(JSON.stringify({ 0: { json: { address: this.wallet.address } } }))}`, 'GET')
    if (response.status == 200) {
      this.user = response[0].result.data.json
      await wait(500, this.account, 'User information retrieved successfully', this)
    } else {
      throw new Error('Failed to get user information')
    }
  }

  async tryToUpdateReferrer() {
    try {
      await wait(2000, this.account, 'Validating invite code', this)

      if (this.user.invitedCode == null) {
        const response = await this.fetch('/api/trpc/user.setInvited?batch=1', 'POST', undefined, {
          json: { address: this.wallet.address, invitedCode: this.invitedCode, signature: this.signatureMessage }
        })

        if (response.status == 200) {
          await wait(3000, this.account, 'Successfully updated the invite code', this)
          await this.getUser()
        }
      } else {
        await wait(3000, this.account, 'Invite code already set', this)
      }
    } catch (error) {
      log.error(`Failed to update user invite code: ${error}`)
    }
  }

  async permitTypedMessage() {
    await wait(2000, this.account, 'Try To Permit Sonic Arcade Contract', this)
    const response = await this.fetch('https://arcade.hub.soniclabs.com/rpc', 'POST', undefined, {
      'jsonrpc': '2.0',
      'id': this.sessionId,
      'method': 'permitTypedMessage',
      'params': {
        'owner': this.address
      }
    }, {
      'network': 'SONIC',
      'pragma': 'no-cache',
      'priority': 'u=1, i',
      'x-owner': this.address
    }, 'https://arcade.soniclabs.com/', true)
    this.sessionId += 1

    if (response.status == 200) {
      const message = JSON.parse(response.result.typedMessage)
      await wait(500, this.account, 'Successfully Create Permit', this)
      await wait(500, this.account, 'Approving Permit Message', this)
      this.permitSignature = await this.wallet.signTypedData(message.json.domain, message.json.types, message.json.message)
      await this.permit()
    } else {
      throw Error('Failed to Create Sonic Arcade Sessions')
    }
  }

  async performRpcRequest(method, params, headers, referer) {
    return this.fetch('https://arcade.hub.soniclabs.com/rpc', 'POST', undefined, {
      jsonrpc: '2.0',
      id: this.sessionId,
      method: method,
      params: params
    }, headers || { network: 'SONIC', pragma: 'no-cache', 'priority': 'u=1, i', 'x-owner': this.address }, 'https://arcade.soniclabs.com/')
  }

  async permit() {
    await wait(2000, this.account, 'Submitting contract permit', this)

    const response = await this.performRpcRequest('permit', {
      owner: this.address,
      signature: this.permitSignature
    })

    this.sessionId += 1

    if (!response.error) {
      this.part = response.result.hashKey
      await wait(2000, this.account, 'Permit submitted successfully', this)
    } else {
      throw new Error(`Failed to submit permit: ${response.error.message}`)
    }
  }

  async playPlinko() {
    await this.playGame('plinko')
  }

  async playWheel() {
    await this.playGame('wheel')
  }

  async playMine() {
    await this.playGame('mine')
    await wait(2000, this.account, "placed", this)
    await wait(2000, this.account, "Claiming mine game reward", this)
    const response = await this.fetch('https://arcade.hub.soniclabs.com/rpc', 'POST', undefined, {
      'jsonrpc': "2.0",
      'id': this.sessionId,
      'method': "call",
      'params': {
        'call': {
          'dest': CONTRACT_ADDRESS,
          'data': "0x0d942fd00000000000000000000000008bbd8f37a3349d83c85de1f2e32b3fd2fce2468e0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000e328a0b1e0be7043c9141c2073e408d1086e117500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000007656e6447616d65000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
          'value': '0n'
        },
        'owner': this.address,
        'part': this.part,
        'permit': this.permitSignature
      }
    }, {
      'network': "SONIC",
      'pragma': "no-cache",
      'priority': "u=1, i",
      'x-owner': this.address
    }, 'https://arcade.soniclabs.com/', true)

    if (response.error) {
      await wait(3000, this.account, `Failed to claim mine game: ${response.error?.["message"]}`, this)
    }

    if (response.result?.["hash"]?.['errorTypes']) {
      await wait(2000, this.account, `Claim failed: ${response.result?.["hash"]?.["actualError"]?.["details"]}`, this)
    } else {
      await wait(3000, this.account, "Successfully play and claim mine game.", this)
    }
  }

  async playGame(name) {
    if (!Object.prototype.hasOwnProperty.call(GAMES, name)) {
      throw new Error(`Undefined game: [${name}]`)
    }

    const callData = GAMES[name]

    await wait(3000, this.account, `Playing game: [${name}]`, this)

    const response = await this.performRpcRequest('call', {
      call: callData,
      owner: this.address,
      part: this.part,
      permit: this.permitSignature
    })

    this.sessionId += 1

    if (!response.error) {
      await wait(3000, this.account, `Successfully played game: [${name}]`, this)
    } else {
      const errorMessage = response.error?.message || 'Unknown'

      if (errorMessage.includes('limit')) {
        this.limitedGames[name] = true
        await wait(3000, this.account, errorMessage)
      } else if (errorMessage.includes('random number')) {
        await wait(20000, this.account, errorMessage)
      } else if (errorMessage.includes('Permit')) {
        throw new Error(`Failed to play game: [${name}]`.errorMessage)
      }

      throw new Error(`Failed to play game: [${name}], error: ${errorMessage}`)
    }
  }
}
