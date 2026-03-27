# ⚡ BandWire

**Signal flow diagram tool for live musicians and FOH engineers.**

Draw clean, professional signal routing diagrams — what's plugged into what, with which cable. Built for touring musicians, backline techs, and anyone who needs to document a live rig without fighting a spreadsheet or a generic flowchart tool.

---

## Features

- **Visual signal flow canvas** — drag & drop hardware nodes, connect them with typed, color-coded cables (XLR, TRS, MIDI, AES/EBU, Dante, Speakon, and more)
- **Rack scenes** — rack nodes open their own internal scene; define the rack's external ports, then wire the internals independently
- **Port connector types** — assign XLR, TRS, Speakon, Powercon, HDMI, etc. to each port individually
- **Export** — PNG image or HTML with a full signal legend table
- **Signal legend** — auto-generated: `[XLR] RACK MIX OUT 1/2 (XLR) → FOH CH 3/4 (XLR)`
- **50+ factory devices** — drums, guitars, amps, mixers, stage boxes, DI boxes, IEM systems, rack gear, video, DMX...
- **Custom devices** — add your own gear with custom icons, ports, tags, and connector types
- **Tag filter sidebar** — filter by rack, mixer, mic, instrument, monitoring, IEM, MIDI, video, utility...
- **7 languages** — English, Czech, German, Spanish, French, Italian, Russian
- **Light & dark theme**
- **PWA support** — runs in browser, installable on tablets (iPad, Android)

---

## Rack Scenes

Rack nodes are containers with their own internal canvas. The workflow:

1. Drag a **Rack** node from the sidebar onto the main canvas
2. Select it and define its **inputs and outputs** in the Properties panel (these are the physical connectors on the back of the rack)
3. Connect cables from other devices to the rack's handles in the main canvas
4. **Double-click** the rack to enter its internal scene
5. Port gateway nodes appear automatically — **blue (↓ IN)** for signals arriving from outside, **green (OUT ↑)** for signals leaving
6. Wire your internal devices between the gateways
7. Hit **↩ Back** to return to the main canvas

---

## Getting Started

### Requirements

- Node.js 18+
- npm 9+

### Install & run

```bash
git clone https://github.com/your-username/bandwire.git
cd bandwire
npm install
npm run dev          # Electron dev mode
```

### Build

```bash
npm run build:electron   # Vite build for Electron → dist/
npm run build:pwa        # PWA build → dist-pwa/

npm run package:win      # Windows installer → release/*.exe
npm run package:linux    # Linux → release/*.AppImage + .deb

npm run gen-icons        # Regenerate icon manifest after adding SVG icons
```

---

## Adding Icons

**Bundled (factory) icons:** `public/icons/{category}/device_name.svg`

**User icons at runtime:** `Documents/BandWire/icons/{category}/device_name.svg`

Guidelines:
- White artwork on transparent background
- Square artboard, 64×64 px recommended
- Affinity Designer 2: use *SVG (for export)* preset, enable *Flatten transforms* and *Export text as curves*, disable metadata embedding
- Restart the app to reload

---

## Project Files

Projects are saved as `.sflow` files (JSON). Icons are **not** embedded — they are resolved from the icon library on load, so keep your icon folders intact.

---

## Project Structure

```
src/
  components/
    Canvas/           React Flow canvas
    nodes/            HardwareNode, RackNode, RackPortNode
    edges/            CableEdge
    Sidebar/          Device library, tag filter
    Toolbar/          Nav, cable selector, theme, language
    PropertiesPanel/  Node & edge editor
    Modals/           AddDevice, Export, Manual
  constants/
    cableTypes.js     11 cable types
    connectorTypes.js 25+ connector types
    factoryDeviceMeta.js  Device defaults
    factoryTags.js    Tag definitions
  i18n/locales/       en, cs, de, es, fr, it, ru
  store/useStore.js   Zustand state
  platform.js         Electron / PWA abstraction
  version.js          Single source of version
public/
  icons/              Factory SVG icons
  icon-manifest.json  Auto-generated for PWA
electron/
  main.js             Electron main + IPC
  preload.js          Context bridge
```

---

## Roadmap

- [ ] Stage plot module (separate canvas mode for stage layouts)
- [ ] Technical rider generator
- [ ] Venue / contact catalog
- [ ] Mac build (requires Apple Developer Account)
- [ ] PDF export
- [ ] Multi-page diagrams

---

## License

MIT — see [LICENSE](LICENSE)
