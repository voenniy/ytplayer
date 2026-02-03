# MusicPlay Wireframes

> Visual specifications for all screens. Complements the `.pen` mockup files.
> All dimensions in pixels. Refer to `tokens.md` for colors, fonts, and spacing.

---

## 1. Main Layout (main-layout.pen)

```
+------------------------------------------------------------------+
|  Header (h:56, bg:#0a0a0a, border-bottom:#262626)               |
|  [MusicPlay]  24px bold #fafafa                                  |
+--------+------------------------------------------+-------------+
| Sidebar |          Main Content                    |    Queue    |
| w:240   |          flex (fills remaining)          |    w:256    |
| bg:#111 |          bg:#0a0a0a                      |    bg:#111  |
|         |                                          |             |
| Playlists                                          | Queue (3)   |
| [+input]|  (Search Results or Playlist View)       | [shuffle]   |
| --------+                                          | [clear]     |
| > Search|                                          |             |
| Chill.. |                                          | [cover] trk |
| Workout |                                          | [cover] trk |
| Focus.. |                                          | [cover] trk |
|         |                                          |             |
+--------+------------------------------------------+-------------+
|  Player Bar (h:72, bg:#141414, border-top:#262626)               |
|  [cover] Title / Artist | --[====o------]-- | [||] [>>]  [vol]  |
+------------------------------------------------------------------+
```

### Structural Rules

- **Viewport:** full height (`h-screen`), flex column
- **Header:** fixed top, 56px height, full width
- **Body:** flex row, fills remaining height
  - Sidebar: 240px fixed width, left
  - Main: flex-1, center
  - Queue: 256px fixed width, right
- **Player bar:** fixed bottom, 72px height, full width

---

## 2. Search Results (search-results.pen)

Renders inside the Main Content area.

```
+--------------------------------------------+
|           [Search input, max-w:640]  [Q]   |   <- centered, 24px from top
+--------------------------------------------+
|  Results                                    |   <- 13px semibold, #a1a1aa
|                                             |
| [img48] Title track 1                3:42  + |  <- default state
|         Artist name                         |
|                                             |
| [img48] Title track 2                5:17 [+]|  <- HOVER state (#222)
|         Artist name                         |
|                                             |
| [img48] Title track 3               12:04  + |
|         Artist name                         |
|                                             |
| [img48] Title track 4                4:55  + |
|         Artist name                         |
+---------------------------------------------+
```

### Track Row Component

```
[8px pad] [Cover 48x48, r:4] [12px gap] [Title + Artist, flex-1] [Duration] [+ button]
```

| Element    | Size    | Font/Weight   | Color     |
|------------|---------|---------------|-----------|
| Cover      | 48x48   | -             | #1a1a1a bg|
| Title      | -       | 14px / 500    | #fafafa   |
| Artist     | -       | 13px / 400    | #a1a1aa   |
| Duration   | -       | 12px / 400    | #a1a1aa   |
| + Button   | 24x24   | icon 16px     | #71717a, hover: #fafafa |

**States:**
- Default: transparent bg, + button opacity 0
- Hover: bg #222222, + button opacity 1
- Click on row: plays the track
- Click on +: adds to queue (stopPropagation)

### Search Bar

| Element     | Width     | Height | Style                  |
|-------------|-----------|--------|------------------------|
| Input       | flex (max 592px) | 40px | bg:#1a1a1a, border:#262626, r:8 |
| Button      | 40px      | 40px   | bg:#22c55e, r:8        |
| Container   | max-w:640 | -      | centered with flex gap-2 |

---

## 3. Player Bar (player.pen)

Fixed at bottom, full viewport width.

```
+------------------------------------------------------------------+
| [border-top 1px #262626]                                          |
|                                                                    |
| [Cover]  Title Track Name        1:24 --[====o--------]-- 3:42   |
|  48x48   Artist Name                                   [||][>>][vol====] |
|                                                                    |
+------------------------------------------------------------------+
  h:72px   bg:#141414
```

### Three Sections

| Section | Width    | Content                                     |
|---------|----------|---------------------------------------------|
| Left    | ~300px   | Cover 48x48 + Title (14px/500) + Artist (13px) |
| Center  | flex     | Progress bar (4px track, green fill) + timestamps (11px) |
| Right   | ~200px   | Play/Pause (32x32), Skip (32x32), Volume slider (80px) |

