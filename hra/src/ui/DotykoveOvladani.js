// Velká průhledná tlačítka pro mobil a tablet.
// Čte všechny prsty najednou, takže jde běžet a skákat zároveň.
class DotykoveOvladani {
  constructor(scene) {
    this.scene = scene;
    const V = N.VYSKA;
    const S = N.SIRKA;
    this.tlacitka = [
      { id: 'vlevo',  x: 78,      y: V - 78, r: 56, popis: '◀' },
      { id: 'vpravo', x: 212,     y: V - 78, r: 56, popis: '▶' },
      { id: 'haf',    x: S - 215, y: V - 70, r: 48, popis: 'HAF' },
      { id: 'skok',   x: S - 88,  y: V - 92, r: 64, popis: 'SKOK' },
    ];
    for (const t of this.tlacitka) {
      t.kruh = scene.add.circle(t.x, t.y, t.r, 0xffffff, 0.16)
        .setStrokeStyle(3, 0xffffff, 0.55).setScrollFactor(0).setDepth(1000);
      t.text = scene.add.text(t.x, t.y, t.popis, {
        fontFamily: N.PISMO_NADPIS,
        fontSize: t.popis.length > 1 ? '26px' : '40px',
        color: '#ffffff',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1001).setAlpha(0.85);
    }
  }

  stav() {
    const s = { vlevo: false, vpravo: false, skok: false, haf: false };
    for (const p of this.scene.input.manager.pointers) {
      if (!p || !p.isDown) continue;
      for (const t of this.tlacitka) {
        if (Phaser.Math.Distance.Between(p.x, p.y, t.x, t.y) < t.r * 1.15) s[t.id] = true;
      }
    }
    for (const t of this.tlacitka) t.kruh.setFillStyle(0xffffff, s[t.id] ? 0.42 : 0.16);
    return s;
  }

  ztlum(id, ztlumeno) {
    const t = this.tlacitka.find((x) => x.id === id);
    if (t) t.text.setAlpha(ztlumeno ? 0.3 : 0.85);
  }
}

function jeDotykoveZarizeni(scene) {
  return scene.sys.game.device.input.touch || PARAMETRY.get('dotyk') === '1';
}
