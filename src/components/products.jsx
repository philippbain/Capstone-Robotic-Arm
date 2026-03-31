import { useEffect, useRef, useState } from 'react'
import fullAssemblyRender from '../assets/product page photos/full assembly render.png'

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

function PartDetailsModal({ onClose, title, description, placeholder, idPrefix, closeAriaLabel }) {
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
        className="category-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <button className="modal-close-button" onClick={onClose} aria-label={closeAriaLabel}>
          Close
        </button>

        <header className="category-modal-header">
          <h2 id={titleId}>{title}</h2>
          <p id={descriptionId}>{description}</p>
        </header>

        <div className="category-modal-body">
          <p className="box-details-placeholder">{placeholder}</p>
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
            <span className="hero-title-main">Robotic Arm</span>
          </h1>
          <nav className="hero-nav" aria-label="Primary">
            <a className="nav-tab" href="#/">
              Home
            </a>
            <a className="nav-tab is-active" href="#/products" aria-current="page">
              Products
            </a>
            <a className="nav-tab" href="#">
              Engineering
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
          description="This section is now connected to the full box region. Replace this text with your final technical details, specs, and diagrams when you are ready."
          placeholder="Placeholder ready: add box internals, wiring layout, connector mapping, and safety features here."
          closeAriaLabel="Close box details"
        />
      )}

      {isCycloidalModalOpen && (
        <PartDetailsModal
          onClose={() => setIsCycloidalModalOpen(false)}
          idPrefix="cycloidal-details"
          title="Cycloidal Drives"
          description="This section highlights the cycloidal drive joint modules. Replace this text with your final drive ratio, torque, material, and manufacturing details."
          placeholder="Placeholder ready: add drive geometry, reduction stages, bearing setup, and performance metrics here."
          closeAriaLabel="Close cycloidal drive details"
        />
      )}

      {isEndEffectorModalOpen && (
        <PartDetailsModal
          onClose={() => setIsEndEffectorModalOpen(false)}
          idPrefix="end-effector-details"
          title="End Effector"
          description="This section highlights the end-effector assembly at the tool tip. Replace this text with your final gripper/tooling design, interfaces, and operation details."
          placeholder="Placeholder ready: add end-effector mechanism, actuation method, and supported task configurations here."
          closeAriaLabel="Close end effector details"
        />
      )}

      {isLinksModalOpen && (
        <PartDetailsModal
          onClose={() => setIsLinksModalOpen(false)}
          idPrefix="links-details"
          title="Arm Links"
          description="This section highlights the structural arm links. Replace this text with your final geometry, stiffness, and manufacturing details."
          placeholder="Placeholder ready: add link material, wall thickness, mounting interfaces, and load path details here."
          closeAriaLabel="Close arm links details"
        />
      )}

      {isReedSwitchesModalOpen && (
        <PartDetailsModal
          onClose={() => setIsReedSwitchesModalOpen(false)}
          idPrefix="reed-switches-details"
          title="Reed Switches"
          description="This section highlights the reed switch sensing feature. Replace this text with your final switching logic, wiring, and trigger-position details."
          placeholder="Placeholder ready: add sensor placement, magnetic threshold values, debounce logic, and interface details here."
          closeAriaLabel="Close reed switches details"
        />
      )}
    </main>
  )
}

export default Products
