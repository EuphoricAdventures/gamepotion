import uuid from '../abstractions/uuid/index.dist.js'
import guessNameFromUserlandId from './guessNameFromUserlandId.js'

const VALID_SUBSCRIPTION_IDS = [
  'free',
  'pro',
  'boss'
]

class User {
  constructor (json = {}) {
    this.id = json.id || uuid()
    this.teamId = json.teamId || null
    this.createdAt = json.createdAt || Math.floor(new Date() / 1000)
    this.name = json.name || null
    this.userlandId = json.userlandId || 'a@b.c'
    this.passwordHash = json.passwordHash || null
    this.subscriptionEvents = json.subscriptionEvents || []
  }

  updateSubscription (id) {
    if (!VALID_SUBSCRIPTION_IDS.includes(id)) {
      throw new Error(`subscription id ${id} is not one of ${VALID_SUBSCRIPTION_IDS.join('/')}`)
    }
    this.subscriptionEvents.push({
      id,
      when: Math.floor(new Date() / 1000)
    })
  }

  getSubscription () {
    if (this.subscriptionEvents.length === 0) {
      this.updateSubscription('free')
    }
    return this.subscriptionEvents[this.subscriptionEvents.length - 1]
  }

  toApi () {
    const json = {
      id: this.id,
      teamId: this.teamId,
      createdAt: this.createdAt,
      name: this.name,
      userlandId: this.userlandId,
      subscription: this.getSubscription()
    }
    return JSON.parse(JSON.stringify(json))
  }

  toApiList () {
    const json = {
      id: this.id,
      teamId: this.teamId,
      name: this.name,
      userlandId: this.userlandId
    }
    return JSON.parse(JSON.stringify(json))
  }

  toDatastore () {
    const json = {
      id: this.id,
      teamId: this.teamId,
      createdAt: this.createdAt,
      name: this.name,
      userlandId: this.userlandId,
      passwordHash: this.passwordHash,
      subscriptionEvents: this.subscriptionEvents
      // someBoolean: (this.someBoolean === true),
    }
    return JSON.parse(JSON.stringify(json))
  }

  fromApiPost (json) {
    if (typeof json.userlandId !== 'string' || json.userlandId.length === 0) { // -1 or 0
      throw new Error('userlandId is not valid')
    }
    this.teamId = (typeof json.teamId === 'string') ? json.teamId : this.teamId
    this.name = guessNameFromUserlandId(json.userlandId)
    this.userlandId = json.userlandId
  }

  fromApiPatch (json) {
    if (typeof json.teamId === 'string') {
      if (json.teamId.length === 0) {
        throw new Error('teamId is not valid')
      } else {
        this.teamId = json.teamId
      }
    }
    if (typeof json.name === 'string') {
      if (json.name.length === 0) {
        throw new Error('name is not valid')
      } else {
        this.name = json.name
      }
    }
    if (typeof json.userlandId === 'string') {
      if (json.userlandId.length === 0) {
        throw new Error('userlandId is not valid')
      } else {
        this.userlandId = json.userlandId
      }
    }
  }

  clientFromApiGet (json) {
    this.id = json.id
    this.teamId = json.teamId
    this.name = json.name
    this.userlandId = json.userlandId
    this.subscription = json.subscription
  }
}

export default User
