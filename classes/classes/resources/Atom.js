import Resource from '../Resource.js'

class ResourceAtom extends Resource {
  constructor(json = {}) {
    super(json)
    this.type = 'atom'
    this.events = json.events || {}
    this.imageId = json.imageId || null
  }

  setEvents(events) {
    this.events = events
  }

  getDefaultName() {
    return 'New Atom'
  }

  toApi() {
    return JSON.parse(JSON.stringify(
      {
        ...super.toApi(),
        events: this.events,
        imageId: this.imageId
      }
    ))
  }

  toDatastore() {
    return JSON.parse(JSON.stringify(
      {
        ...super.toDatastore(),
        events: this.events,
        imageId: this.imageId
      }
    ))
  }

  fromApiPost(json) {
    super.fromApiPost(json)
    this.events = (typeof json.events === 'object') ? json.events : this.events
    this.imageId = (typeof json.imageId === 'string') ? json.imageId : this.imageId
  }

  fromApiPatch(json) {
    super.fromApiPost(json)
    this.events = (typeof json.events === 'object') ? json.events : this.events
    this.imageId = (typeof json.imageId === 'string') ? json.imageId : this.imageId
  }

  clientFromApiGet(json) {
    super.clientFromApiGet(json)
    this.events = json.events
    this.imageId = json.imageId
  }
}

export default ResourceAtom
