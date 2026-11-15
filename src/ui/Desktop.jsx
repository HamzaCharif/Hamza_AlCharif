import { useEffect, useRef, useState } from 'react'
import { useLab } from '../store'

// "HamzaOS": the main monitor turns into a little desktop you can actually use.
// Double-click (or tap) an icon to open a window; windows can be dragged, focused and closed.

const ICONS = [
  { id: 'projects', label: 'Projects', kind: 'folder' },
  { id: 'building', label: 'Building now', kind: 'folder' },
  { id: 'experience', label: 'Experience', kind: 'folder' },
  { id: 'awards', label: 'Awards', kind: 'folder' },
  { id: 'skills', label: 'Skills', kind: 'folder' },
  { id: 'about', label: 'About me.txt', kind: 'note' },
  { id: 'terminal', label: 'Terminal', kind: 'terminal' },
  { id: 'cv', label: 'CV.pdf', kind: 'pdf' },
  { id: 'github', label: 'GitHub', kind: 'link' },
  { id: 'contact', label: 'Contact', kind: 'mail' },
  { id: 'music', label: 'Music', kind: 'music' },
]

function Glyph({ kind }) {
  const common = { width: 40, height: 40, viewBox: '0 0 40 40', 'aria-hidden': true }
  switch (kind) {
    case 'folder':
      return (<svg {...common}><path d="M4 11a3 3 0 0 1 3-3h9l3 3h14a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#e9b25e" /><path d="M4 15h32v14a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#f4c97a" /></svg>)
    case 'note':
      return (<svg {...common}><rect x="8" y="5" width="24" height="30" rx="3" fill="#f3ead7" /><path d="M13 13h14M13 18h14M13 23h10" stroke="#7b7486" strokeWidth="2" /></svg>)
    case 'terminal':
      return (<svg {...common}><rect x="4" y="7" width="32" height="26" rx="4" fill="#1d2133" /><path d="M10 15l5 4-5 4M18 25h9" stroke="#7dff9a" strokeWidth="2.4" fill="none" strokeLinecap="round" /></svg>)
    case 'pdf':
      return (<svg {...common}><path d="M9 5h16l7 7v23H9z" fill="#f3ead7" /><path d="M25 5v7h7" fill="#d8cdb6" /><rect x="12" y="20" width="17" height="8" rx="2" fill="#c8473b" /><text x="20.5" y="26.3" fontSize="6" textAnchor="middle" fill="#fff" fontFamily="sans-serif" fontWeight="700">PDF</text></svg>)
    case 'link':
      return (<svg {...common}><circle cx="20" cy="20" r="15" fill="#2b2d3a" /><path d="M14 27c2-1 3-3 3-5-3 0-4-1-4-4 0-1 1-2 1-3 0-1 0-2 1-3 2 0 3 1 4 2h2c1-1 2-2 4-2 1 1 1 2 1 3 0 1 1 2 1 3 0 3-1 4-4 4 0 2 1 4 3 5" stroke="#f3ead7" strokeWidth="1.6" fill="none" /></svg>)
    case 'mail':
      return (<svg {...common}><rect x="5" y="10" width="30" height="21" rx="3" fill="#5d7cb8" /><path d="M6 12l14 10 14-10" stroke="#f3ead7" strokeWidth="2" fill="none" /></svg>)
    case 'music':
      return (<svg {...common}><circle cx="20" cy="20" r="15" fill="#1db954" /><path d="M12 16c6-2 12-1 16 1M13 21c5-1.5 10-1 13 1M14 25.5c4-1 8-.7 10.5.7" stroke="#11251a" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>)
    default:
      return null
  }
}

