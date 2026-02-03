# Mobile Layout + Background Playback Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Adaptive mobile layout (< 768px) with tab navigation, mini-player, fullscreen player, and Media Session API for background playback with lock-screen controls.

**Mockups:** `design/main-layout.pen` — 4 mobile screens (Search, Playlists, Queue, Fullscreen Player)

---

## Architecture

### Mobile Layout (< md:768px)
- Desktop three-column layout (Sidebar | Main | Queue) collapses to single-column
- Bottom tab bar: Search | Playlists | Queue (icons + labels)
- Active tab determines visible content
- Sidebar and Queue hidden on mobile, replaced by dedicated tabs

### Mini-Player (above tab bar)
- Compact bar: cover 40x40, title, artist, play/pause, next
- Thin progress bar along top edge
- Tap on mini-player opens fullscreen player

### Fullscreen Player (overlay)
- Large album cover centered (~300px)
- Track title + artist
- Progress bar with timestamps
- Controls: prev, play/pause (green circle), next
- Chevron-down to dismiss
- No volume control (hardware on mobile)

### Media Session API
- Set metadata on track change: title, artist, artwork
- Register action handlers: play, pause, nexttrack, previoustrack
- Enables lock-screen controls, notification media controls, Bluetooth/headphone controls

---

## Files to Change

| File | Changes |
|------|---------|
| `client/src/components/Layout.tsx` | Responsive layout, hide Sidebar/Queue on mobile |
| `client/src/components/MobileNav.tsx` | **New** — bottom tab bar (md:hidden) |
| `client/src/components/MiniPlayer.tsx` | **New** — compact player bar for mobile |
| `client/src/components/FullscreenPlayer.tsx` | **New** — fullscreen player overlay |
| `client/src/components/Player.tsx` | Hide on mobile (replaced by MiniPlayer) |
| `client/src/hooks/useAudio.ts` | Add Media Session API integration |
| `client/src/hooks/useMediaSession.ts` | **New** — Media Session hook |
| `client/src/App.tsx` | Mobile tab state, conditional rendering |

### Install
- `npx shadcn@latest add drawer` (for fullscreen player slide-up gesture)

---

## Task Breakdown

### Task 1: useMediaSession hook
- Create `client/src/hooks/useMediaSession.ts`
- Accept: title, artist, artwork URL, onPlay, onPause, onNext, onPrev
- Set `navigator.mediaSession.metadata` on track change
- Register `navigator.mediaSession.setActionHandler` for play/pause/nexttrack/previoustrack
- Integrate into `useAudio.ts` or `Player.tsx`

### Task 2: MobileNav component
- Create `client/src/components/MobileNav.tsx`
- Three tabs: Search (search icon), Playlists (list-music), Queue (list-ordered)
- Active tab highlighted green (#22c55e)
- `md:hidden` — only visible on mobile
- Tab state lifted to App or Layout

### Task 3: MiniPlayer component
- Create `client/src/components/MiniPlayer.tsx`
- Shows when track is playing, `md:hidden`
- Cover, title, artist, play/pause, skip-forward
- Progress bar (thin, 2px) at top
- onClick opens fullscreen player

### Task 4: FullscreenPlayer component
- Create `client/src/components/FullscreenPlayer.tsx`
- Full-screen overlay (fixed, z-50)
- Large cover, title, artist, progress slider, prev/play/next
- Chevron-down to close
- Uses same `useAudio` instance

### Task 5: Responsive Layout
- Update `Layout.tsx`: hide Sidebar/Queue below md
- Render MobileNav + MiniPlayer below md
- App.tsx: manage active mobile tab state
- Conditionally show Sidebar content, main content, or Queue content based on active tab

### Task 6: Player.tsx adaptation
- Hide desktop player below md (`hidden md:block`)
- Desktop player unchanged

---

## Verification

1. Resize browser to < 768px: tab bar appears, sidebar/queue hidden
2. Switch tabs: Search shows search+results, Playlists shows list, Queue shows queue
3. Play a track: mini-player appears above tab bar
4. Tap mini-player: fullscreen player opens with cover, controls
5. Lock phone / switch tab: music keeps playing
6. Lock screen: media controls visible (title, artist, cover, play/pause/next)
