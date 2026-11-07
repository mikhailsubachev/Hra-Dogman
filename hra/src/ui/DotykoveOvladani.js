// Dotykové ovládání pro mobil a tablet. Ovládá se skoro celou plochou.
// Levá půlka: neviditelné kolečko. Kam se palec dotkne, tam je střed; tahem doleva
//   a doprava Dog Man chodí, čím dál tím rychleji.
// Pravá půlka: ťuknutí kamkoli = skok, držení palce skok prodlouží (vyskočí výš).
//   Kulaté tlačítko vpravo dole = HAF (u Peťulky BUBL).
// Čte všechny prsty najednou, takže jde běžet, skákat i štěkat zároveň.
const KOLECKO = {
  polomer: 70,         // jak daleko jde táhnout (v herních pixelech)
  mrtvaZona: 0.18,     // malý pohyb kolem středu nic nedělá
};
const TLACITKO_HAF = {
  polomer: 50,         // velikost tlačítka (v pixelech obrazovky)
  dosah: 72,           // jak daleko od středu ještě ťuknutí platí (palec netrefí přesně)
  odKraje: 78,         // střed tlačítka od pravého a dolního okraje
};

class DotykoveOvladani {
  constructor(scene) {
    this.scene = scene;
    this.koleckoPrst = null;     // id prstu, který drží kolečko
    this.stred = null;
    this.znamePrsty = new Map(); // dotyky vpravo: "id:čas dotyku" -> 'skok' nebo 'haf'

    // tlačítko HAF / BUBL vpravo dole (pevně na obrazovce, nad hrou)
    const T = TLACITKO_HAF;
    this.kruh = scene.add.circle(0, 0, T.polomer, 0xffd43b, 0.55).setStrokeStyle(5, 0x1b1b1b, 0.8);
    this.popis = scene.add.text(0, 0, Postava.schopnost, {
      fontFamily: N.PISMO_NADPIS, fontSize: '28px', color: '#ffffff', stroke: '#1b1b1b', strokeThickness: 6,
    }).setOrigin(0.5);
    if (this.popis.width > T.polomer * 1.8) this.popis.setScale((T.polomer * 1.8) / this.popis.width);
    for (const o of [this.kruh, this.popis]) o.setScrollFactor(0).setDepth(150);
    this.rozmisti();
  }

  // na otočení telefonu se šířka mění: tlačítko drží v pravém dolním rohu
  rozmisti() {
    this.tlacitko = { x: N.SIRKA - TLACITKO_HAF.odKraje, y: N.VYSKA - TLACITKO_HAF.odKraje };
    this.kruh.setPosition(this.tlacitko.x, this.tlacitko.y);
    this.popis.setPosition(this.tlacitko.x, this.tlacitko.y);
  }

  naTlacitku(x, y) {
    return Phaser.Math.Distance.Between(x, y, this.tlacitko.x, this.tlacitko.y) < TLACITKO_HAF.dosah;
  }

  stav() {
    const s = { vlevo: false, vpravo: false, skok: false, haf: false, osaX: 0 };
    const prsty = this.scene.input.manager.pointers.filter((p) => p && p.isDown);

    // --- levá půlka: kolečko ---
    let drzi = prsty.find((p) => p.id === this.koleckoPrst);
    if (!drzi) {
      this.koleckoPrst = null;
      drzi = prsty.find((p) => p.downX < N.SIRKA / 2);
      if (drzi) {
        this.koleckoPrst = drzi.id;
        this.stred = { x: drzi.downX, y: drzi.downY };
      }
    }
    if (drzi) {
      const osa = Phaser.Math.Clamp((drzi.x - this.stred.x) / KOLECKO.polomer, -1, 1);
      if (Math.abs(osa) > KOLECKO.mrtvaZona) {
        // po mrtvé zóně plynule od pomalé chůze po plnou rychlost
        const sila = (Math.abs(osa) - KOLECKO.mrtvaZona) / (1 - KOLECKO.mrtvaZona);
        s.osaX = Math.sign(osa) * Math.min(1, 0.35 + sila * 0.65);
        s.vlevo = osa < 0;
        s.vpravo = osa > 0;
      }
    }

    // --- pravá půlka: ťuknutí = skok, tlačítko vpravo dole = HAF ---
    this.rozmisti();
    const aktivni = new Set();
    for (const p of prsty) {
      if (p.id === this.koleckoPrst || p.downX < N.SIRKA / 2) continue;
      if (this.naMenu(p.downX, p.downY)) continue;
      const klic = `${p.id}:${p.downTime}`;
      aktivni.add(klic);
      if (!this.znamePrsty.has(klic)) this.znamePrsty.set(klic, this.naTlacitku(p.downX, p.downY) ? 'haf' : 'skok');
      if (this.znamePrsty.get(klic) === 'skok') s.skok = true;
      else s.haf = true;
    }
    // stisknuté tlačítko se zmáčkne, po štěku chvíli šedne (než jde štěknout znovu)
    const pripraveno = this.scene.time.now >= (this.scene.hafPripravenOd || 0);
    this.kruh.setScale(s.haf ? 0.9 : 1).setFillStyle(pripraveno ? 0xffd43b : 0x868e96, 0.55);
    for (const klic of this.znamePrsty.keys()) if (!aktivni.has(klic)) this.znamePrsty.delete(klic);
    return s;
  }

  // tlačítko ☰ vpravo nahoře nemá spouštět skok
  naMenu(x, y) {
    return x > N.SIRKA - 70 && y < 70;
  }

  ztlum() {}
}

function jeDotykoveZarizeni(scene) {
  return scene.sys.game.device.input.touch || PARAMETRY.get('dotyk') === '1';
}
