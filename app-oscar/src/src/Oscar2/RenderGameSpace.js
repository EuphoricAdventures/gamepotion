import classes from '../classes'
import instanceDefinitionsToInstances from './instanceDefinitionsToInstances'
import handleActionBack from './handleActionBack'

// import isInstanceIntersectingInstance from './isInstanceIntersectingInstance'

const actionClasses = new Map(
  Object.keys(classes.actions).map(k => {
    return [k, new classes.actions[k]()]
  })
)

const drawBackgroundImage = (ctx, spaceContainer, camera, designMode) => {
  if (typeof spaceContainer.extras.backgroundImage !== 'object') {
    return
  }
  const {
    frameWidth,
    frameHeight
  } = spaceContainer.extras.backgroundImage.resource
  const xCount = (spaceContainer.resource.width + (spaceContainer.resource.width % frameWidth)) / frameWidth
  const yCount = (spaceContainer.resource.height + (spaceContainer.resource.height % frameHeight)) / frameHeight
  const offsetX = (!designMode ? camera.x : 0)
  const offsetY = (!designMode ? camera.y : 0)
  for (let x = 0; x < xCount; x++) {
    for (let y = 0; y < yCount; y++) {
      const actualX = x * frameWidth - offsetX
      const actualY = y * frameHeight - offsetY
      ctx.drawImage(spaceContainer.extras.backgroundImage.extras.element, actualX, actualY)
    }
  }
}

const drawForegroundImage = (ctx, spaceContainer) => {
  if (typeof spaceContainer.extras.foregroundImage !== 'object') {
    return
  }
  ctx.drawImage(spaceContainer.extras.foregroundImage.extras.element, 0, 0)
}

const drawInstance = (ctx, camera, designMode, instance) => {
  const frame = parseInt(instance.props.frame, 10)
  const image = instance.getImage()
  const offsetX =(designMode ? 0 : camera.x)
  const offsetY = (designMode ? 0 : camera.y)
  const width = instance.getWidth()
  const height = instance.getHeight()
  const translateX = instance.props.x + (width / 2) - offsetX
  const translateY = instance.props.y + (height / 2) - offsetY
  if (image !== null) {
    ctx.translate(translateX, translateY)
    ctx.rotate(instance.props.angle)
    // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
    ctx.drawImage(
      image,
      0,
      frame * height,
      width,
      height,
      -(width / 2),
      -(height / 2),
      width * instance.props.scale,
      height * instance.props.scale
    )
    ctx.rotate(-instance.props.angle)
    ctx.translate(-translateX, -translateY)
  }
}

const drawGrid = (ctx, spaceContainer, gridWidth, gridHeight) => {
  ctx.globalAlpha = 0.5
  let x = gridWidth
  let y = gridHeight
  ctx.beginPath()
  while (x < spaceContainer.resource.width) {
    ctx.moveTo(x, 0)
    ctx.lineTo(x, spaceContainer.resource.height)
    x += gridWidth
    while (y < spaceContainer.resource.height) {
      ctx.moveTo(0, y)
      ctx.lineTo(spaceContainer.resource.width, y)
      y += gridHeight
    }
  }
  ctx.closePath()
  ctx.strokeStyle = '#ffffff'
  ctx.stroke()
  ctx.globalAlpha = 1
}

const drawCamera = (ctx, spaceContainer) => {
  ctx.globalAlpha = 0.75
  ctx.beginPath()
  const {
    x,
    y,
    width,
    height
  } = spaceContainer.resource.camera
  ctx.rect(x, y, width - 1, height - 1)
  ctx.closePath()
  ctx.strokeStyle = '#ff0000'
  ctx.stroke()
  ctx.globalAlpha = 1
}

const clear = (ctx, designMode, spaceContainer, camera) => {
  ctx.clearRect(
    0,
    0,
    (designMode ? spaceContainer.resource.width : camera.width),
    (designMode ? spaceContainer.resource.height : camera.height)
  )
}

const getTouchData = (domBoundsX, domBoundsY, e) => {
  e.preventDefault()
  // console.error('[getTouchData]', e.touches[0].clientY, domBoundsY, window.scrollY)
  let x = parseInt(e.touches[0].clientX - domBoundsX - window.scrollX, 10)
  let y = parseInt(e.touches[0].clientY - domBoundsY - window.scrollY, 10)
  const z = parseInt(0, 10)
  return { x, y, z }
}

