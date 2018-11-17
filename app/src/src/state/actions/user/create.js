import api from '../../api.js'
import classes from '../../../classes'
import { set } from '../../../localStorage'

import updateUser from './update'

const doCreateUser = (payload) => {
  return api.createUser(payload)
}

const doCreateTeam = () => {
  return api.post('api-core', 'teams', {})
    .then(team => {
      const teamClass = new classes.Team()
      teamClass.clientFromApiGet(team)
      return teamClass
    })
}

export default async function (state, payload) {
  let credentials
  const userClass = await (async () => {
    const user = await doCreateUser(payload)
    credentials = {
      email: user.email,
      password: user.password
    }
    set('credentials-email', credentials.email)
    set('credentials-password', credentials.password)
    const userClass = new classes.User()
    userClass.clientFromApiGet(user)
    return userClass
  })()
  const teamClass = await (async () => {
    const team = await doCreateTeam()
    const teamClass = new classes.Team()
    teamClass.clientFromApiGet(team)
    return teamClass
  })()
  let newState = {
    ...state,
    credentials,
    user: userClass,
    team: teamClass
  }
  newState = {...await updateUser(newState, { teamId: teamClass.id })}
  return {
    ...newState
  }
}
