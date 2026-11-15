import { useEffect, useRef, useState } from 'react'
import { useLab, HOTSPOTS, STATIONS, STATION_ORDER, walkInput } from '../store'
import { startAudio, setRain } from '../audio'
import Desktop from './Desktop'
import { initSpotify, playSpotify, toggleSpotify, subscribe } from '../spotify'

function Stamp({ status }) {
  const text = { done: 'Done', ongoing: 'In progress', planned: 'Planned' }[status] || status
  return <span className={`stamp stamp-${status}`}>{text}</span>
}

function Item({ item }) {
  return (
    <article className="item">
      <header className="item-head">
        <h3>{item.name}</h3>
        {item.status && <Stamp status={item.status} />}
      </header>
      {(item.period || item.badge) && (
        <p className="item-meta">
          <span>{item.period}</span>
          {item.badge && <span className="ribbon">{item.badge}</span>}
        </p>
      )}
      {item.status === 'ongoing' && typeof item.progress === 'number' && (
        <div className="progress" role="img" aria-label={`${item.progress}% done`}>
          <div className="progress-track"><span style={{ width: `${item.progress}%` }} /></div>
          <em>{item.progress}%</em>
        </div>
      )}
      {item.summary && <p>{item.summary}</p>}
      {item.tags?.length > 0 && (
        <ul className="tags">{item.tags.map((t) => <li key={t}>{t}</li>)}</ul>
      )}
      {item.links?.length > 0 && (
        <div className="links">
          {item.links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer">{l.label} ↗</a>
          ))}
        </div>
      )}
    </article>
  )
}

// ---------- Music (Spotify) ----------
function useSpotify() {
  const [st, setSt] = useState({ status: 'idle', paused: true })
  useEffect(() => subscribe(setSt), [])
  return st
}

const playlistUrl = (content) => content?.sections?.music?.links?.[0]?.href

