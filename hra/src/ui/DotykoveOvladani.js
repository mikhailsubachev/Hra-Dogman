// Dotykové ovládání pro mobil a tablet. Ovládá se skoro celou plochou.
// Levá půlka: neviditelné kolečko. Kam se palec dotkne, tam je střed; tahem doleva
//   a doprava Dog Man chodí, čím dál tím rychleji.
// Pravá půlka: ťuknutí kamkoli = skok, držení palce skok prodlouží (vyskočí výš).
// Plovoucí kulaté tlačítko = HAF (u Peťulky BUBL). Výchozí místo je vpravo dole;
//   když se na něm palec chvíli podrží, dá se tažením přesunout kamkoli
//   a místo se zapamatuje v zařízení.
// Čte všechny prsty najednou, takže jde běžet, skákat i štěkat zároveň.
const KOLECKO = {
  polomer: 70,         // jak daleko jde táhnout (v herních pixelech)
  mrtvaZona: 0.18,     // malý pohyb kolem středu nic nedělá
};
const TLACITKO_HAF = {
  polomer: 64,         // velikost tlačítka (v pixelech obrazovky)
  dosah: 88,           // jak daleko od středu ještě ťuknutí platí (palec netrefí přesně)
  odKraje: 92,         // výchozí místo: střed tlačítka od pravého a dolního okraje
  drzeni: 450,         // po kolika milisekundách držení jde tlačítko přesunout
  KLIC: 'dogman-tlacitko', // kde si zařízení pamatuje, kam ho hráč přesunul
};

class DotykoveOvladani {
  constructor(scene) {
    this.scene = scene;
    this.koleckoPrst = null;     // id prstu, který drží kolečko
    this.stred = null;
    this.znamePrsty = new Map(); // dotyky: "id:čas dotyku" -> 'skok', 'haf' nebo 'tah' (přesouvá tlačítko)

    // plovoucí tlačítko HAF / BUBL (pevně na obrazovce, nad hrou)
    const T = TLACITKO_HAF;
    this.kruh = scene.add.circle(0, 0, T.polomer, 0xffd43b, 0.55).setStrokeStyle(5, 0x1b1b1b, 0.8);
    this.popis = scene.add.text(0, 0, Postava.schopnost, {
      fontFamily: N.PISMO_NADPIS, fontSize: '34px', color: '#ffffff', stroke: '#1b1b1b', strokeThickness: 7,
    }).setOrigin(0.5);
    if (this.popis.width > T.polomer * 1.8) this.popis.setScale((T.polomer * 1.8) / this.popis.width);
    for (const o of [this.kruh, this.popis]) o.setScrollFactor(0).setDepth(150);
    // místo je uložené jako díl šířky a výšky obrazovky, takže sedí i po otočení telefonu
    this.misto = null;
    try { this.misto = JSON.parse(localStorage.getItem(T.KLIC)); } catch (e) { /* zůstane výchozí roh */ }
    this.rozmisti();
  }

  rozmisti() {
    const T = TLACITKO_HAF;
    const x = this.misto ? this.misto.x * N.SIRKA : N.SIRKA - T.odKraje;
    const y = this.misto ? this.misto.y * N.VYSKA : N.VYSKA - T.odKraje;
    this.posun(x, y);
  }

  // tlačítko celé na obrazovce
  posun(x, y) {
    const p = TLACITKO_HAF.polomer + 4;
    this.tlacitko = { x: Phaser.Math.Clamp(x, p, N.SIRKA - p), y: Phaser.Math.Clamp(y, p, N.VYSKA - p) };
    this.kruh.setPosition(this.tlacitko.x, this.tlacitko.y);
    this.popis.setPosition(this.tlacitko.x, this.tlacitko.y);
  }

  ulozMisto() {
    this.misto = { x: this.tlacitko.x / N.SIRKA, y: this.tlacitko.y / N.VYSKA };
    try { localStorage.setItem(TLACITKO_HAF.KLIC, JSON.stringify(this.misto)); } catch (e) { /* jen do zavření stránky */ }
  }

  naTlacitku(x, y) {
    return Phaser.Math.Distance.Between(x, y, this.tlacitko.x, this.tlacitko.y) < TLACITKO_HAF.dosah;
  }

  stav() {
    const s = { vlevo: false, vpravo: false, skok: false, haf: false, osaX: 0 };
    const prsty = this.scene.input.manager.pointers.filter((p) => p && p.isDown);
    const klic = (p) => `${p.id}:${p.downTime}`;

    // --- tlačítko: ťuknutí = HAF, podržení a tažení ho přesune ---
    let tahne = false;
    const aktivni = new Set();
    for (const p of prsty) {
      if (p.id === this.koleckoPrst || this.naMenu(p.downX, p.downY)) continue;
      const k = klic(p);
      if (!this.znamePrsty.has(k)) {
        if (this.naTlacitku(p.downX, p.downY)) {
          this.znamePrsty.set(k, 'haf');
          s.haf = true;
        } else if (p.downX >= N.SIRKA / 2) {
          this.znamePrsty.set(k, 'skok');
        } else {
          continue; // nový dotyk vlevo patří kolečku
        }
      }
      aktivni.add(k);
      const druh = this.znamePrsty.get(k);
      if (druh === 'skok') s.skok = true;
      else if (druh === 'haf' && this.scene.time.now - this.casDotyku(p) > TLACITKO_HAF.drzeni) this.znamePrsty.set(k, 'tah');
      if (this.znamePrsty.get(k) === 'tah') {
        this.posun(p.x, p.y);
        tahne = true;
      }
    }
    for (const [k, druh] of this.znamePrsty) {
      if (aktivni.has(k)) continue;
      if (druh === 'tah') this.ulozMisto(); // puštěno: tady tlačítko zůstane
      this.znamePrsty.delete(k);
    }
    if (!tahne) this.rozmisti();

    // --- levá půlka: kolečko (dotyk na tlačítku mu nepatří) ---
    let drzi = prsty.find((p) => p.id === this.koleckoPrst);
    if (!drzi) {
      this.koleckoPrst = null;
      drzi = prsty.find((p) => p.downX < N.SIRKA / 2 && !this.znamePrsty.has(klic(p)));
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

    // přesouvané tlačítko je větší a průhlednější; po štěku chvíli šedne (než jde štěknout znovu)
    const pripraveno = this.scene.time.now >= (this.scene.hafPripravenOd || 0);
    this.kruh.setScale(tahne ? 1.15 : s.haf ? 0.9 : 1).setFillStyle(pripraveno ? 0xffd43b : 0x868e96, tahne ? 0.35 : 0.55);
    this.popis.setAlpha(tahne ? 0.6 : 1);
    return s;
  }

  // jak dlouho už prst drží (čas dotyku je v čase prohlížeče, hra počítá svůj)
  casDotyku(p) {
    if (!this.zacatkyDotyku) this.zacatkyDotyku = new Map();
    const k = `${p.id}:${p.downTime}`;
    if (!this.zacatkyDotyku.has(k)) {
      if (this.zacatkyDotyku.size > 20) this.zacatkyDotyku.clear();
      this.zacatkyDotyku.set(k, this.scene.time.now);
    }
    return this.zacatkyDotyku.get(k);
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
