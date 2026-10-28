// Jednoduché zvuky vyrobené přímo v prohlížeči, bez zvukových souborů.
const Zvuky = {
  ctx: null,
  zapnuto: true,

  kontext() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },

  ton(typ, odFrekvence, doFrekvence, delka, hlasitost = 0.12, zpozdeni = 0) {
    if (!this.zapnuto) return;
    const ctx = this.kontext();
    if (!ctx) return;
    const t = ctx.currentTime + zpozdeni;
    const osc = ctx.createOscillator();
    const zesileni = ctx.createGain();
    osc.type = typ;
    osc.frequency.setValueAtTime(odFrekvence, t);
    osc.frequency.exponentialRampToValueAtTime(doFrekvence, t + delka);
    zesileni.gain.setValueAtTime(hlasitost, t);
    zesileni.gain.exponentialRampToValueAtTime(0.001, t + delka);
    osc.connect(zesileni).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + delka + 0.05);
  },

  skok()       { this.ton('sine', 320, 640, 0.15, 0.1); },
  kost()       { this.ton('triangle', 880, 880, 0.08); this.ton('triangle', 1320, 1320, 0.12, 0.12, 0.07); },
  kyslik()     { this.ton('sine', 300, 900, 0.18, 0.1); this.ton('sine', 500, 1200, 0.12, 0.07, 0.08); },
  zasah()      { this.ton('square', 420, 110, 0.35, 0.07); },
  haf()        { this.ton('sawtooth', 380, 170, 0.12, 0.1); this.ton('sawtooth', 430, 190, 0.14, 0.1, 0.16); },
  omraceni()   { this.ton('square', 900, 300, 0.25, 0.04); },
  bum()        { this.ton('triangle', 160, 50, 0.3, 0.2); },
  checkpoint() { [523, 659, 784].forEach((f, i) => this.ton('triangle', f, f, 0.15, 0.1, i * 0.1)); },
  klik()       { this.ton('triangle', 660, 990, 0.08, 0.08); },
  konec()      { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.ton('triangle', f, f, 0.18, 0.11, i * 0.13)); },
};
