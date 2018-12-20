import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import Box from '../components/Box/Box'
import Input from '../components/Input/Input'
import Dropper from '../components/Dropper/Dropper'
import Switch from '../components/Switch/Switch'
import Heading2 from '../components/Heading2/Heading2'
import ImageChooser from '../components/ImageChooser/ImageChooser'

import { font, colours } from '../styleAbstractions'

import Oscar2 from '../Oscar2'

const getImageDropperResources = (resources) => {
  return [
    ...resources
      .filter(r => r.type === 'image')
      .map(r => {
        return {
          id: r.id,
          name: r.name
        }
      }),
    {
      id: 'none',
      name: '<None>'
    }
  ]
}

const getAtomsToPlot = (resources) => {
  return resources
    .filter(r => r.type === 'atom')
    .map(r => {
      const foundImage = resources.find(i => i.id === r.imageId)
      const url = (foundImage !== undefined ?
        foundImage.getRemoteUrl()
        :
        null
      )
      return {
        id: r.id,
        name: r.name,
        url
      }
    })
}

const StyledResource = styled.div`
  section.settings-info {
    .component--box.settings {
      margin-bottom: 1rem;
      .coords {
        display: grid;
        grid-template-columns: 2fr 2fr;
        grid-gap: 1rem;
        margin-bottom: 2rem;
      }
      .component--dropper:not(:last-child) {
        margin-bottom: 1rem;
      }
    }
    .component--box.info {
      margin-bottom: 1rem;
      .component--switch {
        margin-bottom: 1rem;
      }
      .grid-properties {
        display: grid;
        grid-template-columns: 2fr 2fr;
        grid-gap: 1rem;
      }
    }
  }
  section.main {
    margin-top: 1rem;
    // background-color: yellow;
    .play-touches {
      position: relative;
      margin-top: 1rem;
      margin-bottom: 2rem;
      // background-color: blue;
      .touches {
        position: absolute;
        top: 0;
        left: 112px;
        height: 2rem;
        line-height: 2rem;
        // background-color: red;
        ${font}
        font-size: 80%;
        color: #6c7a89;
      }
    }
  }
  .component--box.plot {
    margin-top: 1rem;
    margin-bottom: 1rem;
    > .component--heading2 {
      margin-bottom: 1rem;
    }
  }
  @media screen and (min-width: 960px) {
    section.settings-info {
      float: left;
      width: 240px;
      .component--box.settings {
        margin-bottom: 2rem;
      }
      .component--box.info {
        margin-bottom: 2rem;
      }
    }
    section.main {
      margin-top: 0;
      margin-left: calc(240px + 2rem);
      .game {
        // 1125 x 2436
        width: 610px;
        height: 280px;
        overflow: scroll;
      }
    }
  }
`