const getMouseData = (domBoundsX, domBoundsY, e) => {
  e.preventDefault()
  // console.error('[getMouseData]', e.clientY, domBoundsY, window.scrollY)
  const x = parseInt(e.clientX - domBoundsX - window.scrollX, 10)
  const y = parseInt(e.clientY - domBoundsY - window.scrollY, 10)
  const z = parseInt(0, 10)
  return { x, y, z }
}

const normaliseCoords = (camera, designMode, gridOn, gridWidth, gridHeight, coords) => {
  // console.error('[normaliseCoords] designMode', designMode)
  const normalisedCoords = {
    ...coords
  }
  if (designMode === false) {
    normalisedCoords.x = normalisedCoords.x + camera.x
    normalisedCoords.y = normalisedCoords.y + camera.y
  }
  if (gridOn === true) {
    normalisedCoords.x = normalisedCoords.x - (normalisedCoords.x % gridWidth)
    normalisedCoords.y = normalisedCoords.y - (normalisedCoords.y % gridHeight)
  }
  return normalisedCoords
}

const loadResources = (resourceContainers, spaceContainer) => {
  let resourceContainersLoadedSoFar = 0
  const totalResourceContainersToLoad = resourceContainers.filter(r => ['image', 'sound'].includes(r.resource.type)).length

  const resourcesImages = resourceContainers.filter(r => r.resource.type === 'image')
  const resourcesSounds = resourceContainers.filter(r => r.resource.type === 'sound')
  const resourcesAtoms = resourceContainers.filter(r => r.resource.type === 'atom')

  // const extraImages = [
  //   {
  //     id: 'font',
  //     url: ''
  //   }
  // ]

  return new Promise((resolve, reject) => {

    const depthValues = new Set()

    const loadBack = () => {
      resourceContainersLoadedSoFar += 1
      console.warn(`[loadBack] done ${resourceContainersLoadedSoFar}/${totalResourceContainersToLoad}`)
      if (resourceContainersLoadedSoFar === totalResourceContainersToLoad) {
        return resolve({ depthValues })
      }
    }

    const errBack = (e) => {
      return reject(e)
    }

    resourcesAtoms
      .forEach(r => {
        depthValues.add(r.resource.depth)
        r.extras.events = r.resource.events.map(e => {
          return {
            id: e.id,
            configurationString: e.configuration.join('-'),
            actions: e.actions.map(a => {
              const actionClassInstance = actionClasses.get(a.id)
              const argumentTypes = Array.from(actionClassInstance.defaultRunArguments.values()).map(ar => ar.type)
              return {
                id: actionClassInstance.id,
                run: actionClassInstance.run,
                runArguments: a.runArguments,
                appliesTo: a.appliesTo,
                argumentTypes
              }
            })
          }
        })
      })

    resourcesImages.forEach(resource => {
      const element = new window.Image()
      addEventListener(element, 'load', loadBack)
      addEventListener(element, 'error', () => {
        element.dataset.oscarErrored = true
        loadBack()
      })
      resource.extras.element = element
      element.src = resource.resource.getRemoteUrl()
      if (spaceContainer.resource.backgroundImage === resource.resource.id) {
        spaceContainer.extras.backgroundImage = resource
      }
      if (spaceContainer.resource.foregroundImage === resource.resource.id) {
        spaceContainer.extras.foregroundImage = resource
      }
      resource.extras.image = element
    })

    resourcesSounds.forEach(resource => {
      const element = new window.Audio()
      addEventListener(element, 'loadedmetadata', loadBack)
      addEventListener(element, 'error', errBack)
      resource.extras.element = element
      element.src = resource.resource.getRemoteUrl()
      element.load()
    })

    if (resourcesImages.length === 0 && resourcesSounds.length === 0) {
      resolve({ depthValues })
    }

  })
}

const eventListeners = []
const addEventListener = (element, name, logic, isPassive) => {
  const event = {
    element,
    name,
    logic
  }
  eventListeners.push(event)
  element.addEventListener(name, logic, isPassive ? {passive: true} : undefined)
}

