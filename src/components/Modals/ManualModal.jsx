import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { APP_NAME, APP_VERSION } from '../../version'

export default function ManualModal() {
  const { closeModal } = useStore()
  const { t } = useTranslation('t')

  const canvasList = t('mCanvasList', { returnObjects: true })

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${APP_NAME} — ${t('manual')}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:880px;margin:40px auto;padding:0 24px 60px;color:#1a1a2e;line-height:1.75;font-size:15px}
  h1{color:#6366f1;border-bottom:3px solid #6366f1;padding-bottom:10px;font-size:28px}
  h2{color:#3730a3;margin-top:2.5em;font-size:20px;border-bottom:1px solid #e2e8f0;padding-bottom:6px}
  h3{color:#4338ca;margin-top:1.5em;font-size:16px}
  code,pre{background:#f1f5f9;border-radius:5px;font-family:'Fira Mono',monospace;font-size:13px}
  code{padding:2px 7px}
  pre{padding:12px 16px;overflow-x:auto}
  table{border-collapse:collapse;width:100%;margin:1em 0;font-size:14px}
  th,td{border:1px solid #e2e8f0;padding:9px 13px;text-align:left}
  th{background:#f8fafc;font-weight:600;color:#374151}
  .kbd{display:inline-block;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:5px;padding:2px 8px;font-family:monospace;font-size:13px}
  .legend-example{font-family:'Fira Mono',monospace;background:#0d0d18;color:#e0e0f0;padding:14px 18px;border-radius:8px;font-size:13px;margin:10px 0}
  .version{color:#94a3b8;font-size:13px;margin-top:4px}
  ul{padding-left:22px}
  li{margin-bottom:5px}
  a{color:#6366f1}
</style>
</head>
<body>
<h1>⚡ ${APP_NAME}</h1>
<p class="version">${APP_VERSION} — ${t('mTagline')}</p>

<h2>${t('mGettingStarted')}</h2>
<p>${t('mGettingStartedText')}</p>

<h2>${t('mCanvas')}</h2>
<ul>
${canvasList.map(([action, desc]) => `  <li><strong>${action}:</strong> ${desc}</li>`).join('\n')}
</ul>

<h2>${t('mKeyboard')}</h2>
<table>
  <tr><th>${t('mShortcutShortcut')}</th><th>${t('mShortcutAction')}</th></tr>
  <tr><td><span class="kbd">Ctrl+S</span></td><td>${t('save')}</td></tr>
  <tr><td><span class="kbd">Ctrl+O</span></td><td>${t('open')}</td></tr>
  <tr><td><span class="kbd">Delete</span> / <span class="kbd">Backspace</span></td><td>${t('deleteNode')} / ${t('deleteCable')}</td></tr>
</table>

<h2>${t('mDevices')}</h2>
<h3>${t('mFactoryDevices')}</h3>
<p>${t('mFactoryDevicesText')}</p>
<h3>${t('mCustomDevices')}</h3>
<p>${t('mCustomDevicesText')}</p>
<h3>${t('mTags')}</h3>
<p>${t('mTagsText')}</p>

<h2>${t('mRack')}</h2>
<p>${t('mRackText')}</p>
<h3>${t('mRackHeading1')}</h3>
<ol style="padding-left:22px;line-height:2">
  <li>${t('mRackStep1')}</li>
  <li>${t('mRackStep2')}</li>
  <li>${t('mRackStep3')}</li>
  <li>${t('mRackStep4')}</li>
  <li>${t('mRackStep5')}</li>
  <li>${t('mRackStep6')}</li>
</ol>
<p style="font-style:italic;opacity:0.7;font-size:13px;margin-top:8px">${t('mRackGatewayNote')}</p>

<h2>${t('mCableTypes')}</h2>
<table>
  <tr><th>Type</th><th>Use</th></tr>
  <tr><td>XLR</td><td>Balanced audio, mics, line level</td></tr>
  <tr><td>TRS 1/4"</td><td>Balanced jack, inserts, headphones</td></tr>
  <tr><td>TS 1/4"</td><td>Instrument cable (unbalanced)</td></tr>
  <tr><td>MIDI</td><td>5-pin DIN MIDI</td></tr>
  <tr><td>USB</td><td>USB A/B/C</td></tr>
  <tr><td>Optical / TOSLINK</td><td>ADAT, S/PDIF optical</td></tr>
  <tr><td>HDMI</td><td>Video signal</td></tr>
  <tr><td>AES/EBU</td><td>Professional digital audio</td></tr>
  <tr><td>Dante / AVB</td><td>Network audio (Ethernet)</td></tr>
  <tr><td>Speaker</td><td>Amp to speaker</td></tr>
  <tr><td>Power / IEC</td><td>Mains power</td></tr>
</table>

<h2>${t('mConnectors')}</h2>
<p>${t('mConnectorsText')}</p>

<h2>${t('mExport')}</h2>
<p>${t('mExportText')}</p>
<p>${t('mLegendFormat')}:</p>
<div class="legend-example"><span style="color:#3B82F6">[XLR]</span>  RACK MIX OUT 1/2 (XLR) → EVENTIDE FX IN L/R (XLR)</div>

<h2>${t('mIconLibrary')}</h2>
<p>${t('mIconLibraryText')}</p>
<p>${t('mIconLibraryAD2')}</p>

<h2>${t('mSettings')}</h2>
<p>${t('mSettingsText')}</p>
<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px">
  <thead><tr>
    <th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border);color:var(--text-secondary)">${t('mShortcutAction')}</th>
    <th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border);color:var(--text-secondary)">Effect</th>
  </tr></thead>
  <tbody>
    ${(t('mSettingsList')||[]).map(([s,a])=>`<tr>
      <td style="padding:5px 8px;border-bottom:1px solid var(--border);font-weight:600">${s}</td>
      <td style="padding:5px 8px;border-bottom:1px solid var(--border);color:var(--text-secondary)">${a}</td>
    </tr>`).join('')}
  </tbody>
</table>
<h2>${t('mProjects')}</h2>
<p>${t('mProjectsText')}</p>
</body>
</html>`

  const openManual = () => {
    const blob = new Blob([html], { type: 'text/html' })
    window.open(URL.createObjectURL(blob), '_blank')
  }

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>{t('manual')}</span>
          <button className="modal-close" onClick={closeModal}>×</button>
        </div>
        <div className="modal-body" style={{textAlign: 'center', padding: '32px 24px'}}>
          <div style={{fontSize: 48, marginBottom: 16}}>📖</div>
          <p style={{marginBottom: 24, color: 'var(--text-secondary)'}}>
            {APP_NAME} {APP_VERSION} {t('manualOpensInBrowser')}
          </p>
          <button className="props-btn accent" onClick={openManual} style={{width: '100%', padding: '10px'}}>
            {t('openManual')}
          </button>
        </div>
      </div>
    </div>
  )
}
