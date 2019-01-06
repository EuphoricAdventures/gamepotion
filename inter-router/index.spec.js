import {
  appProject,
  store,
  site,
  playProject,
} from './index.js'

const NODE_ENV = 'production'

describe('interRouter', () => {
  it('generates an app project route', () => {
    const link = appProject(NODE_ENV, 'xyz')
    expect(link).toBe('https://app.gamemaker.club/projects/xyz')
  })

  it('generates a store route', () => {
    const link = store(NODE_ENV, 'modules/pro')
    expect(link).toBe('https://store.gamemaker.club/modules/pro')
  })

  it('generates a site route', () => {
    const link = site(NODE_ENV, 'credits')
    expect(link).toBe('https://gamemaker.club/credits')
  })

  it('generates a play project route', () => {
    const link = playProject(NODE_ENV, 'xyz')
    expect(link).toBe('https://play.gamemaker.club/xyz')
  })
})
