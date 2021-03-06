const errors = require('restify-errors')
const datalayer = require('../../../../abstractions/datalayer')

const findProject = (projectId, teamId) => {
  return datalayer.readOne(
    'Projects',
    {
      id: projectId,
      teamId
    }
  )
}

const route = async (request, response, next) => {
  try {
    await findProject(request.params.id, request.authorization.user.teamId)
  } catch (error) {
    response.send(new errors.NotFoundError('didnt work (1)'))
    return next(false)
  }
  const projectResources = await datalayer.read('Resources', { projectId: request.params.id })
  await Promise.all(projectResources.map(resource => {
    return datalayer.deleteOne('Resources', resource.id)
  }))
  datalayer.deleteOne('Projects', request.params.id)
    .then(() => {
      response.header('content-type', 'text/plain')
      response.send(204)
    })
    .catch(() => {
      response.send(new errors.InternalServerError('didnt work (2)'))
      return next(false)
    })
}

module.exports = route
