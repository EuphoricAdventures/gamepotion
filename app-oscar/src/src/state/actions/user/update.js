import api from '../../api.js'
import classes from '../../../classes'
import { set } from '../../../localStorage'

export default async function (state, payload) {
  return api.patch('api-core', 'me', payload)
    .then(project => {
      const userClass = new classes.User()
      userClass.clientFromApiGet(project)
      const credentials = {
        ...state.credentials
      }
      if (typeof payload.userlandId === 'string') {
        credentials.userlandId = payload.userlandId
      }
      if (typeof payload.password === 'string') {
        credentials.password = payload.password
      }
      set('credentials-userlandId', credentials.userlandId)
      set('credentials-password', credentials.password)
      return {
        ...state,
        credentials,
        user: userClass
      }
    })
}
