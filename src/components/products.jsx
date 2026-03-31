import { useEffect, useRef, useState } from 'react'
import fullAssemblyRender from '../assets/product page photos/full assembly render.png'
import nema23Image from '../assets/product page photos/NEMA23.png'
import nema23ExplodedImage from '../assets/product page photos/NEMA23  Exploded.png'
import feaLinkImage from '../assets/product page photos/FEA link.jpeg'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const boxCallout = {
  targetX: 83,
  targetY: 69.6,
  labelX: 97.2,
  labelY: 67,
}

const cycloidalCallout = {
  labelX: 11.5,
  labelY: 13.8,
  targets: [
    { x: 31.6, y: 20.6 },
  ],
}

const endEffectorCallout = {
  targetX: 67.8,
  targetY: 34.6,
  labelX: 86.8,
  labelY: 11.2,
}

const linksCallout = {
  targetX: 37.2,
  targetY: 40.2,
  labelX: 19.8,
  labelY: 35.2,
}

const reedSwitchesCallout = {
  targetX: 34.6,
  targetY: 49.6,
  labelX: 10.8,
  labelY: 69.4,
}

const createWhiteBackgroundCutout = async (
  imageSource,
  {
    minBrightness = 180,
    maxChroma = 26,
    distThreshold = 9200,
    removeInteriorBackground = false,
    interiorMinBrightness = 20,
    interiorMaxChroma = 70,
    interiorDistThreshold = 26000,
  } = {},
) => {
  const image = new Image()
  image.src = imageSource

  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = reject
  })

  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const context = canvas.getContext('2d')

  if (!context) {
    return imageSource
  }

  context.drawImage(image, 0, 0)
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = imageData
  const width = canvas.width
  const height = canvas.height
  const totalPixels = width * height

  const visited = new Uint8Array(totalPixels)
  const queue = new Uint32Array(totalPixels)
  let head = 0
  let tail = 0

  let borderSampleCount = 0
  let borderSumR = 0
  let borderSumG = 0
  let borderSumB = 0

  const sampleBorderPixel = (x, y) => {
    const flat = y * width + x
    const idx = flat * 4
    if (data[idx + 3] === 0) {
      return
    }
    borderSampleCount += 1
    borderSumR += data[idx]
    borderSumG += data[idx + 1]
    borderSumB += data[idx + 2]
  }

  for (let x = 0; x < width; x += 2) {
    sampleBorderPixel(x, 0)
    sampleBorderPixel(x, height - 1)
  }
  for (let y = 1; y < height - 1; y += 2) {
    sampleBorderPixel(0, y)
    sampleBorderPixel(width - 1, y)
  }

  const backgroundR = borderSampleCount > 0 ? borderSumR / borderSampleCount : 255
  const backgroundG = borderSampleCount > 0 ? borderSumG / borderSampleCount : 255
  const backgroundB = borderSampleCount > 0 ? borderSumB / borderSampleCount : 255

  const isBackgroundPixel = (flatIndex) => {
    const idx = flatIndex * 4
    const r = data[idx]
    const g = data[idx + 1]
    const b = data[idx + 2]
    const a = data[idx + 3]
    const maxChannel = Math.max(r, g, b)
    const minChannel = Math.min(r, g, b)
    const brightness = (r + g + b) / 3
    const lowChroma = maxChannel - minChannel <= maxChroma
    const distSq =
      (r - backgroundR) * (r - backgroundR) +
      (g - backgroundG) * (g - backgroundG) +
      (b - backgroundB) * (b - backgroundB)

    return a > 0 && lowChroma && brightness >= minBrightness && distSq <= distThreshold
  }

  const push = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return
    }

    const flat = y * width + x
    if (visited[flat] === 1 || !isBackgroundPixel(flat)) {
      return
    }
    visited[flat] = 1
    queue[tail] = flat
    tail += 1
  }

  for (let x = 0; x < width; x += 1) {
    push(x, 0)
    push(x, height - 1)
  }
  for (let y = 1; y < height - 1; y += 1) {
    push(0, y)
    push(width - 1, y)
  }

  while (head < tail) {
    const flat = queue[head]
    head += 1
    const x = flat % width
    const y = Math.floor(flat / width)

    push(x - 1, y)
    push(x + 1, y)
    push(x, y - 1)
    push(x, y + 1)
  }

  for (let flat = 0; flat < totalPixels; flat += 1) {
    if (visited[flat] === 1) {
      data[flat * 4 + 3] = 0
    }
  }

  if (removeInteriorBackground) {
    for (let flat = 0; flat < totalPixels; flat += 1) {
      if (visited[flat] === 1) {
        continue
      }

      const idx = flat * 4
      const alpha = data[idx + 3]
      if (alpha === 0) {
        continue
      }

      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const brightness = (r + g + b) / 3
      const lowChroma = Math.max(r, g, b) - Math.min(r, g, b) <= interiorMaxChroma
      const distSq =
        (r - backgroundR) * (r - backgroundR) +
        (g - backgroundG) * (g - backgroundG) +
        (b - backgroundB) * (b - backgroundB)

      if (lowChroma && brightness >= interiorMinBrightness && distSq <= interiorDistThreshold) {
        data[idx + 3] = 0
        visited[flat] = 1
      }
    }
  }

  const brightCandidate = new Uint8Array(totalPixels)
  const brightVisited = new Uint8Array(totalPixels)
  const brightQueue = new Uint32Array(totalPixels)
  const brightComponentMaxSize = Math.max(1200, Math.round(totalPixels * 0.02))

  for (let flat = 0; flat < totalPixels; flat += 1) {
    if (visited[flat] === 1) {
      continue
    }
    const idx = flat * 4
    if (data[idx + 3] === 0) {
      continue
    }

    const r = data[idx]
    const g = data[idx + 1]
    const b = data[idx + 2]
    const brightness = (r + g + b) / 3
    const lowChroma = Math.max(r, g, b) - Math.min(r, g, b) <= 28
    if (lowChroma && brightness >= 206) {
      brightCandidate[flat] = 1
    }
  }

  for (let flat = 0; flat < totalPixels; flat += 1) {
    if (brightCandidate[flat] !== 1 || brightVisited[flat] === 1) {
      continue
    }

    let queueHead = 0
    let queueTail = 0
    let componentBrightnessSum = 0
    let componentSize = 0
    let touchesRemovedBackground = false
    const componentPixels = []

    brightVisited[flat] = 1
    brightQueue[queueTail] = flat
    queueTail += 1

    while (queueHead < queueTail) {
      const current = brightQueue[queueHead]
      queueHead += 1
      componentPixels.push(current)
      componentSize += 1
      const currentIdx = current * 4
      componentBrightnessSum += (data[currentIdx] + data[currentIdx + 1] + data[currentIdx + 2]) / 3

      const x = current % width
      const y = Math.floor(current / width)
      const neighbors = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]

      for (let i = 0; i < neighbors.length; i += 1) {
        const [nx, ny] = neighbors[i]
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
          continue
        }
        const neighborFlat = ny * width + nx
        if (visited[neighborFlat] === 1) {
          touchesRemovedBackground = true
        }
        if (brightCandidate[neighborFlat] === 1 && brightVisited[neighborFlat] !== 1) {
          brightVisited[neighborFlat] = 1
          brightQueue[queueTail] = neighborFlat
          queueTail += 1
        }
      }
    }

    const avgBrightness = componentBrightnessSum / Math.max(1, componentSize)
    const shouldRemoveComponent =
      componentSize <= brightComponentMaxSize && (touchesRemovedBackground || avgBrightness >= 226)

    if (!shouldRemoveComponent) {
      continue
    }

    for (let i = 0; i < componentPixels.length; i += 1) {
      const pixel = componentPixels[i]
      data[pixel * 4 + 3] = 0
      visited[pixel] = 1
    }
  }

  for (let flat = 0; flat < totalPixels; flat += 1) {
    if (visited[flat] === 1) {
      continue
    }

    const idx = flat * 4
    const alpha = data[idx + 3]
    if (alpha === 0) {
      continue
    }

    const r = data[idx]
    const g = data[idx + 1]
    const b = data[idx + 2]
    const maxChannel = Math.max(r, g, b)
    const minChannel = Math.min(r, g, b)
    const brightness = (r + g + b) / 3
    const lowChroma = maxChannel - minChannel <= 34

    if (!lowChroma || brightness < 168) {
      continue
    }

    const x = flat % width
    const y = Math.floor(flat / width)
    let removedNeighborCount = 0

    for (let ny = y - 1; ny <= y + 1; ny += 1) {
      if (ny < 0 || ny >= height) {
        continue
      }
      for (let nx = x - 1; nx <= x + 1; nx += 1) {
        if (nx < 0 || nx >= width || (nx === x && ny === y)) {
          continue
        }
        if (visited[ny * width + nx] === 1) {
          removedNeighborCount += 1
        }
      }
    }

    if (removedNeighborCount === 0) {
      continue
    }

    const edgeFactor = removedNeighborCount / 8
    let softenedAlpha = alpha

    if (brightness >= 236) {
      softenedAlpha = Math.round(alpha * (0.03 + (1 - edgeFactor) * 0.1))
    } else if (brightness >= 220) {
      softenedAlpha = Math.round(alpha * (0.17 + (1 - edgeFactor) * 0.2))
    } else if (brightness >= 200) {
      softenedAlpha = Math.round(alpha * (0.34 + (1 - edgeFactor) * 0.24))
    } else {
      softenedAlpha = Math.round(alpha * (0.56 + (1 - edgeFactor) * 0.22))
    }

    data[idx + 3] = Math.min(alpha, Math.max(0, softenedAlpha))
  }

  context.putImageData(imageData, 0, 0)

  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha === 0) {
        continue
      }
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }

  if (maxX < minX || maxY < minY) {
    return canvas.toDataURL('image/png')
  }

  const cropPadding = 10
  const cropX = Math.max(0, minX - cropPadding)
  const cropY = Math.max(0, minY - cropPadding)
  const cropWidth = Math.min(width - cropX, maxX - minX + 1 + cropPadding * 2)
  const cropHeight = Math.min(height - cropY, maxY - minY + 1 + cropPadding * 2)

  const croppedCanvas = document.createElement('canvas')
  croppedCanvas.width = cropWidth
  croppedCanvas.height = cropHeight
  const croppedContext = croppedCanvas.getContext('2d')

  if (!croppedContext) {
    return canvas.toDataURL('image/png')
  }

  croppedContext.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
  return croppedCanvas.toDataURL('image/png')
}

