; BandWire custom NSIS installer script
; Adds welcome page with description

!macro customHeader
  !system "echo '' > /dev/null"
!macroend

!macro customInit
!macroend

!macro customInstall
!macroend

; Welcome page text is handled by electron-builder NSIS defaults
; License page is shown automatically when 'license' is set in package.json build.nsis
