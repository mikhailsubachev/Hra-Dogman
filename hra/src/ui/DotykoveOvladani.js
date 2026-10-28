// Dotykové ovládání pro mobil a tablet.
// Levý palec: kolečko (joystick). Objeví se tam, kde se palec dotkne levé půlky
// obrazovky; tahem doleva a doprava Dog Man chodí, čím dál tím rychleji.
// Pravý palec: tlačítka SKOK a HAF.
// Čte všechny prsty najednou, takže jde běžet a skákat zároveň.
const KOLECKO = {
  polomer: 70,         // jak daleko jde táhnout (v herních pixelech)
  mrtvaZona: 0.18,     // malý pohyb kolem středu nic nedělá
  klidX: 130,          // kde je kolečko vidět, když se ho nikdo nedotýká
  klidY: N.VYSKA - 120,
};

class DotykoveOvladani {
  constructor(scene) {
    this.scene = scene;
    const V = N.VYSKA;
    const S = N.SIRKA;

    // kolečko vlevo
    this.koleckoPrst = null;     // id prstu, který kolečko drží
    this.stred = { x: KOLECKO.klidX, y: KOLECKO.klidY };
    this.zaklad = scene.add.circle(this.stred.x, this.stred.y, KOLECKO.polomer, 0xffffff, 0.12)
      .setStrokeStyle(4, 0xffffff, 0.45).setScrollFactor(0).setDepth(1000);
    this.hlavicka = scene.add.circle(this.stred.x, this.stred.y, 34, 0xffffff, 0.35)
      .setStrokeStyle(3, 0xffffff, 0.8).setScrollFactor(0).setDepth(1001);
    this.sipky = scene.add.text(this.stred.x, this.stred.y, '◀   ▶', {
      fontFamily: N.PISMO_NADPIS, fontSize: '26px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001).setAlpha(0.6);

    // tlačítka vpravo
    this.tlacitka = [
      { id: 'haf',  x: S - 225, y: V - 72, r: 52, popis: 'HAF' },
      { id: 'skok', x: S - 92,  y: V - 100, r: 68, popis: 'SKOK' },
    ];
    for (const t of this.tlacitka) {
      t.kruh = scene.add.circle(t.x, t.y, t.r, 0xffffff, 0.16)
        .setStrokeStyle(3, 0xffffff, 0.55).setScrollFactor(0).setDepth(1000);
      t.text = scene.add.text(t.x, t.y, t.popis, {
        fontFamily: N.PISMO_NADPIS, fontSize: '28px', color: '#ffffff',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1001).setAlpha(0.85);
    }
  }

  stav() {
    const s = { vlevo: false, vpravo: false, skok: false, haf: false, osaX: 0 };
    const prsty = this.scene.input.manager.pointers.filter((p) => p && p.isDown);

    // kolečko: drží ho první prst, který se dotkl levé půlky obrazovky
    let drzi = prsty.find((p) => p.id === this.koleckoPrst);
    if (!drzi) {
      this.koleckoPrst = null;
      drzi = prsty.find((p) => p.downX < N.SIRKA / 2 && !this.naTlacitku(p.downX, p.downY));
      if (drzi) {
        this.koleckoPrst = drzi.id;
        // kolečko se posune pod palec, ale ne úplně k okraji obrazovky
        this.stred = {
          x: Phaser.Math.Clamp(drzi.downX, KOLECKO.polomer, N.SIRKA / 2 - KOLECKO.polomer),
          y: Phaser.Math.Clamp(drzi.downY, KOLECKO.polomer + 60, N.VYSKA - KOLECKO.polomer),
        };
      }
    }

    if (drzi) {
      let dx = drzi.x - this.stred.x;
      let dy = drzi.y - this.stred.y;
      const delka = Math.hypot(dx, dy);
      if (delka > KOLECKO.polomer) {
        dx *= KOLECKO.polomer / delka;
        dy *= KOLECKO.polomer / delka;
      }
      const osa = dx / KOLECKO.polomer;
      if (Math.abs(osa) > KOLECKO.mrtvaZona) {
        // po mrtvé zóně plynule od pomalé chůze po plnou rychlost
        const sila = (Math.abs(osa) - KOLECKO.mrtvaZona) / (1 - KOLECKO.mrtvaZona);
        s.osaX = Math.sign(osa) * Math.min(1, 0.35 + sila * 0.65);
        s.vlevo = osa < 0;
        s.vpravo = osa > 0;
      }
      this.vykresliKolecko(this.stred.x + dx, this.stred.y + dy, true);
    } else {
      this.stred = { x: KOLECKO.klidX, y: KOLECKO.klidY };
      this.vykresliKolecko(this.stred.x, this.stred.y, false);
    }

    // tlačítka: kterýkoli prst kromě toho na kolečku
    for (const p of prsty) {
      if (p.id === this.koleckoPrst) continue;
      for (const t of this.tlacitka) {
        if (Phaser.Math.Distance.Between(p.x, p.y, t.x, t.y) < t.r * 1.3) s[t.id] = true;
      }
    }
    for (const t of this.tlacitka) t.kruh.setFillStyle(0xffffff, s[t.id] ? 0.42 : 0.16);
    return s;
  }

  naTlacitku(x, y) {
    return this.tlacitka.some((t) => Phaser.Math.Distance.Between(x, y, t.x, t.y) < t.r * 1.3);
  }

  vykresliKolecko(hx, hy, aktivni) {
    this.zaklad.setPosition(this.stred.x, this.stred.y).setFillStyle(0xffffff, aktivni ? 0.2 : 0.1);
    this.hlavicka.setPosition(hx, hy).setFillStyle(0xffffff, aktivni ? 0.55 : 0.3);
    this.sipky.setPosition(this.stred.x, this.stred.y).setAlpha(aktivni ? 0.25 : 0.6);
  }

  ztlum(id, ztlumeno) {
    const t = this.tlacitka.find((x) => x.id === id);
    if (t) t.text.setAlpha(ztlumeno ? 0.3 : 0.85);
  }
}

function jeDotykoveZarizeni(scene) {
  return scene.sys.game.device.input.touch || PARAMETRY.get('dotyk') === '1';
}
