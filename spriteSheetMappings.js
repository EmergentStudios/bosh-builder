// export const PADDING = 1
const POINTS = ['FLAG', 'START_FLAG', 'PEG', 'TAIL', 'NOSE', 'STRING', 'BUTT', 'SHOULDER', 'RHAND', 'LHAND', 'LFOOT', 'RFOOT', 'SCARF_0', 'SCARF_1', 'SCARF_2', 'SCARF_3', 'SCARF_4', 'SCARF_5', 'SCARF_6']
const PARAMS = ['rotation', 'blinking', 'broken', 'crashed']
const TRANSFORM_TYPES = ['opacity', 'translate', 'scale', 'rotate']
const LR = 'https://www.linerider.com'

/* polyfills for ie11 dom methods */
const containsClass = (node, className) => {
  if (node.classList) {
    return node.classList.contains(className)
  }
  // ie has no classList
  let classes = node.getAttribute('class')
  return classes && classes.includes(className)
}
const getLRAttribute = (node, attr) => {
  let value = node.getAttributeNS(LR, attr)
  // ie returns empty string instead of null for no value
  return value === '' ? null : value
}

function validatePoint (point, nullable) {
  if (!(POINTS.includes(point) || (nullable && point === null))) {
    throw new Error(`unknown point: ${point}`)
  }
}
function getSpriteProps (sprite, doc) {
  let anchor = getLRAttribute(sprite, 'anchor')
  let lookAt = getLRAttribute(sprite, 'lookAt')
  validatePoint(anchor)
  validatePoint(lookAt, true)
  let props = {anchor, lookAt}
  let copy = getLRAttribute(sprite, 'copy')
  if (copy) {
    let baseProps = getSpriteProps(doc.getElementById(copy), doc)
    return {...baseProps, ...props}
  }
  let animateNode = sprite.querySelector('animate')
  let transformNodes = sprite.querySelectorAll('animateTransform')
  return {
    ...props,
    stretch: containsClass(sprite, 'lr-stretch'),
    coords: createCoords(sprite),
    transforms: [...transformNodes].map(createTransform).reverse(),
    opacity: animateNode && createTransform(animateNode)
  }
}

function getTransformType (node) {
  let attributeName = node.getAttribute('attributeName')
  switch (attributeName) {
    case 'opacity':
      return 'opacity'
    case 'transform':
      let type = node.getAttribute('type')
      if (!TRANSFORM_TYPES.includes(type)) {
        throw new Error(`unsupported transform type: ${type}`)
      }
      return type
    default:
      throw new Error(`unsupported animated attribute: ${attributeName}`)
  }
}
function createTransform (node) {
  let param = getLRAttribute(node, 'param')
  if (!PARAMS.includes(param)) {
    throw new Error(`unknown param: ${param}`)
  }

  let values = node.getAttribute('values').split(';')
  let keyTimes = node.getAttribute('keyTimes').split(';')

  return {
    param,
    type: getTransformType(node),
    keyframes: values.map((value, i) => {
      let args = value.trim().split(/\s/).map(v => parseFloat(v))
      let time = parseFloat(keyTimes[i].trim())

      return { time, args }
    })
  }
}

function createCoords (sprite) {
  let anchor = sprite.querySelector('.lr-anchor')
  let bbox = sprite.querySelector('.lr-bbox')
  return {
    anchor: {
      x: parseFloat(anchor.getAttribute('x')),
      y: parseFloat(anchor.getAttribute('y'))
    },
    bbox: {
      x: parseInt(bbox.getAttribute('x')),
      y: parseInt(bbox.getAttribute('y')),
      width: parseInt(bbox.getAttribute('width')),
      height: parseInt(bbox.getAttribute('height'))
    }
  }
}

