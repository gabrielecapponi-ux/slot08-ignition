/** Native fullscreen where supported, with Home Screen guidance on iPhone. */
export function installScreenControls({button, help, close, onPause, signal}) {
  const root = document.documentElement;
  const standalone = window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)');
  const active = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const available = () => !!((root.requestFullscreen && document.fullscreenEnabled) ||
    (root.webkitRequestFullscreen && document.webkitFullscreenEnabled));
  const update = () => {
    const appMode = standalone.matches || navigator.standalone === true;
    button.hidden = appMode && !available();
    button.setAttribute('aria-pressed', String(active()));
    button.setAttribute('aria-label', active() ? 'Esci dallo schermo intero' : 'Schermo intero');
  };
  const explain = () => {
    onPause();
    if (!help.open) help.showModal();
  };
  const enter = async (showHelp = true) => {
    if (active() || standalone.matches || navigator.standalone === true) return;
    if (!available()) { if (showHelp) explain(); return; }
    try {
      if (root.requestFullscreen) await root.requestFullscreen({navigationUI:'hide'});
      else await root.webkitRequestFullscreen();
    } catch { if (showHelp) explain(); }
    update();
  };
  button.addEventListener('click', async () => {
    if (active()) {
      try {
        if (document.exitFullscreen) await document.exitFullscreen();
        else await document.webkitExitFullscreen();
      } catch { /* The browser may already have left fullscreen. */ }
    } else await enter();
    update();
  }, {signal});
  close.addEventListener('click', () => help.close(), {signal});
  document.addEventListener('fullscreenchange', update, {signal});
  document.addEventListener('webkitfullscreenchange', update, {signal});
  standalone.addEventListener('change', update, {signal});
  update();
  return {enter};
}
