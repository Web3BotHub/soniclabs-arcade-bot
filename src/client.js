import { HttpsProxyAgent } from 'https-proxy-agent'
import log from './log.js'
import { getRandomUserAgent } from './utils.js'

export class Client {
  constructor(baseUrl, proxy, host) {
    this.baseUrl = baseUrl
    this.host = host
    this.origin = `https://${host}`
    this.userAgent = getRandomUserAgent()
    this.proxy = proxy
  }

  generateHeaders(token) {
    const headers = {
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
      'Content-Type': 'application/json',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Site': 'same-site',
      'Sec-Fetch-Mode': 'cors',
      'Host': this.host,
      'Origin': this.origin,
      'Pragma': 'no-cache',
      'Referer': this.origin,
      'User-Agent': this.userAgent,
    }
    if (token) headers['Authorization'] = `Bearer ${token}`
    return headers
  }

  async fetch(url, method, token, body = {}, customHeaders = {}, referer) {
    const requestUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`
    const headers = { ...customHeaders, ...this.generateHeaders(token) }
    const options = { method, headers, referer }

    try {
      log.info(`${method} Request URL: ${requestUrl}`)
      log.info(`Request Headers: ${JSON.stringify(headers)}`)

      if (method !== 'GET') {
        options.body = JSON.stringify(body)
        log.info(`Request Body: ${options.body}`)
      }

      if (this.proxy) {
        options.agent = new HttpsProxyAgent(this.proxy, { rejectUnauthorized: false })
      }

      const response = await fetch(requestUrl, options)

      log.info(`Response Status: ${response.status} ${response.statusText}`)

      const contentType = response.headers.get('content-type')
      let responseData = contentType && contentType.includes('application/json')
        ? await response.json()
        : { status: response.status, message: await response.text() }

      log.info(`Response Data: ${JSON.stringify(responseData)}`)

      if (response.ok) {
        responseData.status = 200 // Normalize status to 200 for successful responses
        return responseData
      } else {
        throw new Error(`${response.status} - ${response.statusText}`)
      }
    } catch (error) {
      if (requestUrl.includes('something') && error.message.includes('401')) {
        return { status: 200 }
      } else {
        log.error(`Error: ${error.message}`)
        throw error
      }
    }
  }
}