// The player lives in one docked card that stays mounted (so the music keeps playing);
// the music button and the speakers just show or hide it.
function SpotifyDock() {
  const ref = useRef()
  const content = useLab((s) => s.content)
  const open = useLab((s) => s.musicOpen)
  const setOpen = useLab((s) => s.setMusicOpen)
  const st = useSpotify()
  const uri = content?.sections?.music?.playlist
  useEffect(() => {
    if (uri && ref.current) initSpotify(ref.current, uri)
  }, [uri])
  return (
    <div className={`spotify-dock ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="dock-top">
        <span>My playlist</span>
        <button onClick={() => setOpen(false)} aria-label="Hide player">×</button>
      </div>
      <div ref={ref} />
      {st.status === 'blocked' && (
        <p className="dock-note">
          Spotify couldn't load here. <a href={playlistUrl(content)} target="_blank" rel="noreferrer">Open the playlist ↗</a>
        </p>
      )}
    </div>
  )
}

function MusicPanelBody({ sec }) {
  const setOpen = useLab((s) => s.setMusicOpen)
  return (
    <>
      <button className="cta as-button" onClick={() => setOpen(true)}>Show the player</button>
      <p>Visitors who aren't logged in to Spotify hear 30-second previews of each song.</p>
      {sec.links?.length > 0 && (
        <div className="links">
          {sec.links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer">{l.label} ↗</a>
          ))}
        </div>
      )}
    </>
  )
}

function Panel() {
  const focus = useLab((s) => s.focus)
  const content = useLab((s) => s.content)
  const setFocus = useLab((s) => s.setFocus)
  if (!focus || !content || focus === 'monitor') return null

  const key = HOTSPOTS[focus].section
  const sec = content.sections[key] || {}
  let items = sec.items || []
  if (focus === 'drone') items = items.filter((i) => i.id === 'drone')
  const p = content.profile

  return (
    <aside className="panel" role="dialog" aria-label={sec.title}>
      <span className="tape" aria-hidden="true" />
      <div className="panel-top">
        <span className="eyebrow">{HOTSPOTS[focus].label}</span>
        <button className="back" onClick={() => setFocus(null)} autoFocus>
          ← back to the room
        </button>
      </div>
      <h2>{sec.title}</h2>
      {sec.body?.map((t, i) => <p key={i} className="lead">{t}</p>)}
      {key === 'music' && <MusicPanelBody sec={sec} />}
      {items.map((it) => <Item key={it.name} item={it} />)}
      {sec.cta && (
        <a className="cta" href={sec.cta.href} target="_blank" rel="noreferrer">{sec.cta.label} ↗</a>
      )}
      {key === 'contact' && (
        <dl className="contact">
          <dt>Email</dt><dd><span className="selectable">{p.email}</span></dd>
          <dt>LinkedIn</dt><dd><a href={p.linkedin} target="_blank" rel="noreferrer">{p.linkedin.replace('https://www.', '')}</a></dd>
          <dt>GitHub</dt><dd><a href={p.github} target="_blank" rel="noreferrer">{p.github.replace('https://', '')}</a></dd>
          <dt>Based in</dt><dd>{p.location}</dd>
        </dl>
      )}
    </aside>
  )
}

function Boot() {
  const entered = useLab((s) => s.entered)
  const enter = useLab((s) => s.enter)
  const content = useLab((s) => s.content)
  if (entered) return null
  const go = () => {
    startAudio()
    enter()
    playSpotify()
    useLab.getState().setMusicOpen(true)
  }
  return (
    <div className="boot">
      <div className="boot-card">
        <p className="boot-line">&gt; booting hamza_lab.exe</p>
        <h1>Hamza's Lab</h1>
        <p className="boot-sub">{content?.profile.role || 'Loading…'}</p>
        <button className="enter" onClick={go} disabled={!content}>Click to enter</button>
        <p className="boot-hint">Sound on for rain and music</p>
      </div>
    </div>
  )
}

function Icon({ d }) {
  return <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d={d} fill="currentColor" /></svg>
}
const ICON = {
  play: 'M8 5v14l11-7z',
  pause: 'M7 5h4v14H7zM13 5h4v14h-4z',
  rain: 'M7 14a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17.3 7.1 3.5 3.5 0 0 1 17 14H7zm1 2.5l-1 2.5h1.6l1-2.5zm4 0l-1 2.5h1.6l1-2.5zm4 0l-1 2.5h1.6l1-2.5z',
}

function Controls() {
  const st = useSpotify()
  const open = useLab((s) => s.musicOpen)
  const setOpen = useLab((s) => s.setMusicOpen)
  const rain = useLab((s) => s.rain)
  const setRainOn = useLab((s) => s.setRainOn)
  const toggleRain = () => {
    startAudio()
    setRain(!rain)
    setRainOn(!rain)
  }
  const playing = st.status === 'ready' && !st.paused
  return (
    <div className="controls">
      <div className="chip player">
        <button onClick={() => (st.status === 'ready' ? toggleSpotify() : setOpen(true))} aria-label={playing ? 'Pause music' : 'Play music'}>
          <Icon d={playing ? ICON.pause : ICON.play} />
        </button>
        <button className="now" onClick={() => setOpen(!open)} aria-expanded={open}>
          <strong>My playlist</strong>
          <span>{playing ? 'playing · tap to pick a song' : st.status === 'blocked' ? 'open on Spotify' : 'paused'}</span>
        </button>
      </div>
      <button className={`chip ${rain ? 'is-on' : ''}`} onClick={toggleRain} aria-pressed={rain}>
        <Icon d={ICON.rain} /> Rain {rain ? 'on' : 'off'}
      </button>
    </div>
  )
}

function Hint() {
  const walking = useLab((s) => s.walking)
  const station = useLab((s) => s.station)
  const text = walking
    ? 'WASD or arrow keys to walk · drag to look · click things to open them'
    : station === 'room'
      ? 'pick a spot below to look closer, or walk around'
      : 'drag to look around · click a label to open it'
  return <p className="hint">{text}</p>
}

function StationNav() {
  const station = useLab((s) => s.station)
  const walking = useLab((s) => s.walking)
  const focus = useLab((s) => s.focus)
  const setStation = useLab((s) => s.setStation)
  const setWalking = useLab((s) => s.setWalking)
  if (focus) return null
  return (
    <nav className="stations" aria-label="Move around the room">
      {STATION_ORDER.map((k) => (
        <button key={k} className={!walking && station === k ? 'is-on' : ''} onClick={() => setStation(k)}>
          {STATIONS[k].label}
        </button>
      ))}
      <button className={`walk ${walking ? 'is-on' : ''}`} onClick={() => setWalking(!walking)}>
        {walking ? 'Stop walking' : 'Walk around'}
      </button>
    </nav>
  )
}

// On-screen arrows for walking on touch screens.
function WalkPad() {
  const walking = useLab((s) => s.walking)
  const focus = useLab((s) => s.focus)
  if (!walking || focus) return null
  const hold = (f, r) => ({
    onPointerDown: (e) => { e.preventDefault(); walkInput.f = f; walkInput.r = r },
    onPointerUp: () => { walkInput.f = 0; walkInput.r = 0 },
    onPointerLeave: () => { walkInput.f = 0; walkInput.r = 0 },
  })
  return (
    <div className="walkpad" aria-hidden="true">
      <button {...hold(1, 0)} className="up">▲</button>
      <button {...hold(0, -1)} className="left">◀</button>
      <button {...hold(-1, 0)} className="down">▼</button>
      <button {...hold(0, 1)} className="right">▶</button>
    </div>
  )
}

export default function Overlay() {
  const setFocus = useLab((s) => s.setFocus)
  const entered = useLab((s) => s.entered)
  const focus = useLab((s) => s.focus)
  const content = useLab((s) => s.content)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setFocus(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setFocus])

  return (
    <>
      {entered && content && (
        <header className={`hud ${focus ? 'is-dim' : ''}`}>
          <strong>{content.profile.name}</strong>
          <span>{content.profile.role}</span>
        </header>
      )}
      {entered && !focus && <Hint />}
      {entered && <StationNav />}
      {entered && <Controls />}
      <SpotifyDock />
      <Desktop />
      <WalkPad />
      <Panel />
      <Boot />
    </>
  )
}
