export default {
  // App
  appName: 'BANDWIRE',

  // Toolbar
  new: 'New', save: 'Save', open: 'Open', export: 'Export', back: 'Back',
  nodes: 'nodes', edges: 'edges', cable: 'Cable',

  // Sidebar
  searchDevices: 'Search devices...',
  factory: 'Factory', myDevices: 'My Devices',
  addCustomDevice: '＋ Add custom device',
  openIconsFolder: 'Open icons folder',
  rackSceneBanner: '🗄 Rack scene — showing rack gear only',
  noDevicesMatch: 'No devices match your filter.',
  noRackDevices: 'No rack gear found.\nTag a custom device with "rack" to see it here.',
  tagAll: 'All',

  // Properties panel
  nodeProperties: 'Node Properties', cableProperties: 'Cable Properties', properties: 'Properties',
  selectToEdit: 'Select a node or cable to edit its properties.',
  label: 'Label', modelMake: 'Model / Make', notes: 'Notes', colorAccent: 'Color accent',
  inputs: 'Inputs', outputs: 'Outputs',
  addInput: '＋ Add input', addOutput: '＋ Add output',
  deleteNode: 'Delete node', deleteCable: 'Delete cable', deleteRack: 'Delete rack',
  rackLabel: 'Rack label', rackHint: 'Double-click the rack node to open its internal scene.',
  cableLabel: 'Cable label', cableType: 'Cable type',
  modelPlaceholder: 'e.g. Allen & Heath SQ-5',
  notesPlaceholder: 'Phantom power, gain, channel notes...',
  rackNotesPlaceholder: 'Rack notes...',
  cableLabelPlaceholder: 'e.g. Ch. 1 — Kick',

  // Add device modal
  addCustomDeviceTitle: 'Add Custom Device',
  name: 'Name', nameRequired: 'Name is required.',
  deviceNamePlaceholder: 'My Device',
  modelDevicePlaceholder: 'e.g. DBX 166XS',
  optionalNotesPlaceholder: 'Optional notes...',
  tags: 'Tags', customTagPlaceholder: 'Custom tag...', addTag: 'Add',
  icon: 'Icon', uploadSvg: 'Upload SVG', fromLibrary: 'From Library',
  noIconSelected: 'No icon selected', browseSvg: 'Browse SVG...',
  noFactoryIcons: 'No factory icons loaded.',
  defaultInputs: 'Default Inputs', defaultOutputs: 'Default Outputs',
  inPort: 'In', outPort: 'Out',
  cancel: 'Cancel', saveDevice: 'Save Device',

  // Export modal
  exportDiagram: 'Export Diagram',
  colorOption: 'Color (uncheck for black & white)',
  includeLegend: 'Include signal legend',
  includeAllScenes: 'Include all rack scenes in legend',
  legendFormat: 'Legend format',
  exportHtml: 'Export HTML', exporting: 'Exporting...',

  // Manual modal
  manual: 'Manual',
  manualOpensInBrowser: 'opens in your browser.',
  openManual: 'Open Manual in Browser',

  // Tags
  tagRack: 'rack', tagMixer: 'mixer', tagInterface: 'interface',
  tagPatchBay: 'patch-bay', tagMic: 'mic', tagDiBox: 'di-box',
  tagPreamp: 'preamp', tagCompressor: 'compressor', tagEq: 'eq',
  tagFx: 'fx', tagMidi: 'midi', tagInstrument: 'instrument',
  tagPlayback: 'playback', tagMonitoring: 'monitoring', tagIem: 'iem',
  tagVideo: 'video', tagUtility: 'utility', tagPower: 'power',

  // Manual — headings
  mTitle: 'BandWire Manual',
  mTagline: 'Signal flow diagram tool for live musicians',
  mGettingStarted: 'Getting Started',
  mCanvas: 'Canvas', mKeyboard: 'Keyboard Shortcuts',
  mDevices: 'Devices', mFactoryDevices: 'Factory Devices',
  mCustomDevices: 'Custom Devices', mTags: 'Tags',
  mRack: 'Rack Scenes', mCableTypes: 'Cable Types',
  mConnectors: 'Connector Types on Ports',
  mExport: 'Export', mIconLibrary: 'Icon Library', mProjects: 'Project Files',

  // Manual — body
  mGettingStartedText: 'BandWire lets you draw signal flow diagrams — what\'s connected to what, with which cable. Drag devices from the left panel onto the canvas, then connect them by dragging from one port handle to another.',
  mCanvasList: [
    ['Pan', 'Click and drag on empty canvas'],
    ['Zoom', 'Scroll wheel or trackpad pinch'],
    ['Select node', 'Click'],
    ['Select cable', 'Click on the cable line'],
    ['Connect devices', 'Drag from a port handle (small circle on edge of node) to another node\'s handle'],
    ['Enter rack scene', 'Double-click a Rack node'],
    ['Delete selected', 'Delete or Backspace'],
  ],
  mShortcutAction: 'Action',
  mShortcutShortcut: 'Shortcut',
  mFactoryDevicesText: 'Built-in devices loaded from SVG files in Documents/BandWire/icons/{category}/name.svg. Restart the app after adding icons.',
  mCustomDevicesText: 'Click "＋ Add custom device" in the sidebar. Set name, model, tags, default ports with connector types, and attach an icon. Custom devices are saved to Documents/BandWire/custom-devices.json.',
  mTagsText: 'Filter devices by tag using the tag bar at the top of the sidebar. Multiple devices can share tags.',
  mRackText: 'Racks are container nodes that represent physical equipment racks. They have their own internal scene where you can map the signal routing between rack devices.',
  mRackHeading1: 'Setting up a Rack',
  mRackStep1: 'Drag a Rack node from the sidebar onto the main canvas.',
  mRackStep2: 'Select the Rack node and define its inputs and outputs in the Properties panel on the right — just like any other device. These are the physical connections on the back of your rack (e.g. XLR In 1–8, Main Out L/R).',
  mRackStep3: "Connect cables from other devices to the Rack node's handles on the main canvas.",
  mRackStep4: 'Double-click the Rack node to enter its internal scene. Port gateway nodes appear automatically — blue ones (↓ IN) for signals arriving from outside, green ones (OUT ↑) for signals leaving the rack.',
  mRackStep5: 'Wire the internal devices between the gateways: IN gateway → Compressor → EQ → OUT gateway, etc.',
  mRackStep6: 'Navigate back to the main scene using the ↩ Back button or the breadcrumb bar at the top.',
  mRackGatewayNote: "Gateway nodes cannot be deleted — they are automatically synced with the rack port list. To change them, edit the rack's inputs/outputs in the Properties panel from the main scene.",
  mConnectorsText: 'Each input and output port can have a connector type assigned (XLR, TRS, Speakon, HDMI, etc.). This appears in the port tooltip and in the exported legend.',
  mExportText: 'Click Export in the toolbar. Export produces an HTML file with the diagram image and legend table.',
  mLegendFormat: 'Legend format',
  mIconLibraryText: 'Place SVG files in Documents/BandWire/icons/{category}/device_name.svg. Best results with white icons on transparent background, 64×64 px artboard. Underscores in filenames become spaces in labels. Restart to reload.',
  mIconLibraryAD2: 'When exporting from Affinity Designer 2: use SVG (for export) preset, enable Flatten transforms and Export text as curves, disable metadata embedding. Ensure the exported SVG has a viewBox attribute.',
  mProjectsText: 'Projects are saved as .sflow files (JSON). All scenes, devices, and layout are stored in one file.',
}
