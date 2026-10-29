// Skákací část mise: Dog Man pod vodou (Ponor i Čuňasova základna).
class PonorScena extends HerniScena {
  constructor() { super('Ponor'); }

  init(data) {
    this.idUrovne = (data && data.uroven) || 'ponor1';
  }

  create() {
    const uroven = UROVNE[this.idUrovne];
    const mapa = nactiMapu(uroven.mapa);
    const T = N.DLAZDICE;
    this.sirkaSveta = mapa[0].length * T;
    this.vyskaSveta = mapa.length * T;

    this.physics.world.gravity.y = N.GRAVITACE;
    this.physics.world.setBounds(0, 0, this.sirkaSveta, this.vyskaSveta + 400);
    this.physics.world.setBoundsCollision(true, true, false, false); // dole se dá propadnout
    this.cameras.main.setBounds(0, 0, this.sirkaSveta, this.vyskaSveta);

    this.zakladna = uroven.prostredi === 'zakladna';
    if (this.zakladna) Textury.zakladna(this); else Textury.voda(this);
    Textury.bublinky(this);

    this.kosti = this.physics.add.staticGroup();
    this.kysliky = this.physics.add.staticGroup();
    this.bojky = this.physics.add.staticGroup();
    this.nepratele = this.physics.add.group();
    this.seznamNepratel = [];
    this.miny = this.physics.add.staticGroup();
    this.plosiny = [];

    // dno jako tilemapa: srážky na spojích dlaždic pak nezasekávají
    const data = mapa.map((radek, r) => [...radek].map((znak, s) => {
      if (znak !== '#') return -1;
      return r === 0 || mapa[r - 1][s] !== '#' ? 0 : 1;
    }));
    const tilemapa = this.make.tilemap({ data, tileWidth: T, tileHeight: T });
    const klicSady = this.zakladna ? 'sada_kov' : 'sada_dna';
    const sada = tilemapa.addTilesetImage(klicSady, klicSady, T, T, 0, 0);
    this.dlazdice = tilemapa.createLayer(0, sada, 0, 0).setDepth(1);
    this.dlazdice.setCollision([0, 1]);

    let start = { x: 2 * T, y: 2 * T };
    let konec = null;

    mapa.forEach((radek, r) => {
      [...radek].forEach((znak, s) => {
        const x = s * T + T / 2;
        const y = r * T + T / 2;
        switch (znak) {
          case '#':
            if (!this.zakladna && (r === 0 || mapa[r - 1][s] !== '#') && (s * 7 + r * 13) % 5 === 0) this.pridejRasu(x, r * T);
            break;
          case 'K': {
            const k = this.kosti.create(x, y, 'kost').setDepth(2);
            this.tweens.add({ targets: k, angle: { from: -12, to: 12 }, duration: 900 + (s % 4) * 120, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
            break;
          }
          case 'O': {
            const o = this.kysliky.create(x, y, 'kyslik').setDepth(2);
            this.tweens.add({ targets: o, scale: 1.12, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
            break;
          }
          case 'C':
            this.bojky.create(x, (r + 1) * T - 29, 'bojka').setDepth(2);
            break;
          case 'R': this.seznamNepratel.push(new RobotickaRybka(this, x, y)); break;
          case 'M': this.seznamNepratel.push(new Meduza(this, x, y)); break;
          case 'B': this.seznamNepratel.push(new Bobanek(this, x, y)); break;
          case 'X': {
            const m = this.miny.create(x, y, 'mina').setDepth(3);
            m.body.setCircle(15, 7, 7);
            this.tweens.add({ targets: m, angle: { from: -15, to: 15 }, duration: 1400 + (s % 3) * 200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
            break;
          }
          case 'S': start = { x, y }; break;
          case 'E': konec = { x, y: (r + 1) * T }; break;
          case 'Z': konec = { x, y: (r + 1) * T, vypinac: true }; break;
          default: break;
        }
      });
    });

    this.pridejProudy(mapa);
    this.pridejPlosiny(mapa);

    // na konci základny velký vypínač
    if (konec && konec.vypinac) {
      this.paka = this.add.image(konec.x, konec.y, 'paka').setOrigin(0.5, 1).setDepth(2).setScale(1.25);
      this.cilZona = this.add.zone(konec.x, konec.y - 50, 70, 100);
      this.physics.add.existing(this.cilZona, true);
      const sipka = this.sipkaCile = this.add.text(konec.x, konec.y - 160, 'VYPNI! ▼', {
        fontFamily: N.PISMO_NADPIS, fontSize: '30px', color: '#ffd43b', stroke: '#1b1b1b', strokeThickness: 6,
      }).setOrigin(0.5).setDepth(3);
      this.tweens.add({ targets: sipka, y: '-=12', duration: 500, yoyo: true, repeat: -1 });
    // ponorka na konci úrovně
    } else if (konec) {
      this.ponorka = this.add.image(konec.x, konec.y + 6, 'ponorka').setOrigin(0.5, 1).setDepth(2);
      this.ponorka.setScale(264 / this.ponorka.width);
      this.tweens.add({ targets: this.ponorka, y: '-=6', duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.cilZona = this.add.zone(konec.x, konec.y - 50, 220, 100);
      this.physics.add.existing(this.cilZona, true);
      const sipka = this.add.text(konec.x, konec.y - 150, 'NASTUP! ▼', {
        fontFamily: N.PISMO_NADPIS, fontSize: '30px', color: '#ffd43b', stroke: '#1b1b1b', strokeThickness: 6,
      }).setOrigin(0.5).setDepth(3);
      this.tweens.add({ targets: sipka, y: '-=12', duration: 500, yoyo: true, repeat: -1 });
    }

    // Dog Man, ovládání, stav hry a horní lišta
    this.pripravHrace(start, { kosti: this.kosti.getLength() });
    this.pocetKosti = 0;
    this.celkemKosti = this.kosti.getLength();

    // srážky a sbírání
    this.physics.add.collider(this.hrac.telo, this.dlazdice);
    this.physics.add.collider(this.nepratele, this.dlazdice, null, (n) => n.nepritel.koliduje);
    this.physics.add.overlap(this.hrac.telo, this.kosti, (h, k) => this.seberKost(k));
    this.physics.add.overlap(this.hrac.telo, this.kysliky, (h, o) => this.seberKyslik(o));
    this.physics.add.overlap(this.hrac.telo, this.bojky, (h, b) => this.kontrola(b));
    this.physics.add.overlap(this.hrac.telo, this.nepratele, (h, n) => this.dotekNepritele(n.nepritel));
    this.physics.add.overlap(this.hrac.telo, this.miny, (h, m) => this.vybuchMiny(m));
    for (const p of this.plosiny) this.physics.add.collider(this.hrac.telo, p);
    for (const z of this.proudy) this.physics.add.overlap(this.hrac.telo, z, () => this.hrac.vynes(N.PROUD.sila, N.PROUD.max));
    if (this.cilZona) this.physics.add.overlap(this.hrac.telo, this.cilZona, () => this.cil());

    this.cameras.main.startFollow(this.hrac.telo, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(80, 60);
    this.cameras.main.fadeIn(400);

    this.ukazNazev(uroven.nazev);

    if (PARAMETRY.get('debug') === '1') this.physics.world.createDebugGraphic();
  }

  update(cas, delta) {
    if (!this.zakladniUpdate(cas, delta)) return;
    for (const n of this.seznamNepratel) if (n.zivy) n.update(cas, this.hrac);
    for (const p of this.plosiny) this.posunPlosinu(p);
    // propadl se dírou ve dně
    if (this.hrac.y > this.vyskaSveta + 40 && !this.hrac.zmrazeny) this.zasah('Žbluňk!');
    this.ukazatele.update(this.pocetKosti, this.kyslik, this.casHry);
  }

  // --- události ---

  seberKost(kost) {
    kost.destroy();
    this.pocetKosti++;
    Zvuky.kost();
    this.vyskakovaciText(kost.x, kost.y - 20, '+1', '#ffffff', 26);
  }

  kontrola(bojka) {
    if (bojka.ulozeno) return;
    bojka.ulozeno = true;
    bojka.setTexture('bojka_ok');
    this.kontrolniBod = { x: bojka.x, y: bojka.y - 20 };
    this.kyslik = N.KYSLIK.max;
    this.varovaniKysliku = false;
    Zvuky.checkpoint();
    this.vyskakovaciText(bojka.x, bojka.y - 60, 'Kontrolní bod!', '#69db7c');
  }

  // X: mina vybuchne, Dog Man se vrátí na kontrolní bod, mina se za chvíli objeví znovu
  vybuchMiny(mina) {
    if (!this.hrac.zranitelny || this.hotovo) return;
    mina.setVisible(false);
    mina.body.enable = false;
    Zvuky.bum();
    const kruh = this.add.circle(mina.x, mina.y, 60, 0xffa94d, 0.8).setDepth(7).setScale(0.2);
    this.tweens.add({ targets: kruh, scale: 1.4, alpha: 0, duration: 400, onComplete: () => kruh.destroy() });
    this.rozsypSrouby(mina.x, mina.y, 10, 90);
    this.zasah('BUM!');
    this.time.delayedCall(N.MINA.obnova, () => {
      mina.body.enable = true;
      mina.setVisible(true).setScale(0.2);
      this.tweens.add({ targets: mina, scale: 1, duration: 300, ease: 'Back.out' });
    });
  }

  cil() {
    if (this.hotovo) return;
    if (this.paka) return this.vypniZakladnu();
    this.hotovo = true;
    Zvuky.konec();
    this.hrac.zmraz();
    this.hrac.odpoj(); // obrázek teď řídí animace nástupu
    this.tweens.add({
      targets: this.hrac.obrazek, x: this.ponorka.x, y: this.ponorka.y - 60, scale: 0.3, alpha: 0, duration: 600,
      onComplete: () => this.hrac.obrazek.setVisible(false),
    });
    this.cameras.main.stopFollow();
    this.tweens.add({ targets: this.ponorka, x: '+=700', delay: 700, duration: 2200, ease: 'Sine.in' });
    this.time.delayedCall(2300, () => this.dokonceno({ kosti: this.pocetKosti, celkem: this.celkemKosti }));
  }

  // Z: Dog Man stáhne páku, základna zhasne a Čuňas zuří
  vypniZakladnu() {
    this.hotovo = true;
    this.hrac.zmraz();
    this.paka.setTexture('paka_dole');
    this.sipkaCile.destroy();
    Zvuky.konec();
    this.cameras.main.shake(500, 0.01);
    this.cameras.main.flash(300, 255, 80, 80);
    const tma = this.add.rectangle(0, 0, 1400, N.VYSKA, 0x000000, 0).setOrigin(0).setScrollFactor(0).setDepth(40);
    this.tweens.add({ targets: tma, fillAlpha: 0.45, duration: 900 });
    this.vyskakovaciText(this.paka.x, this.paka.y - 130, 'ZÁKLADNA VYPNUTA!', '#69db7c', 44);
    this.time.delayedCall(700, () => this.rekni(this.cameras.main.scrollX + N.SIRKA / 2, this.cameras.main.scrollY + 200,
      'Čuňas z reproduktoru: NEEE! Moje základna!', '#7048e8', 2000).setScrollFactor(1));
    this.time.delayedCall(2600, () => this.dokonceno({ kosti: this.pocetKosti, celkem: this.celkemKosti }));
  }

  // ^: proudy bublin. Sousední ^ se spojí do jednoho obdélníku, dole je tryska.
  pridejProudy(mapa) {
    const T = N.DLAZDICE;
    const useky = [];
    for (let s = 0; s < mapa[0].length; s++) {
      let r = 0;
      while (r < mapa.length) {
        if (mapa[r][s] !== '^') { r++; continue; }
        const r0 = r;
        while (r < mapa.length && mapa[r][s] === '^') r++;
        const vedle = useky.find((u) => u.s1 === s - 1 && u.r0 === r0 && u.r1 === r - 1);
        if (vedle) vedle.s1 = s; else useky.push({ s0: s, s1: s, r0, r1: r - 1 });
      }
    }
    this.proudy = useky.map((u) => {
      const x = u.s0 * T;
      const w = (u.s1 - u.s0 + 1) * T;
      const y = u.r0 * T;
      const h = (u.r1 - u.r0 + 1) * T;
      this.add.rectangle(x, y, w, h, 0x9be7ff, 0.2).setOrigin(0).setDepth(0);
      const dno = mapa[u.r1 + 1] && mapa[u.r1 + 1][u.s0] === '#';
      if (dno) this.add.image(x + w / 2, y + h, 'tryska').setOrigin(0.5, 1).setDisplaySize(w, 20).setDepth(2);
      this.time.addEvent({
        delay: 80, loop: true, callback: () => {
          const b = this.add.image(x + Phaser.Math.Between(6, w - 6), y + h - 10, 'bublinka')
            .setDepth(4).setScale(Phaser.Math.FloatBetween(0.6, 1.5)).setAlpha(0.85);
          this.tweens.add({ targets: b, y: y - 10, x: b.x + Phaser.Math.Between(-10, 10), duration: (h / 260) * 1000, onComplete: () => b.destroy() });
        },
      });
      const zona = this.add.zone(x + w / 2, y + h / 2, w, h);
      this.physics.add.existing(zona, true);
      return zona;
    });
  }

  // =: pohyblivé plošiny. Jezdí sem a tam po dráze z pomlček (-) ve stejném řádku.
  pridejPlosiny(mapa) {
    const T = N.DLAZDICE;
    mapa.forEach((radek, r) => {
      const re = /[=-]+/g;
      let m;
      while ((m = re.exec(radek))) {
        const draha = m[0];
        const zacatek = draha.indexOf('=');
        if (zacatek < 0) continue;
        const delka = draha.lastIndexOf('=') - zacatek + 1;
        const w = delka * T;
        const p = this.add.tileSprite((m.index + zacatek) * T + w / 2, r * T + 12, w, 24, 'plosina').setDepth(2);
        this.physics.add.existing(p);
        p.body.setAllowGravity(false).setImmovable(true);
        p.minX = m.index * T;
        p.maxX = (m.index + draha.length) * T;
        p.body.setVelocityX(N.PLOSINA.rychlost);
        this.plosiny.push(p);
      }
    });
  }

  posunPlosinu(p) {
    const b = p.body;
    if (b.left <= p.minX) b.setVelocityX(N.PLOSINA.rychlost);
    else if (b.right >= p.maxX) b.setVelocityX(-N.PLOSINA.rychlost);
  }

  // --- efekty ---

  pridejRasu(x, horniOkraj) {
    const r = this.add.image(x + Phaser.Math.Between(-12, 12), horniOkraj + 4, 'rasa').setOrigin(0.5, 1).setDepth(0);
    this.tweens.add({ targets: r, angle: { from: -7, to: 7 }, duration: 1600 + (x % 5) * 200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }
}