function PartDetailsModal({
  onClose,
  title,
  description,
  placeholder,
  idPrefix,
  closeAriaLabel,
  children,
  modalClassName,
}) {
  const modalRef = useRef(null)

  useEffect(() => {
    const previousFocusedElement = document.activeElement
    const modalNode = modalRef.current
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const getFocusableElements = () => {
      if (!modalNode) {
        return []
      }
      return Array.from(modalNode.querySelectorAll(FOCUSABLE_SELECTOR))
    }

    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    } else {
      modalNode?.focus()
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const orderedFocusable = getFocusableElements()
      if (orderedFocusable.length === 0) {
        event.preventDefault()
        return
      }

      const firstElement = orderedFocusable[0]
      const lastElement = orderedFocusable[orderedFocusable.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
      if (previousFocusedElement instanceof HTMLElement) {
        previousFocusedElement.focus()
      }
    }
  }, [onClose])

  const titleId = `${idPrefix}-title`
  const descriptionId = `${idPrefix}-description`

  return (
    <div className="category-modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section
        ref={modalRef}
        className={`category-modal${modalClassName ? ` ${modalClassName}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <button className="modal-close-button" onClick={onClose} aria-label={closeAriaLabel}>
          x
        </button>

        <header className="category-modal-header">
          <h2 id={titleId}>{title}</h2>
          {description ? <p id={descriptionId}>{description}</p> : null}
        </header>

        <div className="category-modal-body">
          {children ?? <p className="box-details-placeholder">{placeholder}</p>}
        </div>
      </section>
    </div>
  )
}

function Products() {
  const [showcaseImage, setShowcaseImage] = useState(fullAssemblyRender)
  const [isBoxModalOpen, setIsBoxModalOpen] = useState(false)
  const [isCycloidalModalOpen, setIsCycloidalModalOpen] = useState(false)
  const [isEndEffectorModalOpen, setIsEndEffectorModalOpen] = useState(false)
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false)
  const [isReedSwitchesModalOpen, setIsReedSwitchesModalOpen] = useState(false)
  const [nema23CutoutImage, setNema23CutoutImage] = useState(nema23Image)
  const [nema23ExplodedCutoutImage, setNema23ExplodedCutoutImage] = useState(nema23ExplodedImage)
  const [feaLinkCutoutImage, setFeaLinkCutoutImage] = useState(feaLinkImage)

  useEffect(() => {
    const createTransparentShowcaseImage = async () => {
      const image = new Image()
      image.src = fullAssemblyRender

      await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = reject
      })

      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d')

      if (!context) {
        return fullAssemblyRender
      }

      context.drawImage(image, 0, 0)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      const width = canvas.width
      const height = canvas.height
      const totalPixels = width * height

      const visited = new Uint8Array(totalPixels)
      const queue = new Uint32Array(totalPixels)
      let head = 0
      let tail = 0

      let borderSampleCount = 0
      let borderSumR = 0
      let borderSumG = 0
      let borderSumB = 0

      const sampleBorderPixel = (x, y) => {
        const flat = y * width + x
        const idx = flat * 4
        if (data[idx + 3] === 0) {
          return
        }
        borderSampleCount += 1
        borderSumR += data[idx]
        borderSumG += data[idx + 1]
        borderSumB += data[idx + 2]
      }

      for (let x = 0; x < width; x += 3) {
        sampleBorderPixel(x, 0)
        sampleBorderPixel(x, height - 1)
      }
      for (let y = 1; y < height - 1; y += 3) {
        sampleBorderPixel(0, y)
        sampleBorderPixel(width - 1, y)
      }

      const backgroundR = borderSampleCount > 0 ? borderSumR / borderSampleCount : 255
      const backgroundG = borderSampleCount > 0 ? borderSumG / borderSampleCount : 255
      const backgroundB = borderSampleCount > 0 ? borderSumB / borderSampleCount : 255

      const isWhiteBackground = (flatIndex) => {
        const idx = flatIndex * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        const a = data[idx + 3]
        const maxChannel = Math.max(r, g, b)
        const minChannel = Math.min(r, g, b)
        const brightness = (r + g + b) / 3
        const lowChroma = maxChannel - minChannel <= 34
        const distSq =
          (r - backgroundR) * (r - backgroundR) +
          (g - backgroundG) * (g - backgroundG) +
          (b - backgroundB) * (b - backgroundB)

        return (
          a > 0 &&
          ((lowChroma && brightness >= 175 && distSq <= 10500) || (lowChroma && brightness >= 232))
        )
      }

      const push = (x, y) => {
        if (x < 0 || x >= width || y < 0 || y >= height) {
          return
        }
        const flat = y * width + x
        if (visited[flat] === 1 || !isWhiteBackground(flat)) {
          return
        }
        visited[flat] = 1
        queue[tail] = flat
        tail += 1
      }

      for (let x = 0; x < width; x += 1) {
        push(x, 0)
        push(x, height - 1)
      }
      for (let y = 1; y < height - 1; y += 1) {
        push(0, y)
        push(width - 1, y)
      }

      while (head < tail) {
        const flat = queue[head]
        head += 1
        const x = flat % width
        const y = Math.floor(flat / width)

        push(x - 1, y)
        push(x + 1, y)
        push(x, y - 1)
        push(x, y + 1)
      }

      for (let flat = 0; flat < totalPixels; flat += 1) {
        if (visited[flat] === 1) {
          data[flat * 4 + 3] = 0
        }
      }

      for (let flat = 0; flat < totalPixels; flat += 1) {
        if (visited[flat] === 1) {
          continue
        }

        const idx = flat * 4
        const alpha = data[idx + 3]
        if (alpha === 0) {
          continue
        }

        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        const maxChannel = Math.max(r, g, b)
        const minChannel = Math.min(r, g, b)
        const brightness = (r + g + b) / 3
        const lowChroma = maxChannel - minChannel <= 28

        if (!lowChroma || brightness < 186) {
          continue
        }

        const x = flat % width
        const y = Math.floor(flat / width)
        let touchesRemoved = false

        for (let ny = y - 1; ny <= y + 1 && !touchesRemoved; ny += 1) {
          if (ny < 0 || ny >= height) {
            continue
          }
          for (let nx = x - 1; nx <= x + 1; nx += 1) {
            if (nx < 0 || nx >= width || (nx === x && ny === y)) {
              continue
            }
            if (visited[ny * width + nx] === 1) {
              touchesRemoved = true
              break
            }
          }
        }

        if (!touchesRemoved) {
          continue
        }

        if (brightness >= 236) {
          data[idx + 3] = 0
        } else if (brightness >= 212) {
          data[idx + 3] = Math.min(alpha, Math.round(alpha * 0.18))
        } else {
          data[idx + 3] = Math.min(alpha, Math.round(alpha * 0.42))
        }
      }

      context.putImageData(imageData, 0, 0)
      return canvas.toDataURL('image/png')
    }

    let isCancelled = false

    createTransparentShowcaseImage()
      .then((result) => {
        if (!isCancelled) {
          setShowcaseImage(result)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setShowcaseImage(fullAssemblyRender)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    let isCancelled = false

    Promise.all([
      createWhiteBackgroundCutout(nema23Image),
      createWhiteBackgroundCutout(nema23ExplodedImage),
      createWhiteBackgroundCutout(feaLinkImage, {
        minBrightness: 0,
        maxChroma: 54,
        distThreshold: 13500,
        removeInteriorBackground: true,
        interiorMinBrightness: 18,
        interiorMaxChroma: 78,
        interiorDistThreshold: 28500,
      }),
    ])
      .then(([nema23Cutout, nema23ExplodedCutout, feaLinkCutout]) => {
        if (!isCancelled) {
          setNema23CutoutImage(nema23Cutout)
          setNema23ExplodedCutoutImage(nema23ExplodedCutout)
          setFeaLinkCutoutImage(feaLinkCutout)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setNema23CutoutImage(nema23Image)
          setNema23ExplodedCutoutImage(nema23ExplodedImage)
          setFeaLinkCutoutImage(feaLinkImage)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  const calloutStartX = boxCallout.labelX - 5.2
  const calloutStartY = boxCallout.labelY
  const cycloidalStartX = cycloidalCallout.labelX + 8.2
  const cycloidalStartY = cycloidalCallout.labelY
  const endEffectorStartX = endEffectorCallout.labelX - 7
  const endEffectorStartY = endEffectorCallout.labelY
  const linksStartX = linksCallout.labelX + 4.6
  const linksStartY = linksCallout.labelY
  const reedSwitchesStartX = reedSwitchesCallout.labelX + 7.1
  const reedSwitchesStartY = reedSwitchesCallout.labelY

  return (
    <main className="hero-page products-page">
      <div className="hero-content products-content">
        <header className="hero-header">
          <h1 className="hero-title">
            <span className="hero-title-prefix">Team 17</span>
            <span className="hero-title-main">C-3PA</span>
          </h1>
          <nav className="hero-nav" aria-label="Primary">
            <a className="nav-tab" href="#/">
              Home
            </a>
            <a className="nav-tab is-active" href="#/products" aria-current="page">
              Products
            </a>
            <a className="nav-tab" href="#/demos">
              Demos
            </a>
          </nav>
        </header>

        <section className="products-layout" aria-label="Interactive robotic arm product view">
          <div className="products-showcase-shell">
            <figure className="products-showcase-figure">
              <img
                src={showcaseImage}
                alt="Full assembly render of Team 17 robotic arm with interactive box region"
              />

              <svg className="box-callout-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <line
                  className="box-callout-path"
                  x1={calloutStartX}
                  y1={calloutStartY}
                  x2={boxCallout.targetX}
                  y2={boxCallout.targetY}
                />
                {cycloidalCallout.targets.map((target) => (
                  <line
                    key={`cycloidal-line-${target.x}-${target.y}`}
                    className="cycloidal-callout-path"
                    x1={cycloidalStartX}
                    y1={cycloidalStartY}
                    x2={target.x}
                    y2={target.y}
                  />
                ))}
                <line
                  className="box-callout-path"
                  x1={endEffectorStartX}
                  y1={endEffectorStartY}
                  x2={endEffectorCallout.targetX}
                  y2={endEffectorCallout.targetY}
                />
                <line
                  className="box-callout-path"
                  x1={linksStartX}
                  y1={linksStartY}
                  x2={linksCallout.targetX}
                  y2={linksCallout.targetY}
                />
                <line
                  className="box-callout-path"
                  x1={reedSwitchesStartX}
                  y1={reedSwitchesStartY}
                  x2={reedSwitchesCallout.targetX}
                  y2={reedSwitchesCallout.targetY}
                />
              </svg>

              <button
                type="button"
                className="box-callout-button end-effector-callout-button"
                style={{
                  left: `${endEffectorCallout.labelX}%`,
                  top: `${endEffectorCallout.labelY}%`,
                }}
                onPointerDown={(event) => {
                  event.preventDefault()
                  setIsEndEffectorModalOpen(true)
                }}
                onClick={() => setIsEndEffectorModalOpen(true)}
                aria-label="Open end effector details"
              >
                End Effector
              </button>

              <button
                type="button"
                className="box-callout-button cycloidal-callout-button"
                style={{
                  left: `${cycloidalCallout.labelX}%`,
                  top: `${cycloidalCallout.labelY}%`,
                }}
                onPointerDown={(event) => {
                  event.preventDefault()
                  setIsCycloidalModalOpen(true)
                }}
                onClick={() => setIsCycloidalModalOpen(true)}
                aria-label="Open cycloidal drives details"
              >
                Cycloidal Drives
              </button>

              <button
                type="button"
                className="box-callout-button links-callout-button"
                style={{
                  left: `${linksCallout.labelX}%`,
                  top: `${linksCallout.labelY}%`,
                }}
                onPointerDown={(event) => {
                  event.preventDefault()
                  setIsLinksModalOpen(true)
                }}
                onClick={() => setIsLinksModalOpen(true)}
                aria-label="Open arm links details"
              >
                Links
              </button>

              <button
                type="button"
                className="box-callout-button"
                style={{
                  left: `${boxCallout.labelX}%`,
                  top: `${boxCallout.labelY}%`,
                }}
                onPointerDown={(event) => {
                  event.preventDefault()
                  setIsBoxModalOpen(true)
                }}
                onClick={() => setIsBoxModalOpen(true)}
                aria-label="Open electrical control box details"
              >
                Electrical Box
              </button>

              <button
                type="button"
                className="box-callout-button reed-switches-callout-button"
                style={{
                  left: `${reedSwitchesCallout.labelX}%`,
                  top: `${reedSwitchesCallout.labelY}%`,
                }}
                onPointerDown={(event) => {
                  event.preventDefault()
                  setIsReedSwitchesModalOpen(true)
                }}
                onClick={() => setIsReedSwitchesModalOpen(true)}
                aria-label="Open reed switches details"
              >
                Reed Switches
              </button>
            </figure>
          </div>
        </section>
      </div>

      {isBoxModalOpen && (
        <PartDetailsModal
          onClose={() => setIsBoxModalOpen(false)}
          idPrefix="box-details"
          title="Electrical Control Box"
          closeAriaLabel="Close box details"
        >
          <div className="box-details-copy">
            <p className="box-details-placeholder">
              Our electrical box serves as the brains of the project, housing all of the major electrical components
              required to operate the robot. Inside, it contains the power supply, stepper drivers, microcontroller,
              logic hardware, and voltage converters, creating a centralized system for power distribution, control,
              and communication. The box also supports a three-button control interface consisting of an on/off
              switch, an LED momentary homing button, and an emergency stop, giving the user a simple and accessible
              way to interact with the system.
            </p>
            <p className="box-details-placeholder">
              The enclosure was designed with modularity in mind. Each wall is a separate 3D-printed panel with its
              own dedicated inputs and outputs; for example, the left wall contains all of the aviator plugs for the
              motors and encoders, along with the DB15 connector for the reed switches and servo. The panels are
              joined together using dovetail features, which makes the box easy to assemble, easy to print, and highly
              adaptable for future design iterations, since individual panels can be reprinted without remaking the
              full enclosure. The box is printed in PETG for improved heat resistance and includes honeycomb
              ventilation on all panels to promote airflow and thermal management.
            </p>
          </div>
        </PartDetailsModal>
      )}

      {isCycloidalModalOpen && (
        <PartDetailsModal
          onClose={() => setIsCycloidalModalOpen(false)}
          idPrefix="cycloidal-details"
          title="Cycloidal Drives"
          modalClassName="cycloidal-details-modal"
          closeAriaLabel="Close cycloidal drive details"
        >
          <section className="cycloidal-modal-layout" aria-label="Cycloidal drive visual breakdown">
            <figure className="cycloidal-modal-figure">
              <img src={nema23CutoutImage} alt="NEMA 23 motor view" />
            </figure>

            <div className="cycloidal-modal-copy">
              <p>
                Our cycloidal drives are engineered for high precision, strong torque output, and compact integration
                within the robot arm. Designed to provide smooth, reliable motion under load, they allow the system
                to achieve accurate joint positioning while maintaining the strength needed for more demanding
                movements. Each drive is 3D printed in PLA using 25% infill, 4 walls, and a triangular infill
                pattern, providing a practical balance between strength, weight, and manufacturability. We use a 40:1
                reduction ratio for the shoulder and elbow joints, 30:1 for the wrist, and 20:1 for the yaw axis,
                giving each joint a ratio tailored to its torque and speed requirements. This setup helps balance
                power, control, and responsiveness across the arm, and allows the system to comfortably handle a
                5-pound payload at full extension, making the drives well suited for robotic applications that demand
                both precision and durability.
              </p>
            </div>

            <figure className="cycloidal-modal-figure cycloidal-modal-figure-exploded">
              <img src={nema23ExplodedCutoutImage} alt="NEMA 23 exploded view" />
            </figure>
          </section>

          <section className="cycloidal-specs-section" aria-label="NEMA 23 technical specifications">
            <h3>Technical Specifications</h3>
            <div className="cycloidal-specs-table-wrap">
              <table className="cycloidal-specs-table">
                <tbody>
                  <tr>
                    <th scope="row">Motor Type</th>
                    <td>NEMA 23 Stepper</td>
                  </tr>
                  <tr>
                    <th scope="row">Step Angle</th>
                    <td>1.8° (typical)</td>
                  </tr>
                  <tr>
                    <th scope="row">Rated Current</th>
                    <td>TBD (datasheet value)</td>
                  </tr>
                  <tr>
                    <th scope="row">Holding Torque</th>
                    <td>TBD (datasheet value)</td>
                  </tr>
                  <tr>
                    <th scope="row">Phase Resistance</th>
                    <td>TBD (datasheet value)</td>
                  </tr>
                  <tr>
                    <th scope="row">Inductance</th>
                    <td>TBD (datasheet value)</td>
                  </tr>
                  <tr>
                    <th scope="row">Supply Voltage</th>
                    <td>TBD (driver + motor configuration)</td>
                  </tr>
                  <tr>
                    <th scope="row">Shaft Diameter</th>
                    <td>TBD</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </PartDetailsModal>
      )}

      {isEndEffectorModalOpen && (
        <PartDetailsModal
          onClose={() => setIsEndEffectorModalOpen(false)}
          idPrefix="end-effector-details"
          title="End Effector"
          closeAriaLabel="Close end effector details"
        >
          <p className="box-details-placeholder">
            Our current end effector is designed with a forklift-style structure, paired with a servo-actuated
            gripping mechanism to provide secure and reliable handling. In the context of 3D print automation, the
            gripper clamps onto the build plate while the fork-style support carries the load, allowing the system to
            lift and move prints in a stable and controlled manner. This combination improves consistency during part
            removal and makes the transfer process smooth, steady, and repeatable. It is also worth noting that the
            end effector is modular, allowing it to be swapped for different end-effector designs depending on the
            application. This flexibility supports our long-term goal of making the robot adaptable to a wider range
            of future tasks and use cases.
          </p>
        </PartDetailsModal>
      )}

      {isLinksModalOpen && (
        <PartDetailsModal
          onClose={() => setIsLinksModalOpen(false)}
          idPrefix="links-details"
          title="Links"
          closeAriaLabel="Close arm links details"
        >
          <div className="box-details-copy">
            <p className="box-details-placeholder">
              Our links are designed to provide a strong, lightweight structure while also serving a functional role
              in the arm&apos;s modular construction. Each link is 3D printed in PLA using 25% infill, 4 walls, and a
              triangular infill pattern to balance strength, weight, and manufacturability. The links are press-fit
              together through a spline feature, creating a secure and repeatable connection between sections while
              simplifying assembly. Together, they make up a total arm reach of 1.5 meters. At one end, each link
              acts as a motor housing, while the other connects to the previous cycloidal drive, allowing motion to be
              transferred smoothly through the arm.
            </p>

            <figure className="links-fea-figure">
              <img src={feaLinkCutoutImage} alt="FEA analysis render of a robotic arm link" />
            </figure>
          </div>
        </PartDetailsModal>
      )}

      {isReedSwitchesModalOpen && (
        <PartDetailsModal
          onClose={() => setIsReedSwitchesModalOpen(false)}
          idPrefix="reed-switches-details"
          title="Reed Switches"
          placeholder="Our robot uses normally open reed switches as magnetic limit switches, providing a simple and reliable solution that also makes manufacturing and assembly easier. Each sensor is made up of a reed switch and a magnet; when the magnet passes in front of the switch, the internal contacts close, pulling the Teensy 4.1 input from 3.3 V to ground and causing its signal to change from HIGH to LOW. This allows the controller to detect precise reference points for each joint, enabling consistent homing and helping the robot maintain accurate positional awareness throughout operation."
          closeAriaLabel="Close reed switches details"
        />
      )}
    </main>
  )
}

export default Products
