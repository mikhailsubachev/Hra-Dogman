// Dotykové ovládání pro mobil a tablet. Na obrazovce nic není, ovládá se celou plochou.
// Levá půlka: neviditelné kolečko. Kam se palec dotkne, tam je střed; tahem doleva
//   a doprava Dog Man chodí, čím dál tím rychleji.
// Pravá půlka: ťuknutí kamkoli = skok, držení palce skok prodlouží (vyskočí výš).
//   Dvojí rychlé ťuknutí = HAF.
// Čte všechny prsty najednou, takže jde běžet a skákat zároveň.
const KOLECKO = {
  polomer: 70,         // jak daleko jde táhnout (v herních pixelech)
  mrtvaZona: 0.18,     // malý pohyb kolem středu nic nedělá
};
const DVOJI_TUKNUTI = 300; // do kolika milisekund musí přijít druhé ťuknutí, aby to byl HAF

class DotykoveOvladani {
  constructor(scene) {
    this.scene = scene;
    this.koleckoPrst = null;     // id prstu, který drží kolečko
    this.stred = null;
    this.znamePrsty = new Map(); // dotyky vpravo: "id:čas dotyku" -> 'skok' nebo 'haf'
    this.posledniSkokVpravo = -Infinity;
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

    // --- pravá půlka: ťuknutí = skok, dvojí ťuknutí = HAF ---
    const aktivni = new Set();
    for (const p of prsty) {
      if (p.id === this.koleckoPrst || p.downX < N.SIRKA / 2) continue;
      if (this.naMenu(p.downX, p.downY)) continue;
      const klic = `${p.id}:${p.downTime}`;
      aktivni.add(klic);
      if (!this.znamePrsty.has(klic)) {
        // nový dotyk: krátce po předchozím ťuknutí je to HAF, jinak skok
        const druhe = p.downTime - this.posledniSkokVpravo < DVOJI_TUKNUTI;
        this.znamePrsty.set(klic, druhe ? 'haf' : 'skok');
        if (druhe) {
          s.haf = true;
          this.posledniSkokVpravo = -Infinity; // třetí ťuknutí je zase skok
        } else {
          this.posledniSkokVpravo = p.downTime;
        }
      }
      if (this.znamePrsty.get(klic) === 'skok') s.skok = true;
    }
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
