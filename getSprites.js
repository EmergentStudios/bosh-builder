/*
padding should be 1px
classes:
  - lr-sprite
  - lr-stretch
  - lr-null
  - lr-anchor (el: circle, attributes: cx, cy)
  - lr-bbox (el: rect, attributes: x, y, width, height)
attributes (for <g/>):
  - lr:copy: svg ID
  - lr:anchor: point ID
  - lr:lookAt: point ID
  - lr:params: string list
  - lr:param-rotation: int [0,39]
  - lr:param-blinking: int [0,1]
  - lr:param-broken: int [0,1]
  - lr:param-crashed: int [0,1]
*/
const POINTS = new Set(['FLAG', 'START_FLAG', 'PEG', 'TAIL', 'NOSE', 'STRING', 'BUTT', 'SHOULDER', 'RHAND', 'LHAND', 'LFOOT', 'RFOOT', 'SCARF_0', 'SCARF_1', 'SCARF_2', 'SCARF_3', 'SCARF_4', 'SCARF_5', 'SCARF_6'])
const PARAMS = new Set(['rotation', 'blinking', 'broken', 'crashed'])
const LR = 'https://www.linerider.com'
let dom = document // the svg root

function getParamNames (sprite) {
  let paramNames = sprite.getAttributeNS(LR, 'params') || ''
  paramNames = paramNames.length > 0 ? paramNames.split(' ') : []
  for (let paramName of paramNames) {
    if (!PARAMS.has(paramName)) {
      throw new Error(`unknown param: ${paramName}`)
    }
  }
  return paramNames
}
function validatePoint (point, nullable) {
  if (!(POINTS.has(point) || (nullable && point === null))) {
    throw new Error(`unknown point: ${point}`)
  }
}
function getSpriteProps (sprite, dom) {
  let anchor = sprite.getAttributeNS(LR, 'anchor')
  let lookAt = sprite.getAttributeNS(LR, 'lookAt')
  validatePoint(anchor)
  validatePoint(lookAt, true)
  let props = {anchor, lookAt}
  let copy = sprite.getAttributeNS(LR, 'copy')
  if (copy) {
    let baseProps = getSpriteProps(dom.getElementById(copy), dom)
    return {...baseProps, ...props}
  }
  let paramNames = getParamNames(sprite)
  let coords = {}
  if (paramNames.length === 0) {
    coords[''] = createCoords(sprite)
  } else {
    for (let subSprite of sprite.children) {
      let key = paramNames.map(paramName => subSprite.getAttributeNS(LR, `param-${paramName}`)).join(' ')
      coords[key] = createCoords(subSprite)
    }
  }
  return {
    ...props,
    stretch: sprite.classList.contains('lr-stretch'),
    paramNames,
    coords
  }
}

function createCoords (sprite) {
  if (sprite.classList.contains('lr-null')) {
    return {
      anchor: {x: 0, y: 0},
      bbox: {x: 0, y: 0, width: 0, height: 0}
    }
  }
  let anchor = sprite.querySelector('.lr-anchor')
  let bbox = sprite.querySelector('.lr-bbox')
  return {
    anchor: {
      x: anchor.getAttribute('cx'),
      y: anchor.getAttribute('cy')
    },
    bbox: {
      x: bbox.getAttribute('x'),
      y: bbox.getAttribute('y'),
      width: bbox.getAttribute('width'),
      height: bbox.getAttribute('height')
    }
  }
}

function getCoords (params, sprite) {
  let key = sprite.paramNames.map(paramName => params[paramName]).join(' ')
  return sprite.coords[key]
}

let out = [...dom.querySelectorAll('.lr-sprite')].map(sprite => getSpriteProps(sprite, dom))

console.log(out.map(s => getCoords({rotation: 0, blinking: 0, broken: 0, crashed: 0}, s)))
