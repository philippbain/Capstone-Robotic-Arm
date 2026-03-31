import './App.css'
import { useEffect, useState } from 'react'
import Hero from './components/hero'
import Products from './components/products'

const getCurrentView = () => {
  if (typeof window === 'undefined') {
    return 'home'
  }
  return window.location.hash === '#/products' ? 'products' : 'home'
}

function App() {
  const [view, setView] = useState(getCurrentView)

  useEffect(() => {
    const handleHashChange = () => {
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

  if (view === 'products') {
    return <Products />
  }

  return <Hero />
}

export default App
