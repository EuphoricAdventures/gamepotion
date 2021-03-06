import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import classnames from 'classnames'
import { withRouter } from 'react-router-dom'

const styleAbstractions = {
  colours: {
    'foreNegative': '#ffffff'
  },
  font: `
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-weight: 400;
    text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
  `
}

const StyledToolbarButton = styled.li`
  position: relative;
  display: flex;
  flex-shrink: 0;
  height: 3rem;
  background-color: #2e3131;
  &.fixed-width {

  }
  ul {
    position: absolute;
    top: 3rem;
    right: 0;
    min-width: 128px;
    list-style-type: none;
    border-radius: 4px;
    box-shadow: 0 2px 2px rgb(172, 172, 172);
    transition: opacity 0.2s ease-in-out, visibility 0.2s ease-in-out;
    z-index: 3;
    // background-color: red;
    li {
      padding: 0.75rem;
      ${styleAbstractions.font}
      font-size: 90%;
      background-color: #2e3131;
      color: ${styleAbstractions.colours.foreNegative};
      cursor: default;
      transition: background-color 0.1s ease-in-out;
    }
    li:hover {
      background-color: #6c7a89;
    }
    li + li {
      border-top: 1px solid #6c7a89;
    }
    li:last-of-type {
      border-bottom-left-radius: 4px;
      border-bottom-right-radius: 4px;
    }
  }
  button {
    display: block;
    padding: 0.75rem;
    outline: 0;
    background-color: transparent;
    transition: background-color 0.2s ease-in-out, opacity 0.5s ease-in-out;
    overflow: hidden;
    :focus {
      background-color: #6c7a89;
    }
    img {
      display: block;
      float: left;
      width: 1.5rem;
      height: 1.5rem;
    }
    span {
      display: block;
      height: 1.5rem;
      margin-left: 0.75rem;
      margin-right: 0.75rem;
      line-height: 1.5rem;
      color: ${styleAbstractions.colours.foreNegative};
      ${styleAbstractions.font}
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    img + span {
      margin-left: 2rem;
    }
    &.significant {
      background-color: white;
    }
    &.fixed-width {
      width: 100%;
      text-align: left;
    }
    &.selected:not(.significant) {
      background-color: #6c7a89;
    }
    &[disabled] {
      opacity: 0.25;
    }
    &[disabled]:not(.fixed-width) {
      cursor: not-allowed;
    }
    &:hover:not([disabled]):not(.significant):not(.fixed-width) {
      background-color: #6c7a89;
    }
  }
`

const handleOnClick = (history, route, onClick) => {
  if (typeof route === 'string') {
    history.push(route)
  } else if (typeof onClick === 'function') {
    return onClick()
  }
}

const ToolbarButton = ({ match, history, route, onClick, icon, hint, significant, disabled, fixedWidth, children, dropdownItems, isDropdownShowing }) => {
  const fixedWithStyle = {}
  if (typeof fixedWidth === 'string') {
    fixedWithStyle.width = `${fixedWidth}px`
  }
  const selected = (match.url === route)
  const buttonClassName = classnames({'significant': significant, selected, 'disabled': disabled, 'fixed-width': fixedWidth})
  return (
    <StyledToolbarButton className='component--toolbar-button' title={hint}>
      <ul style={isDropdownShowing ? {visibility: 'visible', opacity: 1} : {visibility: 'hidden', opacity: 0}}>
        {dropdownItems.map(di => {
          return (
            <li key={di.name} onClick={() => handleOnClick(history, di.route, di.onClick)}>{di.name}</li>
          )
        })}
      </ul>
      <button onClick={() => handleOnClick(history, route, onClick)} disabled={disabled} className={buttonClassName} style={fixedWithStyle}>
        {icon && <img src={icon} alt={hint} className={`icon-${icon}`} />}
        {children && <span>{children}</span>}
      </button>
    </StyledToolbarButton>
  )
}

ToolbarButton.propTypes = {
  route: PropTypes.string,
  onClick: PropTypes.func,
  icon: PropTypes.string,
  hint: PropTypes.string,
  significant: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
  fixedWidth: PropTypes.string,
  dropdownItems: PropTypes.array,
  isDropdownShowing: PropTypes.bool
}

ToolbarButton.defaultProps = {
  onClick: null,
  significant: false,
  disabled: false,
  dropdownItems: [],
  isDropdownShowing: false
}

export default withRouter(ToolbarButton)
