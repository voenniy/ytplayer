# MusicPlay Design Tokens

> Design system foundation for MusicPlay -- personal YouTube music player.
> Dark theme by default, inspired by Spotify and YouTube Music.

---

## Color Palette

### Backgrounds

| Token               | Value     | Usage                                |
|---------------------|-----------|--------------------------------------|
| `--bg-primary`      | `#0a0a0a` | Main app background                 |
| `--bg-secondary`    | `#111111` | Sidebar, queue panel background     |
| `--bg-card`         | `#1a1a1a` | Cards, elevated surfaces            |
| `--bg-card-hover`   | `#222222` | Card / track row hover state        |
| `--bg-input`        | `#1a1a1a` | Input fields background             |
| `--bg-player`       | `#141414` | Player bar background               |

### Text

| Token               | Value     | Usage                                |
|---------------------|-----------|--------------------------------------|
| `--text-primary`    | `#fafafa` | Primary text (headings, track names) |
| `--text-secondary`  | `#a1a1aa` | Secondary text (artist, metadata)    |
| `--text-muted`      | `#71717a` | Disabled / placeholder text          |

### Accent

| Token               | Value     | Usage                                |
|---------------------|-----------|--------------------------------------|
| `--accent`          | `#22c55e` | Primary accent (green)               |
| `--accent-hover`    | `#16a34a` | Accent hover / active state          |
| `--accent-muted`    | `#22c55e33` | Accent with transparency (progress bg) |

### Borders & Dividers

| Token               | Value     | Usage                                |
|---------------------|-----------|--------------------------------------|
| `--border`          | `#262626` | Default borders and dividers         |
| `--border-subtle`   | `#1f1f1f` | Subtle separators                    |

### Semantic

| Token               | Value     | Usage                                |
|---------------------|-----------|--------------------------------------|
| `--danger`          | `#ef4444` | Delete actions, errors               |
| `--danger-hover`    | `#dc2626` | Danger hover state                   |

---

## Typography

### Font Family