class ResourceSpace extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      isPlaying: false
    }
    this.thisRefs = {
      touchCoordsX: null,
      touchCoordsY: null
    }
    this.onChooseBackgroundImage = this.onChooseBackgroundImage.bind(this)
    this.onChooseForegroundImage = this.onChooseForegroundImage.bind(this)
    this.plotAtom = this.plotAtom.bind(this)
    this.unplotAtoms = this.unplotAtoms.bind(this)
    this.updateTouchCoords = this.updateTouchCoords.bind(this)
    this.updatePlaying = this.updatePlaying.bind(this)
  }

  onChangeMasterProp(prop, v) {
    this.props.onUpdate({
      [prop]: parseInt(v, 10)
    })
  }

  onChangeCameraProp(prop, v) {
    this.props.onUpdate({
      camera: {
        ...this.props.resource.camera,
        [prop]: parseInt(v, 10)
      }
    })
  }

  onChooseBackgroundImage(backgroundImage) {
    if (backgroundImage === 'none') {
      backgroundImage = null
    }
    this.props.onUpdate({
      backgroundImage
    })
  }

  onChooseForegroundImage(foregroundImage) {
    if (foregroundImage === 'none') {
      foregroundImage = null
    }
    this.props.onUpdate({
      foregroundImage
    })
  }

  plotAtom(coords, angle = 0) {
    const atomId = this.props.localSettings['atom-to-plot']
    // const atom = this.props.resources.find(r => r.id === atomId)
    // const image = this.props.resources.find(r => r.id === atom.imageId)
    if (coords.x < 0 || coords.y < 0 || coords.x > this.props.resource.width || coords.y > this.props.resource.height) {
      return console.error('out ot bounds coords', coords)
    }
    console.warn('[plotAtom] atomId', atomId, 'at', coords)
    if (atomId === 'none') {
      return
    }
    this.props.onUpdate({
      instances: [
        ...this.props.resource.instances,
        {
          atomId,
          ...coords,
          angle
        }
      ]
    })
  }

  unplotAtoms(indicesAtCoords) {
    // console.warn('[unplotAtoms]', 'of', indicesAtCoords)
    const instances = this.props.resource.instances.filter((ic, i) => !indicesAtCoords.includes(i))
    this.props.onUpdate({
      instances
    })
  }

  updateTouchCoords(coords) {
    // console.warn('[updateTouchCoords] coords', coords, this.thisRefs.touchCoordsX)
    this.thisRefs.touchCoordsX.innerHTML = coords.x.toString()
    this.thisRefs.touchCoordsY.innerHTML = coords.y.toString()
  }

  updatePlaying(isPlaying) {
    this.setState({
      isPlaying
    })
  }

  render() {
    console.warn('[component-resource-Space] [render]')

    const atomsToPlot = getAtomsToPlot(this.props.resources)
    const imageDropperResources = getImageDropperResources(this.props.resources)

    const backgroundImage = (this.props.resource.backgroundImage === null ? 'none' : this.props.resource.backgroundImage)
    const foregroundImage = (this.props.resource.foregroundImage === null ? 'none' : this.props.resource.foregroundImage)

    let atomToPlot = this.props.localSettings['atom-to-plot']
    if (
      (atomToPlot === 'none' || atomsToPlot.find(r => r.id === atomToPlot) === undefined)
      && atomsToPlot.length > 0)
    {
      this.props.onUpdateLocalSetting('atom-to-plot', atomsToPlot[0].id)
    }

    console.warn('[Space] [render] this.props.localSettings', this.props.localSettings)

    return (
      <StyledResource>
        <section className='settings-info'>
          <Box className='settings'>
            <div className='coords'>
              <Input label='Width' type='number' value={this.props.resource.width} onChange={(v) => this.onChangeMasterProp('width', v)} min='0' max='4096' />
              <Input label='Height' type='number' value={this.props.resource.height} onChange={(v) => this.onChangeMasterProp('height', v)} min='0' max='4096' />
              <Input label='Cam Width' type='number' value={this.props.resource.camera.width} onChange={(v) => this.onChangeCameraProp('width', v)} min='0' max='4096' />
              <Input label='Cam Height' type='number' value={this.props.resource.camera.height} onChange={(v) => this.onChangeCameraProp('height', v)} min='0' max='4096' />
            </div>
            <Dropper options={imageDropperResources} value={backgroundImage} onChoose={this.onChooseBackgroundImage} label='Background image' />
            <Dropper options={imageDropperResources} value={foregroundImage} onChoose={this.onChooseForegroundImage} label='Foreground image' />
          </Box>
          <Box className='info'>
            <Switch checked={this.props.localSettings['grid-on']} onChange={(v) => this.props.onUpdateLocalSetting('grid-on', v)}>Grid</Switch>
            <div className='grid-properties'>
              <Input label='Grid Width' value={this.props.localSettings['grid-width']} disabled={!this.props.localSettings['grid-on']} type='number' min='4' max='256' onChange={(v) => this.props.onUpdateLocalSetting('grid-width', parseInt(v, 10))} />
              <Input label='Grid Height' value={this.props.localSettings['grid-height']} disabled={!this.props.localSettings['grid-on']} type='number' min='4' max='256' onChange={(v) => this.props.onUpdateLocalSetting('grid-height', parseInt(v, 10))} />
            </div>
          </Box>
        </section>
        <section className='main'>
          <div className='game'>
            <div id='oscar2-container' />
            <Oscar2
              containerElementId='oscar2-container'
              project={this.props.project}
              resources={this.props.resources}
              spaceId={this.props.resource.id}
              designMode={!this.state.isPlaying}
              gridOn={this.props.localSettings['grid-on'] && !this.state.isPlaying}
              gridWidth={this.props.localSettings['grid-width']}
              gridHeight={this.props.localSettings['grid-height']}
              onTouch={this.plotAtom}
              onTouchSecondary={this.unplotAtoms}
              onTouchMove={this.updateTouchCoords}
            />          
          </div>
          <div className='play-touches'>
            <Switch checked={this.state.isPlaying} onChange={(v) => this.updatePlaying(v)}>Play</Switch>
            <div className='touches'>
              <span ref={(r) => { this.thisRefs.touchCoordsX = r }}>0</span>&times;<span ref={(r) => { this.thisRefs.touchCoordsY = r }}>0</span>
            </div>
          </div>
          <Box className='plot'>
            <Heading2>Atom to plot</Heading2>
            <ImageChooser images={atomsToPlot} currentImage={atomToPlot} onChoose={(v) => this.props.onUpdateLocalSetting('atom-to-plot', v)} />
          </Box>
        </section>
      </StyledResource>
    )
  }
}

ResourceSpace.propTypes = {
  resources: PropTypes.array.isRequired,
  resource: PropTypes.object.isRequired,
  localSettings: PropTypes.object.isRequired,
  onUpdate: PropTypes.func,
  onUpdateLocalSetting: PropTypes.func.isRequired,
}

ResourceSpace.defaultProps = {
  onUpdate: () => {}
}

export default ResourceSpace
