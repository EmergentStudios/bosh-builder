function getBBox (node) {
  let {x, y, width, height} = node.getBBox()
  let bb = node.getAttributeNS('https://www.linerider.com', 'bbox')
  if (bb) {
    let [top, left, bottom, right] = bb.split(' ').map(v => parseFloat(v))
    x -= left
    y -= top
    width += left + right
    height += top + bottom
  }

  let tight = {x, y, width, height}

  let x2 = Math.round(x + width) + 1
  let y2 = Math.round(y + height) + 1
  x = Math.round(x) - 1
  y = Math.round(y) - 1
  width = x2 - x
  height = y2 - y

  let bbox = {x, y, width, height}

  return [bbox, tight]
}

function showBoundingBoxes (doc) {
  let sprites = doc.getElementsByClassName('lr-sprite')

  let nodes = []

  for (let sprite of sprites) {
    if (sprite.childElementCount === 0) continue

    let [bbox, tight] = getBBox(sprite)

    nodes.push(
      `<rect fill="yellow" opacity="0.5" x="${bbox.x}" y="${bbox.y}" width="${bbox.width}" height="${bbox.height}"/>`,
      `<rect fill="green" opacity="0.5" x="${tight.x}" y="${tight.y}" width="${tight.width}" height="${tight.height}"/>`
    )
  }

  doc.getElementById('bbox').innerHTML = nodes.join('\n')
}

function addBBox (doc) {
  let sprites = doc.getElementsByClassName('lr-sprite')

  for (let sprite of sprites) {
    if (sprite.childElementCount === 0) continue

    let [bbox] = getBBox(sprite)
    sprite.removeAttributeNS('https://www.linerider.com', 'bbox')

    let rect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('class', 'lr-bbox')
    rect.setAttribute('x', bbox.x)
    rect.setAttribute('y', bbox.y)
    rect.setAttribute('width', bbox.width)
    rect.setAttribute('height', bbox.height)
    sprite.appendChild(rect)
  }
}

showBoundingBoxes(document)

let button = document.createElementNS('http://www.w3.org/2000/svg', 'g')
button.innerHTML = `<text x="10" y="100" transform="scale(0.5)">click2download</text>`
button.onclick = () => {
  addBBox(document)

  document.rootElement.removeChild(document.querySelector('text').parentNode)
  document.rootElement.removeChild(document.querySelector('script'))
  document.rootElement.removeChild(document.getElementById('bg'))
  document.rootElement.removeChild(document.getElementById('anim-preview'))

  let text = (new XMLSerializer()).serializeToString(document)

  let win = window.open()
  if (!win) {
    alert('enable pop ups pls')
  } else {
    win.document.body.innerHTML = `
    <a download="bosh-sprite.svg" href="${'data:image/svg+xml,' + encodeURIComponent(text)}">
      <text>download</text>
    </a>`
  }

}
document.rootElement.appendChild(button)
