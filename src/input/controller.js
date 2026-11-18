/** Keyboard, pointer and switch-compatible throttle, with no repeat toggles. */
export class InputController {
  constructor({ canvas, throttle, lane, toggle, onPause, onActivity, onCamera = () => {}, isDriving = () => true }) {
    this.held = new Set(); this.latched = false; this.toggleMode = false; this.pendingSwitch = false;
    this.onPause = onPause; this.onActivity = onActivity; this.abort = new AbortController();
    const on = (node, type, fn, options = {}) => node.addEventListener(type, fn, { ...options, signal: this.abort.signal });
    on(window, 'keydown', e => {
      if (document.querySelector('dialog[open]') || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.code === 'Space') {
        // Native buttons retain Space activation; the large throttle is handled here.
        if (!isDriving() && e.target.closest('button') && e.target !== throttle) return;
        e.preventDefault(); if (!e.repeat) this.press('keyboard');
      } else if (['Enter','NumpadEnter','ShiftLeft','ShiftRight','ArrowLeft','ArrowRight'].includes(e.code)) {
        if (!isDriving() && e.code.includes('Enter')) return;
        e.preventDefault(); if (!e.repeat) { this.pendingSwitch = true; this.onActivity(); }
      } else if (e.code === 'KeyC' && !e.repeat) { e.preventDefault(); onCamera();
      } else if (['KeyP','Escape'].includes(e.code) && !e.repeat) { e.preventDefault(); this.onPause(); }
    });
    on(window, 'keyup', e => { if (e.code === 'Space') { this.held.delete('keyboard'); } });
    const attach = node => {
      on(node, 'pointerdown', e => { if (e.button !== 0) return; e.preventDefault(); node.setPointerCapture(e.pointerId); this.press(`pointer-${e.pointerId}`); });
      for (const type of ['pointerup','pointercancel','lostpointercapture']) on(node, type, e => this.held.delete(`pointer-${e.pointerId}`));
      on(node, 'contextmenu', e => e.preventDefault());
    };
    attach(canvas); attach(throttle);
    // Assistive technology activates buttons through click, often without pointers.
    on(throttle, 'click', e => { if (e.detail === 0 && !this.held.has('keyboard')) { this.latched = !this.latched; this.onActivity(); } });
    on(lane, 'click', () => { this.pendingSwitch = true; this.onActivity(); });
    on(toggle, 'change', () => { this.clear(); this.toggleMode = toggle.checked; });
    on(window, 'blur', () => this.clear());
  }
  press(source) { this.onActivity(); if (this.toggleMode) this.latched = !this.latched; else this.held.add(source); }
  get throttle() { return this.latched || this.held.size > 0 ? 1 : 0; }
  read() { const result = { throttle: this.throttle, switchLane: this.pendingSwitch }; this.pendingSwitch = false; return result; }
  clear() { this.held.clear(); this.latched = false; this.pendingSwitch = false; }
  destroy() { this.clear(); this.abort.abort(); }
}
