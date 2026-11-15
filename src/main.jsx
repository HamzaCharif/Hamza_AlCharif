import { createRoot } from 'react-dom/client'
import { Component, useEffect } from 'react'
import Experience from './scene/Experience'
import Overlay from './ui/Overlay'
import { useLab } from './store'
import './styles.css'

// If the 3D scene fails on a device, keep the page usable instead of going black.
class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(e) { console.error(e) }
  render() {
    if (this.state.failed) return <div className="scene-failed">The 3D room couldn't load on this device. The info panels still work.</div>
    return this.props.children
  }
}

function App() {
  const setContent = useLab((s) => s.setContent)
  useEffect(() => {
    fetch('./content.json', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setContent)
      .catch(() => setContent({ profile: { name: 'Hamza AlCharif', role: '' }, sections: {} }))
  }, [setContent])
  return (
    <>
      <div className="stage"><SceneBoundary><Experience /></SceneBoundary></div>
      <Overlay />
    </>
  )
}

createRoot(document.getElementById('root')).render(<App />)