const isInstanceIntersecting = (instance, coords) => {
  // console.warn('[isInstanceIntersecting] instance/coords', instance, coords)
  const w = instance.getWidth()
  const h = instance.getHeight()
  const isIntersecting = (
    coords.x >= instance.props.x &&
    coords.y >= instance.props.y &&
    coords.x < (instance.props.x + w) &&
    coords.y < (instance.props.y + h)
  )
  return isIntersecting
}

const gameLoopDesignMode = (ctx, spaceContainer, camera, gridOn, gridWidth, gridHeight, instances, depths) => {
  clear(ctx, true, spaceContainer, camera)
  drawBackgroundImage(ctx, spaceContainer, camera, true)
  instances.forEach(instance => {
    const thisDepth = instance.atomContainer.resource.depth
    depths.get(thisDepth).push(instance)
  })
  depths.forEach(instancesAtThisDepth => {
    instancesAtThisDepth.forEach(instance => {
      drawInstance(ctx, camera, true, instance)
    })
  })
  drawForegroundImage(ctx, spaceContainer)
  if (gridOn === true) {
    drawGrid(ctx, spaceContainer, gridWidth, gridHeight)
  }
  drawCamera(ctx, spaceContainer)
}

const gameLoopNotDesignMode = (ctx, spaceContainer, camera, gridOn, gridWidth, gridHeight, instances, currentTouchCoords, eventContext, depths) => {
  clear(ctx, true, spaceContainer, camera)
  drawBackgroundImage(ctx, spaceContainer, camera, true)
  instances.forEach(instance1 => {
    const thisDepth = instance1.atomContainer.resource.depth
    depths.get(thisDepth).push(instance1)
    instance1.onStep()
    // const isIntersecting = currentTouchCoords && isInstanceIntersecting(instance1, currentTouchCoords)
    // instances
    //   .filter(instance2 => isInstanceIntersectingInstance(instance1, instance2))
    //   .forEach(is => {
    //     const requiredConfiguration = [is.atomContainer.resource.id]
    //     console.warn('requiredConfiguration', requiredConfiguration)
    //     instances = handleEvent('Collision', requiredConfiguration, eventContext, instances, [instance1], [is])
    //   })
  })
  depths.forEach(instancesAtThisDepth => {
    instancesAtThisDepth.forEach(instance => {
      drawInstance(ctx, camera, true, instance)
    })
  })
  drawForegroundImage(ctx, spaceContainer)
  camera.x += camera.vx
  camera.y += camera.vy
  camera.z += camera.vz
  instances = handleEventStep(instances, eventContext)
  return instances
}

const getMatchingEvents = (events, eventId, requiredConfigurationString) => {
  return events.filter(e => e.id === eventId && e.configurationString === requiredConfigurationString)
}

const handleEvent = (eventId, requiredConfiguration = [], eventContext, instances, appliesToInstances) => {
  const requiredConfigurationString = requiredConfiguration.join('-')
  let instancesToDestroy = []
  let instancesToCreate = []
  appliesToInstances.forEach(i => {
    getMatchingEvents(i.atomContainer.extras.events, eventId, requiredConfigurationString).forEach(e => {
      const actions = e.actions
      const actionBacks = i.onEvent(actions, eventContext).filter(ab => typeof ab === 'object' && ab !== null)
      actionBacks.forEach(actionBack => {
        const result = handleActionBack(actionBack)
        instancesToDestroy = instancesToDestroy.concat(result.instancesToDestroy)
        instancesToCreate = instancesToCreate.concat(result.instancesToCreate)
        if (typeof result.imageToSet === 'string') {
          i.setImage(result.imageToSet, eventContext.resourceContainers)
        }
        if (typeof result.spaceToGoTo === 'string') {
          eventContext.onSwitchSpace(result.spaceToGoTo)
        }
      })
    })
  })
  if (instancesToDestroy.length > 0) {
    console.log('[handleEvent] instancesToDestroy', instancesToDestroy)
    instances = instances.filter(ic => {
      const willDestroy = instancesToDestroy.includes(ic)
      return (!willDestroy)
    })
    instances = handleEvent('Destroy', undefined, eventContext, instances, instancesToDestroy)
  }
  if (instancesToCreate.length > 0) {
    const createdInstances = instanceDefinitionsToInstances(instancesToCreate, eventContext.resourceContainers)
    instances = instances.concat(createdInstances)
    console.log('[handleEvent] createdInstances', createdInstances)
    instances = handleEvent('Create', undefined, eventContext, instances, createdInstances)
  }
  return instances
}

