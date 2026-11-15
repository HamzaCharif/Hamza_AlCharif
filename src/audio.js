// Calm rain + rare soft thunder, made with the Web Audio API (no audio files, no copyright issues).
// Browsers only allow sound after a click, so startAudio() is called from the enter button.

let ctx, rainBus, noiseBuf, dripTimer
let rainOn = true

export function getCtx() {
  return ctx
}

function pinkNoise(seconds = 6) {
  const len = ctx.sampleRate * seconds
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + w * 0.0555179
    b1 = 0.99332 * b1 + w * 0.0750759
    b2 = 0.969 * b2 + w * 0.153852
    b3 = 0.8665 * b3 + w * 0.3104856
    b4 = 0.55 * b4 + w * 0.5329522
    b5 = -0.7616 * b5 - w * 0.016898
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
    b6 = w * 0.115926
  }
  return buf
}

function layer(type, freq, q, gain, lfoRate = 0) {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuf
  src.loop = true
  const f = ctx.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  f.Q.value = q
  const g = ctx.createGain()
  g.gain.value = gain
  // very slow swell so the rain breathes instead of hissing at one level
  if (lfoRate) {
    const lfo = ctx.createOscillator()
    const depth = ctx.createGain()
    lfo.frequency.value = lfoRate
    depth.gain.value = gain * 0.35
    lfo.connect(depth).connect(g.gain)
    lfo.start()
  }
  src.connect(f).connect(g).connect(rainBus)
  src.start(0, Math.random() * 5)
}

function drip(when) {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuf
  const f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = 1400 + Math.random() * 2200
  f.Q.value = 6 + Math.random() * 6
  const g = ctx.createGain()
  const peak = 0.02 + Math.random() * 0.05
  g.gain.setValueAtTime(0, when)
  g.gain.linearRampToValueAtTime(peak, when + 0.003)
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05 + Math.random() * 0.05)
  src.connect(f).connect(g).connect(rainBus)
  src.start(when, Math.random() * 5, 0.12)
}

export function startAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
  } catch {
    return null
  }
  noiseBuf = pinkNoise()
  rainBus = ctx.createGain()
  rainBus.gain.value = 0
  // one soft low-pass over all the rain: the "heard from inside" sound
  const warm = ctx.createBiquadFilter()
  warm.type = 'lowpass'
  warm.frequency.value = 2600
  rainBus.connect(warm).connect(ctx.destination)
  layer('lowpass', 3200, 0.3, 0.32, 0.05) // steady soft rain
  layer('bandpass', 700, 0.5, 0.22, 0.08) // body
  layer('lowpass', 160, 0.7, 0.35) // distant rain on rooftops
  dripTimer = setInterval(() => {
    if (!rainOn || ctx.state !== 'running') return
    if (Math.random() < 0.55) drip(ctx.currentTime + 0.02 + Math.random() * 0.15)
  }, 140)
  setRain(rainOn)
  return ctx
}

export function setRain(on) {
  rainOn = on
  if (!ctx) return
  const t = ctx.currentTime
  rainBus.gain.cancelScheduledValues(t)
  rainBus.gain.setValueAtTime(rainBus.gain.value, t)
  rainBus.gain.linearRampToValueAtTime(on ? 0.55 : 0, t + (on ? 3 : 0.8))
}

// Far-away thunder: a slow, low rumble rather than a crack.
export function thunder(delay = 2.5) {
  if (!ctx || !rainOn) return
  const when = ctx.currentTime + delay
  const src = ctx.createBufferSource()
  src.buffer = noiseBuf
  const f = ctx.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.setValueAtTime(260, when)
  f.frequency.exponentialRampToValueAtTime(55, when + 5)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, when)
  g.gain.linearRampToValueAtTime(0.5, when + 0.6)
  g.gain.linearRampToValueAtTime(0.35, when + 1.6)
  g.gain.exponentialRampToValueAtTime(0.001, when + 6)
  src.connect(f).connect(g).connect(rainBus)
  src.start(when, Math.random() * 2, 6.2)
}
