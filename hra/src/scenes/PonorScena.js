// Skákací část mise: Dog Man pod vodou (Ponor, Čuňasova základna i potopený vrak).
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

    // scéna se pro další úroveň používá znovu: nic z minulé úrovně nesmí zůstat
    this.paka = null;
    this.sipkaCile = null;
    this.ponorka = null;
    this.tma = null;
    this.zakladna = uroven.prostredi === 'zakladna';
    this.vrak = uroven.prostredi === 'vrak';
    if (this.zakladna) Textury.zakladna(this); else if (this.vrak) Textury.vrak(this); else Textury.voda(this);
    Textury.bublinky(this);

    this.kosti = this.physics.add.staticGroup();
    this.kysliky = this.physics.add.staticGroup();
    this.bojky = this.physics.add.staticGroup();
    this.nepratele = this.physics.add.group();
    this.seznamNepratel = [];
    this.miny = this.physics.add.staticGroup();
    this.plosiny = [];
    this.svetlusky = this.physics.add.staticGroup();
    this.klicky = this.physics.add.staticGroup();
    this.dvere = this.physics.add.staticGroup();
    this.hledany = null;

    // dno jako tilemapa: srážky na spojích dlaždic pak nezasekávají
    // < a > je kluzký povrch (2 a 3), po kterém Dog Man sjíždí doleva nebo doprava
    const pevne = '#<>';
    const data = mapa.map((radek, r) => [...radek].map((znak, s) => {
      if (znak === '<') return 2;
      if (znak === '>') return 3;
      if (znak !== '#') return -1;
      return r === 0 || !pevne.includes(mapa[r - 1][s]) ? 0 : 1;
    }));
    const tilemapa = this.make.tilemap({ data, tileWidth: T, tileHeight: T });
    const klicSady = this.zakladna ? 'sada_kov' : this.vrak ? 'sada_vrak' : 'sada_dna';
    const sada = tilemapa.addTilesetImage(klicSady, klicSady, T, T, 0, 0);
    this.dlazdice = tilemapa.createLayer(0, sada, 0, 0).setDepth(1);
    this.dlazdice.setCollision([0, 1, 2, 3]);

    let start = { x: 2 * T, y: 2 * T };
    let konec = null;

    mapa.forEach((radek, r) => {
      [...radek].forEach((znak, s) => {
        const x = s * T + T / 2;
        const y = r * T + T / 2;
        switch (znak) {
          case '#':
            if (!this.zakladna && !this.vrak && (r === 0 || mapa[r - 1][s] !== '#') && (s * 7 + r * 13) % 5 === 0) this.pridejRasu(x, r * T);
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
          case 'J': {
            const j = this.svetlusky.create(x, y, 'svetluska').setDepth(3);
            j.nabita = true;
            this.tweens.add({ targets: j, y: y - 10, duration: 1300 + (s % 3) * 200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
            break;
          }
          case 'k': {
            const k = this.klicky.create(x, y, 'klicek').setDepth(3);
            this.tweens.add({ targets: k, angle: { from: -15, to: 15 }, y: y - 6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
            break;
          }
          case 'D': this.pridejDvere(mapa, r, s); break;
          case 'H': this.pridejHledaneho(x, (r + 1) * T); break;
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
    this.tmavost = uroven.tma || null;
    this.pripravHrace(start, { kosti: this.kosti.getLength(), klice: this.klicky.getLength() ? 0 : undefined, svetlo: !!this.tmavost });
    this.pocetKosti = 0;
    this.klice = 0;
    this.svetlo = 1;
    if (this.tmavost) this.pripravTmu();
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
    this.physics.add.overlap(this.hrac.telo, this.svetlusky, (h, j) => this.dobijLampu(j));
    this.physics.add.overlap(this.hrac.telo, this.klicky, (h, k) => this.seberKlicek(k));
    this.physics.add.collider(this.hrac.telo, this.dvere, (h, d) => this.dotekDveri(d.dvere));
    this.physics.add.collider(this.nepratele, this.dvere);
    if (this.hledany) this.physics.add.overlap(this.hrac.telo, this.hledany.zona, () => this.zachran());

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
    this.klouzani();
    if (this.hledany) this.pohybHledaneho(cas);
    if (this.tmavost) this.aktualizujTmu(delta);
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
    this.svetlo = 1;
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

  zasah(hlaska) {
    super.zasah(hlaska);
    this.svetlo = Math.max(this.svetlo, 0.6); // po návratu na kontrolní bod je aspoň trochu vidět
  }

  cil() {
    if (this.hotovo) return;
    if (this.paka) return this.vypniZakladnu();
    // z vraku se odplouvá jen s Bobánkem
    if (this.hledany && !this.hledany.zachranen) {
      if (this.time.now > (this.napovedaCile || 0)) {
        this.napovedaCile = this.time.now + 2500;
        this.vyskakovaciText(this.hrac.x, this.hrac.y - 60, 'Nejdřív najdi Bobánka!', '#ffd43b');
      }
      return;
    }
    if (this.hledany) {
      this.tweens.add({ targets: this.hledany.obrazek, x: this.ponorka.x + 30, y: this.ponorka.y - 60, scale: 0.1, alpha: 0, duration: 600 });
    }
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

  // --- potopený vrak ---

  // D: zamčené dveře. Díly D pod sebou tvoří jedny dveře, otevře je klíček.
  pridejDvere(mapa, r, s) {
    if (r > 0 && mapa[r - 1][s] === 'D') return; // díl patří k dveřím nad ním
    const T = N.DLAZDICE;
    let vyska = 1;
    while (mapa[r + vyska] && mapa[r + vyska][s] === 'D') vyska++;
    const dvere = { dily: [] };
    for (let i = 0; i < vyska; i++) {
      const d = this.dvere.create(s * T + T / 2, (r + i) * T + T / 2, 'dvere').setDepth(2);
      d.dvere = dvere;
      dvere.dily.push(d);
    }
    dvere.zamek = this.add.image(s * T + T / 2, (r + vyska / 2) * T, 'zamek').setDepth(3);
  }

  seberKlicek(k) {
    k.destroy();
    this.klice++;
    Zvuky.checkpoint();
    this.vyskakovaciText(k.x, k.y - 30, 'Klíček!', '#ffd43b');
    this.ukazatele.klice(this.klice);
  }

  dotekDveri(dvere) {
    if (dvere.otevrene) return;
    if (!this.klice) {
      if (this.time.now > (this.napovedaDveri || 0)) {
        this.napovedaDveri = this.time.now + 2500;
        this.vyskakovaciText(this.hrac.x, this.hrac.y - 60, 'Zamčeno! Najdi klíček', '#ffd43b');
      }
      return;
    }
    dvere.otevrene = true;
    this.klice--;
    this.ukazatele.klice(this.klice);
    Zvuky.konec();
    this.vyskakovaciText(dvere.zamek.x, dvere.zamek.y - 40, 'Odemčeno!', '#69db7c');
    dvere.dily.forEach((d) => { d.body.enable = false; });
    this.tweens.add({ targets: dvere.zamek, y: dvere.zamek.y + 80, alpha: 0, angle: 90, duration: 500 });
    this.tweens.add({ targets: dvere.dily, scaleX: 0.15, x: '-=20', alpha: 0.6, duration: 450, ease: 'Sine.in' });
  }

  // J: svítící medúza dobije lampu, pak chvíli nesvítí
  dobijLampu(j) {
    if (!j.nabita || !this.tmavost) return;
    j.nabita = false;
    j.setAlpha(0.35);
    this.svetlo = 1;
    Zvuky.kyslik();
    this.vyskakovaciText(j.x, j.y - 40, 'Světlo!', '#99e9f2');
    this.time.delayedCall(N.SVETLO.obnova, () => { j.nabita = true; j.setAlpha(1); });
  }

  // < a >: na kluzké palubě to Dog Mana táhne do strany
  klouzani() {
    if (!this.hrac.naZemi || this.hrac.zmrazeny) return;
    const b = this.hrac.telo.body;
    const dlazdice = this.dlazdice.getTileAtWorldXY(b.center.x, b.bottom + 4);
    if (!dlazdice || dlazdice.index < 2) return;
    b.velocity.x += dlazdice.index === 2 ? -N.SKLUZ : N.SKLUZ;
  }

  // H: ztracený Bobánek. Volá o pomoc, po dotyku plave za Dog Manem.
  pridejHledaneho(x, dno) {
    const obrazek = this.add.image(x, dno, 'bobanek').setOrigin(0.5, 1).setDepth(4);
    obrazek.setScale(88 / obrazek.height);
    const zona = this.add.zone(x, dno - 44, 70, 88);
    this.physics.add.existing(zona, true);
    this.hledany = { obrazek, zona, zachranen: false, volaniOd: 0 };
    this.tweens.add({ targets: obrazek, angle: { from: -5, to: 5 }, duration: 260, yoyo: true, repeat: -1 }); // třese se strachy
  }

  zachran() {
    const h = this.hledany;
    if (h.zachranen || this.hrac.zmrazeny) return;
    h.zachranen = true;
    Zvuky.checkpoint();
    this.tweens.killTweensOf(h.obrazek);
    h.obrazek.setAngle(0).setOrigin(0.5);
    h.obrazek.y -= 44;
    this.rekni(h.obrazek.x, h.obrazek.y - 50, 'Dog Mane! Ty jsi mě našel!', '#2b8a3e', 2000);
    this.vyskakovaciText(this.hrac.x, this.hrac.y - 70, 'Bobánek zachráněn!', '#69db7c', 40);
  }

  pohybHledaneho(cas) {
    const h = this.hledany;
    const o = h.obrazek;
    if (!h.zachranen) {
      // volá o pomoc, když je Dog Man nablízku
      const d = Phaser.Math.Distance.Between(this.hrac.x, this.hrac.y, o.x, o.y);
      if (d < 9 * N.DLAZDICE && cas > h.volaniOd) {
        h.volaniOd = cas + 3500;
        const hlasky = ['Šéfe? Haló?', 'Je tu někdo?', 'Já se bojím tmy!'];
        this.rekni(o.x, o.y - 100, hlasky[Math.floor(cas / 3500) % hlasky.length], '#1b1622', 1800);
      }
      return;
    }
    if (this.hotovo) return;
    const cilX = this.hrac.x - this.hrac.smer * 60;
    const cilY = this.hrac.y - 30 + Math.sin(cas * 0.004) * 6;
    o.x = Phaser.Math.Linear(o.x, cilX, 0.06);
    o.y = Phaser.Math.Linear(o.y, cilY, 0.06);
    o.setFlipX(this.hrac.smer > 0); // kresba kouká doleva
  }

  // tma přes obrazovku; lampa Dog Mana a svítící věci do ní dělají díry
  pripravTmu() {
    this.tma = this.add.renderTexture(0, 0, 1400, N.VYSKA).setOrigin(0).setScrollFactor(0).setDepth(30);
    this.lampa = this.make.image({ key: 'svetlo', add: false }).setOrigin(0.5);
  }

  // jak je tma: podle sloupce mapy, mezi body [sloupec, neprůhlednost] se plynule přechází
  tmaV(sloupec) {
    const body = this.tmavost;
    if (sloupec <= body[0][0]) return body[0][1];
    for (let i = 1; i < body.length; i++) {
      const [s1, a1] = body[i];
      if (sloupec <= s1) {
        const [s0, a0] = body[i - 1];
        return a0 + ((sloupec - s0) / (s1 - s0)) * (a1 - a0);
      }
    }
    return body[body.length - 1][1];
  }

  aktualizujTmu(delta) {
    if (!this.hotovo && !this.hrac.zmrazeny) this.svetlo = Math.max(0, this.svetlo - delta / 1000 / N.SVETLO.vydrz);
    const kam = this.cameras.main;
    const rt = this.tma;
    rt.clear();
    rt.fill(0x000000, this.tmaV(this.hrac.x / N.DLAZDICE));
    const sviti = (x, y, polomer) => {
      const sx = x - kam.scrollX;
      const sy = y - kam.scrollY;
      if (sx < -polomer || sx > N.SIRKA + polomer || sy < -polomer || sy > N.VYSKA + polomer) return;
      this.lampa.setPosition(sx, sy).setScale(polomer / 128);
      rt.erase(this.lampa);
    };
    sviti(this.hrac.x, this.hrac.y - 10, N.SVETLO.min + (N.SVETLO.max - N.SVETLO.min) * this.svetlo);
    this.svetlusky.children.iterate((j) => { sviti(j.x, j.y, j.nabita ? 120 : 50); });
    this.klicky.children.iterate((k) => { sviti(k.x, k.y, 60); });
    this.miny.children.iterate((m) => { if (m.visible) sviti(m.x, m.y, 50); });
    for (const n of this.seznamNepratel) if (n.zivy) sviti(n.sprite.x, n.sprite.y, 60);
    if (this.hledany) sviti(this.hledany.obrazek.x, this.hledany.obrazek.y - (this.hledany.zachranen ? 0 : 44), 80);
    if (this.ponorka) sviti(this.ponorka.x, this.ponorka.y - 50, 150);
    this.ukazatele.svetlo(this.svetlo);
  }

  // --- efekty ---

  pridejRasu(x, horniOkraj) {
    const r = this.add.image(x + Phaser.Math.Between(-12, 12), horniOkraj + 4, 'rasa').setOrigin(0.5, 1).setDepth(0);
    this.tweens.add({ targets: r, angle: { from: -7, to: 7 }, duration: 1600 + (x % 5) * 200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }
}
