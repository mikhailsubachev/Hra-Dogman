// Načte postavy a vyrobí dočasnou grafiku pro to, co ještě nakreslené není.
// Postavy jsou komiksové verze dětských kreseb (SVG z artboardu "Dog Man – komiksový návrh").
// Původní převedené kresby jsou ve složce assets/sprites/kresby-puvodni.
// Číslo = výška v pixelech, ve které se SVG převede na obrázek (víc = ostřejší).
// Poměr stran odpovídá výřezu (viewBox) v SVG souboru.
const POSTAVY = {
  dogman:  { vyska: 216, pomer: 620 / 720 },
  bobanek: { vyska: 264, pomer: 568 / 624 },
  cunas:   { vyska: 450, pomer: 630 / 674 },
  petulka: { vyska: 240, pomer: 470 / 590 },
  ponorka: { vyska: 276, pomer: 1056 / 368 },
  tlusta:  { vyska: 300, pomer: 536 / 656 },
  chobotnice: { vyska: 300, pomer: 340 / 300 },
  chapadlo:   { vyska: 440, pomer: 92 / 440 },
  zralok:     { vyska: 300, pomer: 1040 / 436 },
  maly_zralok: { vyska: 120, pomer: 1040 / 436 },
};

class ZavadeciScena extends Phaser.Scene {
  constructor() { super('Zavadeci'); }

  preload() {
    const text = this.add.text(N.SIRKA / 2, N.VYSKA / 2, 'Načítám…', {
      fontFamily: N.PISMO_NADPIS, fontSize: '40px', color: '#ffffff',
    }).setOrigin(0.5);
    this.load.on('progress', (p) => text.setText(`Načítám… ${Math.round(p * 100)} %`));
    this.load.on('loaderror', (soubor) => console.warn('Nepodařilo se načíst', soubor.src));
    for (const [jmeno, p] of Object.entries(POSTAVY)) {
      this.load.svg(jmeno, `assets/sprites/${jmeno}.svg?v=${VERZE}`, { width: Math.round(p.vyska * p.pomer), height: p.vyska });
    }
  }

  create() {
    Textury.vytvor(this);
    this.scene.start('Menu');
  }
}