const handleEventStart = (instances, eventContext) => {
  // console.warn('[handleEventStart] eventContext', eventContext)
  return handleEvent('Create', undefined, eventContext, instances, instances)
}

const handleEventStep = (instances, eventContext) => {
  // console.warn('[handleEventStep] eventContext', eventContext)
  return handleEvent('Step', undefined, eventContext, instances, instances)
}

const RenderGameSpace = (
  {
    canvasElement,
    spaceContainer,
    resourceContainers,
    variables,
    alarms,
    designMode = false,
    gridOn = false,
    gridWidth = 16,
    gridHeight = 16,
    onSwitchSpace,
    onTouch = () => {},
    onTouchSecondary = () => {},
    onTouchMove = () => {}
  }
) => {

  gridWidth = parseInt(gridWidth, 10)
  gridHeight = parseInt(gridHeight, 10)

  const camera = {
    ...spaceContainer.resource.camera,
    vx: 0,
    vy: 0,
    vz: 0
  }

  const [c, ctx] = [canvasElement, canvasElement.getContext('2d')]
  c.width = (designMode ? spaceContainer.resource.width : camera.width)
  c.height = (designMode ? spaceContainer.resource.height : camera.height)
  c.style.display = 'block'
  c.style.backgroundColor = 'black'

  // https://stackoverflow.com/questions/4261090/html5-canvas-and-anti-aliasing
  ctx.imageSmoothingEnabled = false

  // https://medium.com/wdstack/fixing-html5-2d-canvas-blur-8ebe27db07da
  // ctx.translate(0.5, 0.5)
  // const styleWidth = +getComputedStyle(c).getPropertyValue('width').slice(0, -2)
  // const styleHeight = +getComputedStyle(c).getPropertyValue('height').slice(0, -2)
  // c.setAttribute('width', styleWidth * window.devicePixelRatio)
  // c.setAttribute('height', styleHeight * window.devicePixelRatio)

  // sorry
  const domBoundsX = c.getBoundingClientRect().x
  const domBoundsY = c.getBoundingClientRect().y
  let requestAnimationFrameHandle

  // let because it can be spliced
  let instances = instanceDefinitionsToInstances(spaceContainer.resource.instances, resourceContainers)
  console.warn('[RenderGameSpace] instances', instances)

  const onLoadedResources = ({ depthValues }) => {

    const sortedDepthValues = Array.from(depthValues.entries())
      .sort((a, b) => {
        return a[0] - b[0]
      })

    let jInputs = {
      touch: {
        primary: false,
        coords: undefined,
        time: 0
      },
      keys: {},
      keyCount: 0
    }

    const eventContext = {
      instances,
      spaceContainer,
      camera,
      resourceContainers,
      variables,
      alarms,
      onSwitchSpace,
      getInstanceCount(atomId) {
        return instances
          .filter(i => (i.atomContainer.resource.id === atomId))
          .length
      }
    }

    addEventListener(c, 'touchmove', (e) => {
      onTouchMove(getTouchData(domBoundsX, domBoundsY, e))
    }, true)
    addEventListener(c, 'mousemove', (e) => {
      onTouchMove(getMouseData(domBoundsX, domBoundsY, e))
    })
    addEventListener(c, 'contextmenu', (e) => {
      e.preventDefault()
      return false
    })
    if (designMode === false) {
      addEventListener(document, 'keypress', (e) => {
        const eventConfiguration = ['press', e.key]
        instances = handleEvent('Input', eventConfiguration, eventContext, instances, instances)
      })
      addEventListener(document, 'keydown', (e) => {
        e.preventDefault()
        const eventConfiguration = ['hold', e.key]
        instances = handleEvent('Input', eventConfiguration, eventContext, instances, instances)
        if (jInputs.keys[e.key] === undefined || jInputs.keys[e.key].on === false) {
          jInputs.keyCount += 1
        }
        jInputs.keys[e.key] = {
          on: true,
          time: Date.now()
        }
      })
      addEventListener(document, 'keyup', (e) => {
        jInputs.keyCount -= 1
        jInputs.keys[e.key].on = false
        // console.warn('jInputs.keyCount', jInputs.keyCount)
        if (jInputs.keyCount === 0) {
          instances = handleEvent('NoInput', undefined, eventContext, instances, instances)
        }
      })
    }
    addEventListener(c, 'touchstart', (e) => {
      jInputs.touch = {
        primary: true,
        coords: getTouchData(domBoundsX, domBoundsY, e),
        time: Date.now()
      }
    }, true)
    addEventListener(c, 'touchend', () => {
      const timeDifference = Date.now() - jInputs.touch.time
      const normalisedCoords = normaliseCoords(camera, designMode, gridOn, gridWidth, gridHeight, jInputs.touch.coords)
      const instancesAtCoords = instances.filter(i => isInstanceIntersecting(i, normalisedCoords))
      // console.warn('[touchend] jInputs.touch.time', jInputs.touch.time)
      // console.warn('[touchend] timeDifference', timeDifference)
      if (designMode === true) {
        if (timeDifference <= 1000) {
          onTouch(normalisedCoords)
        } else {
          const indicesAtCoords = instancesAtCoords.map(i => instances.indexOf(i))
          onTouchSecondary(indicesAtCoords)
        }
      } else {
        instances = handleEvent('Touch', undefined, eventContext, instances, instancesAtCoords)
      }
    })
    addEventListener(c, 'mousedown', (e) => {
      e.preventDefault()
      const coords = getMouseData(domBoundsX, domBoundsY, e)
      const normalisedCoords = normaliseCoords(camera, designMode, gridOn, gridWidth, gridHeight, coords)
      const instancesAtCoords = instances.filter(i => isInstanceIntersecting(i, normalisedCoords))
      if (designMode === true) {
        if (e.which === 1) {
          onTouch(normalisedCoords)
        } else {
          const indicesAtCoords = instancesAtCoords.map(i => instances.indexOf(i))
          onTouchSecondary(indicesAtCoords)
        }
      } else {
        instances = handleEvent('Touch', undefined, eventContext, instances, instancesAtCoords)
      }
    })
    const currentTouchCoords = typeof jInputs.touch.coords === 'object' ? normaliseCoords(camera, false, gridOn, gridWidth, gridHeight, jInputs.touch.coords) : null

    const depths = new Map(
      sortedDepthValues.map(dv => ([
        dv[0],
        []
      ]))
    )
    if (designMode === true) {
      gameLoopDesignMode(ctx, spaceContainer, camera, gridOn, gridWidth, gridHeight, instances, depths)
    } else {
      const doGameLoopNotDesignMode = () => {
        depths.forEach((instancesAtThisDepth, depth) => {
          depths.set(depth, [])
        })
        gameLoopNotDesignMode(ctx, spaceContainer, camera, gridOn, gridWidth, gridHeight, instances, currentTouchCoords, eventContext, depths)
        // setTimeout(doGameLoopNotDesignMode, 100)
        requestAnimationFrameHandle = window.requestAnimationFrame(doGameLoopNotDesignMode)
      }
      instances = handleEventStart(instances, eventContext)
      doGameLoopNotDesignMode()
    }
  }

  // clear(ctx, designMode, spaceContainer, camera)
  // ctx.fillStyle = '#ffffff'
  // ctx.font = '16px Arial'
  // ctx.fillText('Loading...', 16, 24)
  loadResources(resourceContainers, spaceContainer)
    .then(onLoadedResources)
    .catch(error => {
      console.error(error)
      clear(ctx, designMode, spaceContainer, camera)
      ctx.fillStyle = '#ffffff'
      ctx.font = '16px Arial'
      ctx.fillText('This game could not be loaded.', 12, 24)
    })

  const free = () => {
    console.warn('[RenderGameSpace] [free]')
    window.cancelAnimationFrame(requestAnimationFrameHandle)
    eventListeners.forEach(event => {
      event.element.removeEventListener(event.name, event.logic)
    })
    eventListeners.length = 0
  }

  return {
    free
  }
}

export default RenderGameSpace