```
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

Use Inter as the primary font. Falls back to system sans-serif stack.

### Font Sizes

| Token          | Size   | Line Height | Usage                            |
|----------------|--------|-------------|----------------------------------|
| `--text-xs`    | 11px   | 16px        | Timestamps, metadata             |
| `--text-sm`    | 13px   | 18px        | Track artist, secondary info     |
| `--text-base`  | 14px   | 20px        | Track titles, body text          |
| `--text-lg`    | 16px   | 24px        | Section headings                 |
| `--text-xl`    | 20px   | 28px        | Page titles, playlist names      |
| `--text-2xl`   | 24px   | 32px        | Logo "MusicPlay"                 |

### Font Weights

| Token             | Value | Usage                               |
|-------------------|-------|-------------------------------------|
| `--font-normal`   | 400   | Body text, secondary info           |
| `--font-medium`   | 500   | Track titles, labels                |
| `--font-semibold` | 600   | Section headings                    |
| `--font-bold`     | 700   | Logo, page titles                   |

---

## Spacing

Based on a 4px grid system.

| Token       | Value | Usage                                     |
|-------------|-------|-------------------------------------------|
| `--sp-1`    | 4px   | Inline gaps, icon padding                 |
| `--sp-2`    | 8px   | Tight component spacing                   |
| `--sp-3`    | 12px  | Default component padding                 |
| `--sp-4`    | 16px  | Section padding, content margins          |
| `--sp-6`    | 24px  | Large section gaps, page padding          |
| `--sp-8`    | 32px  | Major layout spacing                      |

---

## Border Radius

| Token              | Value | Usage                                  |
|--------------------|-------|----------------------------------------|
| `--radius-sm`      | 4px   | Small elements: buttons, badges, chips |
| `--radius-md`      | 8px   | Cards, inputs, track rows, panels      |
| `--radius-lg`      | 12px  | Modals, large cards                    |
| `--radius-full`    | 9999px| Circular elements: avatars, play button|

---

## Shadows

| Token                | Value                                  | Usage           |
|----------------------|----------------------------------------|-----------------|
| `--shadow-sm`        | `0 1px 2px rgba(0,0,0,0.3)`           | Subtle lift     |
| `--shadow-md`        | `0 4px 12px rgba(0,0,0,0.4)`          | Cards, dropdowns|
| `--shadow-lg`        | `0 8px 24px rgba(0,0,0,0.5)`          | Modals, popovers|

---

## Layout Dimensions

| Element          | Value     | Notes                                |
|------------------|-----------|--------------------------------------|
| Sidebar width    | 240px     | Fixed, left column                   |
| Queue width      | 256px     | Fixed, right column                  |
| Main content     | flex (1fr)| Fills remaining space                |
| Header height    | 56px      | Top bar with logo                    |
| Player height    | 72px      | Fixed bottom bar                     |
| Track row height | 56px      | Track list item                      |
| Cover thumbnail  | 48x48 px  | In track lists and player            |
| Cover small      | 32x32 px  | In queue list                        |

---

## Component Specifications

### Track Row (reusable in Search, Playlist, Queue)

```
[Cover 48x48] [12px gap] [Title + Artist (flex)] [Duration] [Action button]
```

- Background: transparent, hover: `--bg-card-hover`
- Padding: 8px
- Border radius: `--radius-md` (8px)
- Title: `--text-base`, `--font-medium`, `--text-primary`
- Artist: `--text-sm`, `--font-normal`, `--text-secondary`
- Duration: `--text-xs`, `--text-secondary`
- Action button: hidden by default, visible on hover

### Player Bar

```
[Cover 48x48 + Track Info] | [Progress bar + timestamps] | [Controls + Volume]
```

- Height: 72px
- Background: `--bg-player`
- Border top: 1px solid `--border`
- Progress bar track: `--bg-card`
- Progress bar fill: `--accent`

### Search Bar

```
[Input field (max-width: 640px)] [Search button]
```

- Centered in main content area
- Input: `--bg-input`, `--border`, `--radius-md`
- Placeholder: `--text-muted`

---

## Tailwind CSS Mapping

These tokens map to the shadcn/ui + Tailwind dark theme configuration in the project:

```css
/* client/src/index.css -- .dark theme layer */
:root {
  --background: 0 0% 4%;         /* #0a0a0a */
  --foreground: 0 0% 98%;        /* #fafafa */
  --card: 0 0% 10%;              /* #1a1a1a */
  --card-foreground: 0 0% 98%;   /* #fafafa */
  --muted: 0 0% 13%;             /* #222222 */
  --muted-foreground: 240 4% 65%;/* #a1a1aa */
  --accent: 142 71% 45%;         /* #22c55e */
  --accent-foreground: 0 0% 98%; /* #fafafa */
  --border: 0 0% 15%;            /* #262626 */
  --input: 0 0% 10%;             /* #1a1a1a */
  --ring: 142 71% 45%;           /* #22c55e */
  --radius: 0.5rem;              /* 8px */
  --destructive: 0 84% 60%;      /* #ef4444 */
}
```

---

## Iconography

- Icon library: **Lucide React**
- Default icon size: 16px (h-4 w-4) for inline, 20px (h-5 w-5) for controls
- Icon color: inherits text color
- Key icons:
  - Play: `Play` / `Pause`
  - Skip: `SkipForward` / `SkipBack`
  - Volume: `Volume2` / `VolumeX`
  - Search: `Search`
  - Add to queue: `ListPlus`
  - Remove: `X` / `Trash2`
  - Shuffle: `Shuffle`
  - Playlist: `Music` / `ListMusic`
  - New playlist: `Plus`

---

## Responsive Breakpoints

| Breakpoint   | Width     | Behavior                              |
|--------------|-----------|---------------------------------------|
| Desktop      | >= 1024px | Full 3-column layout                  |
| Tablet       | 768-1023px| Hide queue, 2-column layout           |
| Mobile       | < 768px   | Hide sidebar + queue, single column   |

> Note: MVP targets desktop. Responsive behavior is planned for post-MVP.

---

## Animation & Transitions

| Property      | Duration | Easing                  | Usage                    |
|---------------|----------|-------------------------|--------------------------|
| Background    | 150ms    | ease-in-out             | Hover states             |
| Opacity       | 150ms    | ease-in-out             | Show/hide action buttons |
| Transform     | 200ms    | ease-out                | Slide-in panels          |
| Progress bar  | 100ms    | linear                  | Playback progress update |
