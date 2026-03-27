// Maps "category/name" to device metadata.
// 'rack' tag = device appears in Rack scene sidebar.
// defaultInputs / defaultOutputs: pre-populated ports when dropped on canvas.
// Factory devices are immutable — users cannot edit or delete them.

const PWR = { id: 'in-pwr', label: 'Power', connector: 'IEC' }
const PWR_SCHUKO = { id: 'in-pwr', label: 'Power', connector: 'Schuko' }

export const FACTORY_DEVICE_META = {

  // ── Mixers ─────────────────────────────────────────────────────
  'mixers/mixing_console': {
    tags: ['mixer', 'rack'],
    defaultInputs:  [{ id: 'in-0', label: 'Ch 1', connector: 'XLR' }],
    defaultOutputs: [{ id: 'out-0', label: 'Main L', connector: 'XLR' }, { id: 'out-1', label: 'Main R', connector: 'XLR' }],
  },
  'mixers/stagebox': {
    tags: ['mixer', 'rack'],
    defaultInputs:  [{ id: 'in-0', label: 'Ch 1', connector: 'XLR' }],
    defaultOutputs: [{ id: 'out-0', label: 'Snake', connector: 'XLR' }],
  },

  // ── Microphones / DI ───────────────────────────────────────────
  'microphones/microphone': {
    tags: ['mic'],
    defaultInputs:  [],
    defaultOutputs: [{ id: 'out-0', label: 'Out', connector: 'XLR' }],
  },
  'microphones/di_box': {
    tags: ['di-box', 'rack'],
    defaultInputs:  [{ id: 'in-0', label: 'Instrument', connector: 'TS 1/4"' }],
    defaultOutputs: [{ id: 'out-0', label: 'XLR Out', connector: 'XLR' }, { id: 'out-1', label: 'Thru', connector: 'TS 1/4"' }],
  },
  'microphones/di_box_passive': {
    tags: ['di-box', 'rack'],
    defaultInputs:  [{ id: 'in-0', label: 'Instrument', connector: 'TS 1/4"' }],
    defaultOutputs: [{ id: 'out-0', label: 'XLR Out', connector: 'XLR' }, { id: 'out-1', label: 'Thru', connector: 'TS 1/4"' }],
  },
  'microphones/di_box_active': {
    tags: ['di-box', 'rack'],
    defaultInputs:  [{ id: 'in-0', label: 'Instrument', connector: 'TS 1/4"' }, { id: 'in-pwr', label: 'Power', connector: 'IEC' }],
    defaultOutputs: [{ id: 'out-0', label: 'XLR Out', connector: 'XLR' }, { id: 'out-1', label: 'Thru', connector: 'TS 1/4"' }],
  },
  'microphones/mic_stand': {
    tags: ['mic'],
    defaultInputs:  [],
    defaultOutputs: [],
  },
  'microphones/headset_mic': {
    tags: ['mic', 'rack'],
    defaultInputs:  [],
    defaultOutputs: [{ id: 'out-0', label: 'Out', connector: 'XLR' }],
  },
  'microphones/port_mic': {
    tags: ['mic', 'rack'],
    defaultInputs:  [],
    defaultOutputs: [{ id: 'out-0', label: 'Out', connector: 'XLR' }],
  },

  // ── Rack gear ──────────────────────────────────────────────────
  'rack/compressor': {
    tags: ['compressor', 'rack'],
    defaultInputs:  [{ id: 'in-0', label: 'In L', connector: 'XLR' }, { id: 'in-1', label: 'In R', connector: 'XLR' }],
    defaultOutputs: [{ id: 'out-0', label: 'Out L', connector: 'XLR' }, { id: 'out-1', label: 'Out R', connector: 'XLR' }],
  },
  'rack/eq': {
    tags: ['eq', 'rack'],
    defaultInputs:  [{ id: 'in-0', label: 'In L', connector: 'XLR' }, { id: 'in-1', label: 'In R', connector: 'XLR' }],
    defaultOutputs: [{ id: 'out-0', label: 'Out L', connector: 'XLR' }, { id: 'out-1', label: 'Out R', connector: 'XLR' }],
  },
  'rack/fx_dsp': {
    tags: ['fx', 'rack'],
    defaultInputs:  [{ id: 'in-0', label: 'In L', connector: 'XLR' }, { id: 'in-1', label: 'In R', connector: 'XLR' }],
    defaultOutputs: [{ id: 'out-0', label: 'Out L', connector: 'XLR' }, { id: 'out-1', label: 'Out R', connector: 'XLR' }],
  },
  'rack/channel_strip': {
    tags: ['rack'],
    defaultInputs:  [{ id: 'in-0', label: 'In', connector: 'XLR' }],
    defaultOutputs: [{ id: 'out-0', label: 'Out', connector: 'XLR' }],
  },
  'rack/headphone_amplifier': {
    tags: ['monitoring', 'rack'],
    defaultInputs:  [{ id: 'in-0', label: 'In L', connector: 'TRS 1/4"' }, { id: 'in-1', label: 'In R', connector: 'TRS 1/4"' }],
    defaultOutputs: [{ id: 'out-0', label: 'HP 1', connector: 'TRS 1/4"' }, { id: 'out-1', label: 'HP 2', connector: 'TRS 1/4"' }],
  },
  'rack/preamp': {
    tags: ['preamp', 'rack'],
    defaultInputs:  [{ id: 'in-0', label: 'In', connector: 'XLR' }],
    defaultOutputs: [{ id: 'out-0', label: 'Out', connector: 'XLR' }],
  },
  'rack/signal_splitter': {
    tags: ['rack'],
    defaultInputs:  [{ id: 'in-0', label: 'In', connector: 'XLR' }],
    defaultOutputs: [
      { id: 'out-0', label: 'Out A', connector: 'XLR' },
      { id: 'out-1', label: 'Out B', connector: 'XLR' },
    ],
  },
  'rack/patch_bay': {
    tags: ['patch-bay', 'rack'],
    defaultInputs:  [{ id: 'in-0', label: 'In 1', connector: 'TRS 1/4"' }, { id: 'in-1', label: 'In 2', connector: 'TRS 1/4"' }],
    defaultOutputs: [{ id: 'out-0', label: 'Out 1', connector: 'TRS 1/4"' }, { id: 'out-1', label: 'Out 2', connector: 'TRS 1/4"' }],
  },
  'rack/power_conditioner': {
    tags: ['power', 'rack'],
    defaultInputs:  [{ id: 'in-pwr', label: 'Mains', connector: 'IEC' }],
    defaultOutputs: [{ id: 'out-0', label: 'Out 1', connector: 'Schuko' }, { id: 'out-1', label: 'Out 2', connector: 'Schuko' }],
  },

  // ── MIDI ───────────────────────────────────────────────────────
  'midi/midi_router': {
    tags: ['midi', 'rack'],
    defaultInputs:  [{ id: 'in-0', label: 'MIDI In', connector: 'MIDI DIN 5' }],
    defaultOutputs: [{ id: 'out-0', label: 'MIDI Out 1', connector: 'MIDI DIN 5' }, { id: 'out-1', label: 'MIDI Out 2', connector: 'MIDI DIN 5' }],
  },
  'midi/keyboard': {
    tags: ['midi', 'instrument', 'rack'],
    defaultInputs:  [],
    defaultOutputs: [{ id: 'out-0', label: 'MIDI Out', connector: 'MIDI DIN 5' }, { id: 'out-1', label: 'USB', connector: 'USB-B' }],
  },
  'midi/sequencer': {
    tags: ['midi', 'rack'],
    defaultInputs:  [{ id: 'in-0', label: 'MIDI In', connector: 'MIDI DIN 5' }],
    defaultOutputs: [{ id: 'out-0', label: 'MIDI Out', connector: 'MIDI DIN 5' }],
  },
  'midi/sampler': {
    tags: ['midi', 'rack'],
    defaultInputs:  [{ id: 'in-0', label: 'MIDI In', connector: 'MIDI DIN 5' }, { id: 'in-1', label: 'Audio In L', connector: 'TRS 1/4"' }],
    defaultOutputs: [{ id: 'out-0', label: 'Out L', connector: 'TRS 1/4"' }, { id: 'out-1', label: 'Out R', connector: 'TRS 1/4"' }],
  },
  'midi/synth': {
    tags: ['midi', 'instrument', 'rack'],
    defaultInputs:  [{ id: 'in-0', label: 'MIDI In', connector: 'MIDI DIN 5' }],
    defaultOutputs: [{ id: 'out-0', label: 'Out L', connector: 'TRS 1/4"' }, { id: 'out-1', label: 'Out R', connector: 'TRS 1/4"' }, { id: 'out-2', label: 'MIDI Out', connector: 'MIDI DIN 5' }],
  },

  // ── Playback ───────────────────────────────────────────────────
  'playback/multitrack_player': {
    tags: ['playback', 'rack'],
    defaultInputs:  [],
    defaultOutputs: [{ id: 'out-0', label: 'Out L', connector: 'XLR' }, { id: 'out-1', label: 'Out R', connector: 'XLR' }],
  },
  'playback/laptop': {
    tags: ['playback', 'rack'],
    defaultInputs:  [],
    defaultOutputs: [{ id: 'out-0', label: 'Out L', connector: 'TRS 3.5mm' }, { id: 'out-1', label: 'USB Audio', connector: 'USB-A' }],
  },
  'playback/audio_interface': {
    tags: ['interface', 'rack'],
    defaultInputs:  [{ id: 'in-0', label: 'In 1', connector: 'XLR' }, { id: 'in-1', label: 'In 2', connector: 'XLR' }, { id: 'in-2', label: 'USB', connector: 'USB-B' }],
    defaultOutputs: [{ id: 'out-0', label: 'Out L', connector: 'TRS 1/4"' }, { id: 'out-1', label: 'Out R', connector: 'TRS 1/4"' }],
  },
  'playback/software_component': {
    tags: ['playback', 'rack'],
    defaultInputs:  [],
    defaultOutputs: [],
  },

  // ── Monitoring ─────────────────────────────────────────────────
  'monitoring/iem_transmitter': {
    tags: ['monitoring', 'iem', 'rack'],
    defaultInputs:  [
      { id: 'in-0',   label: 'In L',  connector: 'XLR' },
      { id: 'in-1',   label: 'In R',  connector: 'XLR' },
      { id: 'in-pwr', label: 'Power', connector: 'IEC' },
    ],
    defaultOutputs: [
      { id: 'out-0', label: 'RF Out', connector: 'Custom' },
    ],
  },
  'monitoring/iem_receiver': {
    tags: ['monitoring', 'iem'],
    defaultInputs:  [],
    defaultOutputs: [
      { id: 'out-0', label: 'IEM L', connector: 'TRS 3.5mm' },
      { id: 'out-1', label: 'IEM R', connector: 'TRS 3.5mm' },
    ],
  },
  'monitoring/wedge_monitor': {
    tags: ['monitoring'],
    defaultInputs:  [{ id: 'in-0', label: 'In', connector: 'XLR' }, { id: 'in-pwr', label: 'Power', connector: 'IEC' }],
    defaultOutputs: [],
  },
  'monitoring/headphones': {
    tags: ['monitoring', 'rack'],
    defaultInputs:  [{ id: 'in-0', label: 'In', connector: 'TRS 1/4"' }],
    defaultOutputs: [],
  },

  // ── Video ───────────────────────────────────────────────────────
  'video/projector': {
    tags: ['video'],
    defaultInputs:  [{ id: 'in-0', label: 'HDMI In', connector: 'HDMI' }, { id: 'in-pwr', label: 'Power', connector: 'IEC' }],
    defaultOutputs: [],
  },
  'video/display_screen': {
    tags: ['video', 'rack'],
    defaultInputs:  [{ id: 'in-0', label: 'HDMI In', connector: 'HDMI' }, { id: 'in-pwr', label: 'Power', connector: 'IEC' }],
    defaultOutputs: [],
  },
  'video/video_switcher': {
    tags: ['video', 'rack'],
    defaultInputs:  [{ id: 'in-0', label: 'HDMI In 1', connector: 'HDMI' }, { id: 'in-1', label: 'HDMI In 2', connector: 'HDMI' }],
    defaultOutputs: [{ id: 'out-0', label: 'HDMI Out', connector: 'HDMI' }],
  },
  'video/hdmi_over_wifi': {
    tags: ['video', 'rack'],
    defaultInputs:  [{ id: 'in-0', label: 'HDMI In', connector: 'HDMI' }, { id: 'in-pwr', label: 'Power', connector: 'IEC' }],
    defaultOutputs: [{ id: 'out-0', label: 'HDMI Out', connector: 'HDMI' }],
  },

  // ── Utility ────────────────────────────────────────────────────
  'utility/phone': {
    tags: ['utility', 'rack'],
    defaultInputs:  [],
    defaultOutputs: [{ id: 'out-0', label: 'Out', connector: 'TRS 3.5mm' }],
  },
  'utility/electricity_outlet': {
    tags: ['power', 'rack'],
    defaultInputs:  [{ id: 'in-0', label: 'Mains', connector: 'Schuko' }],
    defaultOutputs: [{ id: 'out-0', label: 'Out 1', connector: 'Schuko' }, { id: 'out-1', label: 'Out 2', connector: 'Schuko' }],
  },

  // ── Instruments ────────────────────────────────────────────────
  'instruments/electric_guitar': {
    tags: ['instrument'],
    defaultInputs:  [],
    defaultOutputs: [{ id: 'out-0', label: 'Output', connector: 'TS 1/4"' }],
  },
  'instruments/acoustic_guitar': {
    tags: ['instrument'],
    defaultInputs:  [],
    defaultOutputs: [{ id: 'out-0', label: 'Output', connector: 'TS 1/4"' }],
  },
  'instruments/bass_guitar': {
    tags: ['instrument'],
    defaultInputs:  [],
    defaultOutputs: [{ id: 'out-0', label: 'Output', connector: 'TS 1/4"' }],
  },
  'instruments/drums': {
    tags: ['instrument'],
    defaultInputs:  [],
    defaultOutputs: [
      { id: 'out-0', label: 'Kick',      connector: 'XLR' },
      { id: 'out-1', label: 'Snare',     connector: 'XLR' },
      { id: 'out-2', label: 'Hi-Hat',    connector: 'XLR' },
      { id: 'out-3', label: 'Rack Tom',  connector: 'XLR' },
      { id: 'out-4', label: 'Floor Tom', connector: 'XLR' },
      { id: 'out-5', label: 'OH L',      connector: 'XLR' },
      { id: 'out-6', label: 'OH R',      connector: 'XLR' },
    ],
  },
  'instruments/electronic_drums': {
    tags: ['instrument'],
    defaultInputs:  [{ id: 'in-pwr', label: 'Power', connector: 'IEC' }],
    defaultOutputs: [
      { id: 'out-0', label: 'Out L',    connector: 'TRS 1/4"' },
      { id: 'out-1', label: 'Out R',    connector: 'TRS 1/4"' },
      { id: 'out-2', label: 'MIDI Out', connector: 'MIDI DIN 5' },
    ],
  },
  'instruments/brass': {
    tags: ['instrument'],
    defaultInputs:  [],
    defaultOutputs: [{ id: 'out-0', label: 'Mic Out', connector: 'XLR' }],
  },
  'instruments/strings': {
    tags: ['instrument'],
    defaultInputs:  [],
    defaultOutputs: [{ id: 'out-0', label: 'Out', connector: 'TS 1/4"' }],
  },
  'instruments/percussion': {
    tags: ['instrument'],
    defaultInputs:  [],
    defaultOutputs: [{ id: 'out-0', label: 'Mic Out', connector: 'XLR' }],
  },

  // ── Amplification ──────────────────────────────────────────────
  'amplification/guitar_combo_amp': {
    tags: ['instrument'],
    defaultInputs:  [
      { id: 'in-0',   label: 'Input',    connector: 'TS 1/4"' },
      { id: 'in-pwr', label: 'Power',    connector: 'IEC' },
    ],
    defaultOutputs: [
      { id: 'out-0', label: 'Line Out',  connector: 'TS 1/4"' },
      { id: 'out-1', label: 'Send',      connector: 'TS 1/4"' },
    ],
  },
  'amplification/guitar_amp_head': {
    tags: ['instrument'],
    defaultInputs:  [
      { id: 'in-0',   label: 'Input',    connector: 'TS 1/4"' },
      { id: 'in-pwr', label: 'Power',    connector: 'IEC' },
    ],
    defaultOutputs: [
      { id: 'out-0', label: 'Spk Out',   connector: 'Speakon' },
      { id: 'out-1', label: 'Line Out',  connector: 'TS 1/4"' },
    ],
  },
  'amplification/guitar_cabinet': {
    tags: ['instrument'],
    defaultInputs:  [{ id: 'in-0', label: 'Spk In', connector: 'Speakon' }],
    defaultOutputs: [],
  },
  'amplification/bass_amp_head': {
    tags: ['instrument'],
    defaultInputs:  [
      { id: 'in-0',   label: 'Input',    connector: 'TS 1/4"' },
      { id: 'in-pwr', label: 'Power',    connector: 'IEC' },
    ],
    defaultOutputs: [
      { id: 'out-0', label: 'Spk Out',   connector: 'Speakon' },
      { id: 'out-1', label: 'DI Out',    connector: 'XLR' },
    ],
  },
  'amplification/bass_cabinet': {
    tags: ['instrument'],
    defaultInputs:  [{ id: 'in-0', label: 'Spk In', connector: 'Speakon' }],
    defaultOutputs: [],
  },
  'amplification/virtual_modeler': {
    tags: ['fx', 'rack'],
    defaultInputs:  [
      { id: 'in-0',   label: 'Input',    connector: 'TS 1/4"' },
      { id: 'in-pwr', label: 'Power',    connector: 'IEC' },
    ],
    defaultOutputs: [
      { id: 'out-0', label: 'Out L',     connector: 'XLR' },
      { id: 'out-1', label: 'Out R',     connector: 'XLR' },
    ],
  },
  'amplification/pedal_board': {
    tags: ['instrument', 'fx'],
    defaultInputs:  [{ id: 'in-0', label: 'Input', connector: 'TS 1/4"' }],
    defaultOutputs: [
      { id: 'out-0', label: 'Output',    connector: 'TS 1/4"' },
      { id: 'out-1', label: 'Send',      connector: 'TS 1/4"' },
    ],
  },

  // ── Lighting ───────────────────────────────────────────────────
  'lighting/dmx_device': {
    tags: ['utility'],
    defaultInputs:  [
      { id: 'in-0',   label: 'DMX In',   connector: 'XLR' },
      { id: 'in-pwr', label: 'Power',    connector: 'IEC' },
    ],
    defaultOutputs: [{ id: 'out-0', label: 'DMX Thru', connector: 'XLR' }],
  },
}
