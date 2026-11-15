import { create } from 'zustand'

export const useLab = create((set) => ({
  entered: false,
  focus: null,
  hovered: null,
  content: null,
  station: 'room',
  walking: false,
  rain: true,
  musicOpen: false,
  enter: () => set({ entered: true }),
  setFocus: (focus) => set({ focus, hovered: null }),
  setHovered: (hovered) => set({ hovered }),
  setContent: (content) => set({ content }),
  setStation: (station) => set({ station, focus: null, walking: false }),
  setWalking: (walking) => set({ walking, focus: null }),
  setRainOn: (rain) => set({ rain }),
  setMusicOpen: (musicOpen) => set({ musicOpen }),
}))

// Fixed camera spots ("stations"). Each is framed like a film shot; you can look around a little in each.
// Room layout: x -5..4.5, z -4.5..2.5, ceiling 3.2. Back wall z = -4.5, window x 1.3..3.3.
export const STATIONS = {
  room:      { label: 'Room',      cam: [1.3, 1.85, 0.4],   target: [-1.0, 1.15, -3.7] },
  desk:      { label: 'Desk',      cam: [0.45, 1.75, -1.55], target: [-0.65, 1.12, -4.15] },
  workbench: { label: 'Workbench', cam: [-2.55, 1.7, -1.75], target: [-4.65, 1.25, -2.75] },
  window:    { label: 'Window',    cam: [1.6, 1.6, -1.55],  target: [3.0, 1.25, -4.2] },
  wall:      { label: 'Wall',      cam: [-1.7, 1.8, -1.6],  target: [-3.2, 1.95, -4.5] },
  lounge:    { label: 'Lounge',    cam: [-0.6, 1.75, -2.2], target: [2.6, 0.9, 1.2] },
}
export const STATION_ORDER = ['room', 'desk', 'workbench', 'window', 'wall', 'lounge']

// Clickable objects: which station shows them, the content section they open, and the close-up camera.
export const HOTSPOTS = {
  me:       { label: 'Hamza',              station: 'desk',      section: 'me',         cam: [0.55, 1.55, -1.95], target: [-0.6, 1.15, -3.3] },
  monitor:  { label: 'Projects',           station: 'desk',      section: 'projects',   cam: [-0.6, 1.2, -3.5], target: [-0.6, 1.17, -4.3] },
  monitor2: { label: 'Experience',         station: 'desk',      section: 'experience', cam: [-0.1, 1.45, -2.9],  target: [0.25, 1.17, -4.2] },
  github:   { label: 'GitHub',             station: 'desk',      section: 'github',     cam: [-1.0, 1.45, -2.85], target: [-1.75, 1.05, -4.2] },
  contact:  { label: 'Contact',            station: 'desk',      section: 'contact',    cam: [0.75, 1.5, -2.9],   target: [0.45, 0.85, -3.92] },
  music:    { label: 'Music',              station: 'desk',      section: 'music',      cam: [0.3, 1.45, -2.95],  target: [0.62, 0.95, -4.3] },
  printer:  { label: 'Currently building', station: 'workbench', section: 'building',   cam: [-3.05, 1.6, -2.55], target: [-4.55, 1.2, -3.5] },
  drone:    { label: 'Drone project',      station: 'workbench', section: 'building',   cam: [-3.2, 1.55, -1.1],  target: [-4.55, 0.98, -1.85] },
  skills:   { label: 'Skills',             station: 'window',    section: 'skills',     cam: [2.9, 1.5, -2.6],    target: [4.0, 0.6, -4.1] },
  awards:   { label: 'Awards',             station: 'wall',      section: 'awards',     cam: [-2.35, 2.0, -2.8],  target: [-2.75, 2.0, -4.4] },
  about:    { label: 'About me',           station: 'wall',      section: 'about',      cam: [-3.75, 1.7, -2.6],  target: [-4.0, 1.6, -4.45] },
}

// Touch-screen walk buttons write here; the walk controller reads it every frame.
export const walkInput = { f: 0, r: 0 }
