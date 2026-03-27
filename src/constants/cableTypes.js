export const CABLE_TYPES = {
  XLR:     { label: 'XLR (Balanced)',      color: '#3B82F6', dash: null,        desc: 'Balanced audio, mics, line level' },
  TRS:     { label: 'Jack TRS (Balanced)', color: '#10B981', dash: null,        desc: 'Balanced 1/4", inserts, headphones' },
  TS:      { label: 'Jack TS (Instrument)',color: '#F59E0B', dash: null,        desc: 'Unbalanced instrument cable' },
  MIDI:    { label: 'MIDI',                color: '#F97316', dash: '6 3',       desc: '5-pin DIN MIDI' },
  USB:     { label: 'USB',                 color: '#8B5CF6', dash: null,        desc: 'USB A/B/C' },
  OPTICAL: { label: 'Optical / TOSLINK',   color: '#06B6D4', dash: '2 4',       desc: 'ADAT, S/PDIF optical' },
  HDMI:    { label: 'HDMI / Video',        color: '#EC4899', dash: null,        desc: 'Video signal' },
  AES:     { label: 'AES/EBU',            color: '#EF4444', dash: '8 3',       desc: 'Professional digital audio' },
  DANTE:   { label: 'Dante / AVB',         color: '#14B8A6', dash: '5 2 1 2',  desc: 'Network audio (Ethernet)' },
  SPEAKER: { label: 'Speaker Cable',       color: '#DC2626', dash: null,        desc: 'Amp to speaker, unbalanced' },
  POWER:   { label: 'Power / IEC',         color: '#6B7280', dash: '3 3',       desc: 'Mains power' },
}

export const CABLE_GROUPS = {
  'Analog': ['XLR', 'TRS', 'TS', 'SPEAKER'],
  'Digital': ['MIDI', 'USB', 'OPTICAL', 'AES', 'DANTE'],
  'Video / Power': ['HDMI', 'POWER'],
}
