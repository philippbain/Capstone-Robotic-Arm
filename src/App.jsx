import './App.css'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Hero from './components/hero'
import Products from './components/products'

const LOADER_FADE_MS = 420
const PAGE_READY_TIMEOUT_MS = 6500

const getCurrentView = () => {
  if (typeof window === 'undefined') {
    return 'home'
  }
  return window.location.hash === '#/products' ? 'products' : 'home'
}

const waitForFonts = () => {
  if (typeof document === 'undefined' || !('fonts' in document) || !document.fonts?.ready) {
    return Promise.resolve()
  }
  return document.fonts.ready.catch(() => undefined)
}

const waitForImages = (container, timeoutMs = PAGE_READY_TIMEOUT_MS) =>
  new Promise((resolve) => {
    if (!container) {
      resolve()
      return
    }

    const pendingImages = new Set()
    const cleanupListeners = []
    let settleTimer
    let timeoutTimer
    let observer
    let isFinished = false

    const clearTimers = () => {
      window.clearTimeout(settleTimer)
      window.clearTimeout(timeoutTimer)
    }

    const finish = () => {
      if (isFinished) {
        return
      }
      isFinished = true
      clearTimers()
      observer?.disconnect()
      cleanupListeners.forEach((cleanup) => cleanup())
      resolve()
    }

    const scheduleSettleCheck = () => {
      if (isFinished) {
        return
      }
      window.clearTimeout(settleTimer)
      if (pendingImages.size !== 0) {
        return
      }
      settleTimer = window.setTimeout(() => {
        if (isFinished) {
          return
        }
        scanForImages()
        if (pendingImages.size === 0) {
          finish()
        }
      }, 120)
    }

    const attachImage = (img) => {
      if (pendingImages.has(img) || img.complete) {
        return
      }

      pendingImages.add(img)

      const markDone = () => {
        pendingImages.delete(img)
        scheduleSettleCheck()
      }

      img.addEventListener('load', markDone, { once: true })
      img.addEventListener('error', markDone, { once: true })
      cleanupListeners.push(() => {
        img.removeEventListener('load', markDone)
        img.removeEventListener('error', markDone)
      })
    }

    const scanForImages = () => {
      container.querySelectorAll('img').forEach((img) => attachImage(img))
      scheduleSettleCheck()
    }

    observer = new MutationObserver(scanForImages)
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'srcset'],
    })

    timeoutTimer = window.setTimeout(finish, timeoutMs)
    scanForImages()
  })

function App() {
  const [view, setView] = useState(getCurrentView)
  const [isLoaderVisible, setIsLoaderVisible] = useState(true)
  const [isLoaderFading, setIsLoaderFading] = useState(false)
  const [loaderTop, setLoaderTop] = useState(108)
  const pageRef = useRef(null)

  useEffect(() => {
    const handleHashChange = () => {
      setIsLoaderVisible(true)
      setIsLoaderFading(false)
      setView(getCurrentView())
    }

    if (!window.location.hash) {
      window.location.hash = '#/'
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  useLayoutEffect(() => {
    const readHeaderBottom = () => {
      const header = document.querySelector('.hero-header')
      if (!header) {
        return
      }
      const nextTop = Math.max(0, Math.round(header.getBoundingClientRect().bottom))
      setLoaderTop((previousTop) => (previousTop === nextTop ? previousTop : nextTop))
    }

    let animationFrameId = window.requestAnimationFrame(readHeaderBottom)
    window.addEventListener('resize', readHeaderBottom)

    let headerResizeObserver
    const header = document.querySelector('.hero-header')
    if (header && 'ResizeObserver' in window) {
      headerResizeObserver = new ResizeObserver(() => {
        readHeaderBottom()
      })
      headerResizeObserver.observe(header)
    }

    if ('fonts' in document && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        readHeaderBottom()
      })
    }

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', readHeaderBottom)
      headerResizeObserver?.disconnect()
    }
  }, [view])

  useEffect(() => {
    let isCancelled = false
    let fadeTimer

    const revealPage = async () => {
      await Promise.all([waitForFonts(), waitForImages(pageRef.current)])
      if (isCancelled) {
        return
      }
      setIsLoaderFading(true)
      fadeTimer = window.setTimeout(() => {
        if (isCancelled) {
          return
        }
        setIsLoaderVisible(false)
        setIsLoaderFading(false)
      }, LOADER_FADE_MS)
    }

    revealPage()

    return () => {
      isCancelled = true
      window.clearTimeout(fadeTimer)
    }
  }, [view])

  useEffect(() => {
    document.body.classList.toggle('is-page-loading', isLoaderVisible)
    return () => {
      document.body.classList.remove('is-page-loading')
    }
  }, [isLoaderVisible])

  return (
    <>
      <div ref={pageRef}>{view === 'products' ? <Products /> : <Hero />}</div>
      {isLoaderVisible && (
        <div className={`page-loader${isLoaderFading ? ' is-fading' : ''}`} style={{ top: loaderTop }} aria-hidden="true">
          <div className="page-loader-number">17</div>
        </div>
      )}
    </>
  )
}

export default App