const Transform = {
  translate: (a, args) => translate(a, a, args),
  scale: (a, args) => scale(a, a, args),
  rotate: (a, [deg, x, y]) => {
    translate(a, a, [-x, -y])
    rotate(a, a, deg / 180 * Math.PI)
    translate(a, a, [x, y])
  }
}
const FromTransform = {
  translate: args => fromTranslation([], args),
  scale: args => fromScaling([], args),
  rotate: ([deg, x, y]) => {
    let a = fromTranslation([], [-x, -y])
    rotate(a, a, deg / 180 * Math.PI)
    translate(a, a, [x, y])
    return a
  }
}
function getInterpolatedArgs ({param, keyframes}, params) {
  let time = params[param]
  switch (time) {
    case 0:
      return keyframes[0].args
    case 1:
      return keyframes[keyframes.length - 1].args
  }
  let i = keyframes.findIndex(keyframe => keyframe.time > time)
  let prev = keyframes[i - 1]
  let next = keyframes[i]

  let t = (time - prev.time) / (next.time - prev.time)
  return prev.args.map((a, i) => (1 - t) * a + t * next.args[i])
}
function getMappingProps (sprite, params) {
  let coords = sprite.coords
  let opacity = sprite.opacity && getInterpolatedArgs(sprite.opacity, params)[0]
  if (opacity === 0) {
    return {coords, hidden: true}
  }

  let transformMatrix = null
  for (let i = 0; i < sprite.transforms.length; i++) {
    let transform = sprite.transforms[i]
    let args = getInterpolatedArgs(transform, params)
    if (transform.type === 'scale' && (args[0] === 0 || args[1] === 0)) {
      return {coords, hidden: true}
    }
    if (i === 0) {
      transformMatrix = FromTransform[transform.type](args)
    } else {
      Transform[transform.type](transformMatrix, args)
    }
  }
  return {coords, opacity, transform: transformMatrix}
}

function getSpriteSheetMappings (doc) {
  let entityMappings = {}

  for (let entity of doc.querySelectorAll('.lr-entity')) {
    let entityName = getLRAttribute(entity, 'entity')

    let sprites = [...entity.querySelectorAll('.lr-sprite')]
    sprites = sprites.map(sprite => getSpriteProps(sprite, doc))

    entityMappings[entityName] = sprites
  }

  return entityMappings
}

let mappings = getSpriteSheetMappings(document)
console.log(mappings)

// require('./spriteSheetMappings.spec.js')





// http://glmatrix.net/docs/module-mat2d.html
// [a, c, tx,
//  b, d, ty]
function rotate(out, a, rad) {
  let a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
  let s = Math.sin(rad);
  let c = Math.cos(rad);
  out[0] = a0 *  c + a2 * s;
  out[1] = a1 *  c + a3 * s;
  out[2] = a0 * -s + a2 * c;
  out[3] = a1 * -s + a3 * c;
  out[4] = a4;
  out[5] = a5;
  return out;
}

function scale(out, a, v) {
  let a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
  let v0 = v[0], v1 = v[1];
  out[0] = a0 * v0;
  out[1] = a1 * v0;
  out[2] = a2 * v1;
  out[3] = a3 * v1;
  out[4] = a4;
  out[5] = a5;
  return out;
}

function translate(out, a, v) {
  let a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
  let v0 = v[0], v1 = v[1];
  out[0] = a0;
  out[1] = a1;
  out[2] = a2;
  out[3] = a3;
  out[4] = a0 * v0 + a2 * v1 + a4;
  out[5] = a1 * v0 + a3 * v1 + a5;
  return out;
}

function fromRotation(out, rad) {
  let s = Math.sin(rad), c = Math.cos(rad);
  out[0] = c;
  out[1] = s;
  out[2] = -s;
  out[3] = c;
  out[4] = 0;
  out[5] = 0;
  return out;
}

function fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = v[1];
  out[4] = 0;
  out[5] = 0;
  return out;
}

function fromTranslation(out, v) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = v[0];
  out[5] = v[1];
  return out;
}
