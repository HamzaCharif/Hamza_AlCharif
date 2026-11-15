// Hamza's Spotify playlist through Spotify's official iFrame API.
// The player starts when the visitor clicks "Click to enter" (browsers need a click before sound).
// Visitors who aren't logged in to Spotify hear 30-second previews; that's Spotify's rule for embeds.
// If Spotify can't load (blocked network, strict previews), the page shows a link instead.

let controller = null
let wantPlay = false
let state = { status: 'idle', paused: true }
const subs = new Set()
const set = (patch) => {
  state = { ...state, ...patch }
  subs.forEach((fn) => fn(state))
}

export function subscribe(fn) {
  subs.add(fn)
  fn(state)
  return () => subs.delete(fn)
}

export function initSpotify(el, uri) {
  if (!el || state.status !== 'idle') return
  set({ status: 'loading' })
  window.onSpotifyIframeApiReady = (API) => {
    API.createController(el, { uri, width: '100%', height: 152 }, (c) => {
      controller = c
      set({ status: 'ready' })
      c.addListener('playback_update', (e) => set({ paused: e.data.isPaused }))
      if (wantPlay) c.play()
    })
  }
  const s = document.createElement('script')
  s.src = 'https://open.spotify.com/embed/iframe-api/v1'
  s.async = true
  s.onerror = () => set({ status: 'blocked' })
  document.body.appendChild(s)
  setTimeout(() => state.status === 'loading' && set({ status: 'blocked' }), 9000)
}

export function playSpotify() {
  wantPlay = true
  controller?.play()
}

export function toggleSpotify() {
  if (!controller) return
  wantPlay = state.paused
  controller.togglePlay()
}