function Items({ items = [] }) {
  return items.map((it) => (
    <article key={it.name} className="os-item">
      <div className="os-item-head">
        <h4>{it.name}</h4>
        {it.status && <span className={`os-status s-${it.status}`}>{{ done: 'Done', ongoing: 'In progress', planned: 'Planned' }[it.status]}</span>}
      </div>
      {(it.period || it.badge) && <p className="os-meta">{it.period}{it.badge && <b> · {it.badge}</b>}</p>}
      {it.status === 'ongoing' && typeof it.progress === 'number' && (
        <div className="os-progress"><span style={{ width: `${it.progress}%` }} /><em>{it.progress}%</em></div>
      )}
      {it.summary && <p>{it.summary}</p>}
      {it.tags?.length > 0 && <ul className="os-tags">{it.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
      {it.links?.length > 0 && <p className="os-links">{it.links.map((l) => <a key={l.href} href={l.href} target="_blank" rel="noreferrer">{l.label} ↗</a>)}</p>}
    </article>
  ))
}

const HELP = [
  'help          list commands',
  'whoami        who is this',
  'projects      what I have built',
  'building      what I am building now',
  'skills        my stack',
  'contact       how to reach me',
  'cv            open my CV',
  'clear         clear the screen',
  'exit          back to the room',
]

function Terminal({ content, onExit }) {
  const [lines, setLines] = useState(['HamzaOS terminal. Type "help" to see what you can do.'])
  const [cmd, setCmd] = useState('')
  const end = useRef()
  useEffect(() => end.current?.scrollIntoView({ block: 'end' }), [lines])
  const S = content.sections
  const run = (raw) => {
    const c = raw.trim().toLowerCase()
    let out = []
    if (c === 'help') out = HELP
    else if (c === 'whoami') out = [content.profile.name, content.profile.role, ...(S.me?.body || [])]
    else if (c === 'projects') out = (S.projects?.items || []).map((i) => `• ${i.name} (${i.period})`)
    else if (c === 'building') out = (S.building?.items || []).map((i) => `• ${i.name}${i.progress != null ? ` [${i.progress}%]` : ''}`)
    else if (c === 'skills') out = (S.skills?.items || []).map((i) => `${i.name}: ${i.tags.join(', ')}`)
    else if (c === 'contact') out = [content.profile.email, content.profile.linkedin, content.profile.github]
    else if (c === 'cv') { window.open(content.profile.cv, '_blank'); out = ['Opening CV…'] }
    else if (c === 'clear') { setLines([]); return }
    else if (c === 'exit') { onExit(); return }
    else if (c === 'sudo hire hamza' || c === 'sudo hire-hamza') out = ['Permission granted. Email: ' + content.profile.email]
    else if (c) out = [`command not found: ${c}. Try "help".`]
    setLines((l) => [...l, `hamza@lab:~$ ${raw}`, ...out])
  }
  return (
    <div className="os-term" onClick={(e) => e.currentTarget.querySelector('input')?.focus()}>
      {lines.map((l, i) => <div key={i}>{l}</div>)}
      <form onSubmit={(e) => { e.preventDefault(); run(cmd); setCmd('') }} className="os-term-line">
        <span>hamza@lab:~$</span>
        <input id="os-terminal-input" value={cmd} onChange={(e) => setCmd(e.target.value)} autoFocus spellCheck={false} autoComplete="off" aria-label="Terminal command" />
      </form>
      <div ref={end} />
    </div>
  )
}

function Window({ win, content, focused, onFocus, onClose, onMove, onExit }) {
  const drag = useRef(null)
  const S = content.sections
  const titles = { projects: 'Projects', building: 'Building now', experience: 'Experience & Research', awards: 'Awards', skills: 'Skills', about: 'About me.txt', terminal: 'Terminal', contact: 'Contact', music: 'Music' }
  const down = (e) => {
    onFocus()
    drag.current = { x: e.clientX - win.x, y: e.clientY - win.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const move = (e) => drag.current && onMove(e.clientX - drag.current.x, e.clientY - drag.current.y)
  const up = () => (drag.current = null)
  let body
  if (win.id === 'terminal') body = <Terminal content={content} onExit={onExit} />
  else if (win.id === 'about') body = <div className="os-note">{(S.about?.body || []).map((t, i) => <p key={i}>{t}</p>)}</div>
  else if (win.id === 'contact') body = (
    <dl className="os-contact">
      <dt>Email</dt><dd className="selectable">{content.profile.email}</dd>
      <dt>LinkedIn</dt><dd><a href={content.profile.linkedin} target="_blank" rel="noreferrer">{content.profile.linkedin.replace('https://www.', '')}</a></dd>
      <dt>GitHub</dt><dd><a href={content.profile.github} target="_blank" rel="noreferrer">{content.profile.github.replace('https://', '')}</a></dd>
      <dt>Based in</dt><dd>{content.profile.location}</dd>
    </dl>
  )
  else if (win.id === 'music') body = <div className="os-note"><p>{S.music?.body?.[0]}</p><p>The player is open in the top-right corner of the room.</p></div>
  else body = <><p className="os-lead">{S[win.id]?.body?.[0]}</p><Items items={S[win.id]?.items} /></>
  return (
    <section
      className={`os-window ${focused ? 'is-focused' : ''} ${win.id === 'terminal' ? 'is-term' : ''}`}
      style={{ left: win.x, top: win.y, zIndex: win.z }}
      onPointerDown={onFocus}
      role="dialog"
      aria-label={titles[win.id]}
    >
      <header className="os-title" onPointerDown={down} onPointerMove={move} onPointerUp={up}>
        <span>{titles[win.id]}</span>
        <button onClick={onClose} aria-label={`Close ${titles[win.id]}`} onPointerDown={(e) => e.stopPropagation()}>×</button>
      </header>
      <div className="os-body">{body}</div>
    </section>
  )
}

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(t)
  }, [])
  return <span className="os-clock">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' })}</span>
}

export default function Desktop() {
  const focus = useLab((s) => s.focus)
  const content = useLab((s) => s.content)
  const setFocus = useLab((s) => s.setFocus)
  const setMusicOpen = useLab((s) => s.setMusicOpen)
  const [ready, setReady] = useState(false)
  const [wins, setWins] = useState([])
  const [top, setTop] = useState(10)
  const [selected, setSelected] = useState(null)
  const screen = useRef()

  useEffect(() => {
    if (focus !== 'monitor') { setReady(false); return }
    const t = setTimeout(() => setReady(true), 700) // wait for the camera to arrive at the monitor
    return () => clearTimeout(t)
  }, [focus])

  if (focus !== 'monitor' || !content || !ready) return null

  const exit = () => { setWins([]); setFocus(null) }
  const open = (id) => {
    if (id === 'cv') return window.open(content.profile.cv, '_blank')
    if (id === 'github') return window.open(content.profile.github, '_blank')
    if (id === 'music') setMusicOpen(true)
    const z = top + 1
    setTop(z)
    setWins((w) => {
      const existing = w.find((x) => x.id === id)
      if (existing) return w.map((x) => (x.id === id ? { ...x, z } : x))
      const r = screen.current?.getBoundingClientRect()
      const n = w.length
      const x = Math.max(8, Math.min((r?.width || 800) - 430, 300 + n * 40))
      const y = Math.max(8, Math.min((r?.height || 500) - 300, 24 + n * 28))
      return [...w, { id, x, y, z }]
    })
  }
  const focusWin = (id) => {
    const z = top + 1
    setTop(z)
    setWins((w) => w.map((x) => (x.id === id ? { ...x, z } : x)))
  }
  const topId = wins.length ? wins.reduce((a, b) => (a.z > b.z ? a : b)).id : null

  return (
    <div className="os-backdrop" onKeyDown={(e) => e.key === 'Escape' && exit()}>
      <div className="os-screen" ref={screen} onClick={() => setSelected(null)}>
        <div className="os-icons">
          {ICONS.map((ic) => (
            <button
              key={ic.id}
              className={`os-icon ${selected === ic.id ? 'is-selected' : ''}`}
              onClick={(e) => { e.stopPropagation(); setSelected(ic.id); if (window.matchMedia('(pointer: coarse)').matches) open(ic.id) }}
              onDoubleClick={() => open(ic.id)}
              onKeyDown={(e) => e.key === 'Enter' && open(ic.id)}
            >
              <Glyph kind={ic.kind} />
              <span>{ic.label}</span>
            </button>
          ))}
        </div>
        <p className="os-watermark">HamzaOS</p>
        {wins.map((w) => (
          <Window
            key={w.id}
            win={w}
            content={content}
            focused={w.id === topId}
            onFocus={() => focusWin(w.id)}
            onClose={() => setWins((all) => all.filter((x) => x.id !== w.id))}
            onMove={(x, y) => setWins((all) => all.map((a) => (a.id === w.id ? { ...a, x, y } : a)))}
            onExit={exit}
          />
        ))}
        <footer className="os-taskbar">
          <button className="os-start" onClick={() => open('about')}>◐ Hamza</button>
          <div className="os-tasks">
            {wins.map((w) => (
              <button key={w.id} className={w.id === topId ? 'is-on' : ''} onClick={() => focusWin(w.id)}>
                {ICONS.find((i) => i.id === w.id)?.label}
              </button>
            ))}
          </div>
          <Clock />
          <button className="os-exit" onClick={exit}>Back to room</button>
        </footer>
      </div>
      <p className="os-hint">open an icon with a double-click (or one tap on a phone) · Esc to go back</p>
    </div>
  )
}
