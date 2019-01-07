const bcrypt = require('bcrypt-nodejs')
const errors = require('restify-errors')
const datalayer = require('../../abstractions/datalayer')
const uuid = require('../../abstractions/uuid/index.dist.js')
const classes = require('../../classes/dist.js')
const sendMail = require('../../sendMail')

const getExistingUser = (userlandId) => {
  return datalayer.readOne('Users', { userlandId })
}

const createRandomPassword = () => {
  return uuid()
}

const getPasswordHash = (password, callback) => {
  return bcrypt.hash(password, null, null, callback)
}

const sendWelcomeEmail = async (name, userlandId) => {
  await sendMail({
    subject: 'Welcome to Game Maker Club',
    to: userlandId,
    contentText:
`Hey ${name},

Thanks for joining Game Maker Club! Welcome.

- GMC
`,
    contentHtml:
`<p>Hey ${name},</p>

<p>Thanks for joining Game Maker Club! Welcome.</p>

<p>- GMC</p>
`
  })
}

const route = async (request, response, next) => {
  let userClass
  try {
    userClass = new classes.User()
    userClass.fromApiPost(request.body)
  } catch (error) {
    response.send(new errors.BadRequestError(`this would not get created (${error.message})`))
    return next(false)
  }
  getExistingUser(userClass.userlandId)
    .then(() => {
      const what = (userClass.userlandId.indexOf('@') > 0 ? 'e-mail' : 'userlandId')
      response.send(new errors.BadRequestError(`this ${what} is already in use`))
      return next(false)
    })
    .catch(() => {
      const password = createRandomPassword()
      getPasswordHash(password, (error, passwordHash) => {
        if (error) {
          console.error('[route users create] bcrypt errback', error)
          response.send(new errors.InternalServerError('couldnt create user (bcrypt.hash)'))
          return next(false)
        }
        userClass.passwordHash = passwordHash
        datalayer.write('Users', userClass.id, userClass.toDatastore())
          .then(async () => {
            const toApi = userClass.toApi()
            await sendWelcomeEmail(userClass.name, userClass.userlandId)
            response.send(201, {
              ...toApi,
              password
            })
            return next()
          })
          .catch(error => {
            console.error('[route users create] datalayer.write caught', error)
            response.send(new errors.InternalServerError('couldnt create user'))
            return next(false)
          })
      })
    })
}

module.exports = route