### Progress Bar

- Track: 4px tall, bg #262626, border-radius 2px
- Fill: bg #22c55e, border-radius 2px
- Thumb: 12px circle, #fafafa, visible on hover
- Timestamps: 11px, #a1a1aa, flanking the bar

### Controls

| Control      | Size   | Icon (Lucide) | Color                  |
|--------------|--------|---------------|------------------------|
| Play/Pause   | 32x32  | `Play`/`Pause`| #fafafa                |
| Skip Forward | 32x32  | `SkipForward` | #a1a1aa, hover:#fafafa |
| Volume icon  | 16x16  | `Volume2`     | #a1a1aa                |
| Volume slider| w:80   | -             | track:#262626, fill:#a1a1aa |

---

## 4. Playlist View (playlist.pen)

Renders inside the Main Content area when a playlist is selected.

```
+--------------------------------------------+
|  Chill Vibes                    [Play All]  |  <- 20px bold + green btn
|  12 tracks                                  |  <- 13px #a1a1aa
|  ------------------------------------------ |  <- divider #262626
|                                              |
| 1 [img48] Title track 1       3:42  + | x  |  <- default
|           Artist name                        |
|                                              |
| 2 [img48] Title track 2       5:17 [+] [x] |  <- HOVER (#222)
|           Artist name                        |     x turns red
|                                              |
| 3 [img48] Title track 3      12:04  + | x  |
|           Artist name                        |
+----------------------------------------------+
```

### Header Section

| Element       | Style                                         |
|---------------|-----------------------------------------------|
| Playlist name | 20px, bold (700), #fafafa                     |
| Track count   | 13px, normal (400), #a1a1aa                   |
| Play All btn  | bg:#22c55e, text:#0a0a0a, 14px/600, r:8, h:36|
| Divider       | 1px, #262626, full width below header         |

### Track Rows

Same as search results track row, with additions:
- **Track number** on the left (13px, #71717a)
- **Delete button** (x icon) on the right, after the + button
  - Default: #71717a, opacity 0
  - Hover row: visible, icon turns #ef4444 (red)

---

## 5. Sidebar Detail

```
+---------------------------+
| Playlists         13px/600|  <- heading, #a1a1aa
| [New playlist... ] [+]   |  <- input h:32 + icon btn
| --------------------------+
| > Search          (active)|  <- bg:#1a1a1a when selected
|   Chill Vibes             |  <- playlist items
|   Workout Mix             |
|   Focus Mode              |
+---------------------------+
  w:240, bg:#111111
```

### Sidebar Items

| State    | Background  | Text color |
|----------|-------------|------------|
| Default  | transparent | #a1a1aa    |
| Hover    | #1a1a1a     | #fafafa    |
| Active   | #1a1a1a     | #fafafa    |

Each playlist item: 36px tall, 8px radius, 12px left padding.
Delete button (Trash2 icon) appears on hover, right side.

---

## 6. Queue Panel Detail

```
+---------------------------+
| Queue (3)  [shuf] [clear] |  <- heading + action btns
| --------------------------+
| [img32] Track name        |  <- 32x32 covers (small)
|         Artist      [x]   |
| [img32] Track name        |
|         Artist      [x]   |
| [img32] Track name        |
|         Artist      [x]   |
+---------------------------+
  w:256, bg:#111111
```

### Queue Items

| Element  | Size   | Font         | Color   |
|----------|--------|--------------|---------|
| Cover    | 32x32  | -            | #1a1a1a |
| Title    | -      | 12px / 500   | #fafafa |
| Artist   | -      | 11px / 400   | #a1a1aa |
| X button | 24x24  | icon 12px    | #71717a, hover:#fafafa |

Empty state: "Queue is empty" (12px, #71717a, centered)

### Queue Actions

| Button   | Icon      | Behavior                |
|----------|-----------|-------------------------|
| Shuffle  | `Shuffle` | Randomize queue order   |
| Clear    | `Trash2`  | Remove all from queue   |

Both: ghost variant, 28x28, disabled when queue < 2 (shuffle) or empty (clear).
