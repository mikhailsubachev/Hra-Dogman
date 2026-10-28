// Skákací část mise: Dog Man pod vodou.
class PonorScena extends Phaser.Scene {
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

    Textury.voda(this);
    Textury.bublinky(this);

    this.kosti = this.physics.add.staticGroup();
    this.kysliky = this.physics.add.staticGroup();
    this.bojky = this.physics.add.staticGroup();
    this.nepratele = this.physics.add.group();
    this.seznamNepratel = [];

    // dno jako tilemapa: srážky na spojích dlaždic pak nezasekávají
    const data = mapa.map((radek, r) => [...radek].map((znak, s) => {
      if (znak !== '#') return -1;
      return r === 0 || mapa[r - 1][s] !== '#' ? 0 : 1;
    }));
    const tilemapa = this.make.tilemap({ data, tileWidth: T, tileHeight: T });
    const sada = tilemapa.addTilesetImage('sada_dna', 'sada_dna', T, T, 0, 0);
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
            if ((r === 0 || mapa[r - 1][s] !== '#') && (s * 7 + r * 13) % 5 === 0) this.pridejRasu(x, r * T);
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
          case 'S': start = { x, y }; break;
          case 'E': konec = { x, y: (r + 1) * T }; break;
          default: break;
        }
      });
    });

    // ponorka na konci úrovně
    if (konec) {
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

    // Dog Man
    this.start = start;
    this.kontrolniBod = { ...start };
    this.hrac = new DogMan(this, start.x, start.y);

    // srážky a sbírání
    this.physics.add.collider(this.hrac.telo, this.dlazdice);
    this.physics.add.collider(this.nepratele, this.dlazdice, null, (n) => n.nepritel.koliduje);
    this.physics.add.overlap(this.hrac.telo, this.kosti, (h, k) => this.seberKost(k));
    this.physics.add.overlap(this.hrac.telo, this.kysliky, (h, o) => this.seberKyslik(o));
    this.physics.add.overlap(this.hrac.telo, this.bojky, (h, b) => this.kontrola(b));
    this.physics.add.overlap(this.hrac.telo, this.nepratele, (h, n) => this.dotekNepritele(n.nepritel));
    if (this.cilZona) this.physics.add.overlap(this.hrac.telo, this.cilZona, () => this.cil());

    this.cameras.main.startFollow(this.hrac.telo, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(80, 60);
    this.cameras.main.fadeIn(400);

    // stav hry
    this.pocetKosti = 0;
    this.celkemKosti = this.kosti.getLength();
    this.kyslik = N.KYSLIK.max;
    this.varovaniKysliku = false;
    this.hafPripravenOd = 0;
    this.zniceno = 0;
    this.hotovo = false;
    this.zacatek = this.time.now;
    this.casHry = 0;
    this.predchozi = { skok: false, haf: false };

    // ovládání
    this.klavesy = this.input.keyboard.addKeys('LEFT,RIGHT,UP,A,D,W,SPACE,X,K,ESC');
    this.input.keyboard.addCapture('SPACE,UP,DOWN,LEFT,RIGHT');
    this.dotyk = jeDotykoveZarizeni(this) ? new DotykoveOvladani(this) : null;
    this.ukazatele = new Ukazatele(this, this.celkemKosti);

    // název úrovně
    const nazev = this.add.text(N.SIRKA / 2, 110, uroven.nazev, {
      fontFamily: N.PISMO_NADPIS, fontSize: '54px', color: '#ffffff', stroke: '#0b2a55', strokeThickness: 10,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
    this.tweens.add({ targets: nazev, alpha: 0, delay: 1800, duration: 700, onComplete: () => nazev.destroy() });
    if (this.dotyk) {
      const styl = { fontFamily: N.PISMO, fontSize: '34px', color: '#ffffff', stroke: '#0b2a55', strokeThickness: 7, align: 'center' };
      const vlevo = this.add.text(N.SIRKA * 0.25, N.VYSKA - 90, '◀ táhni ▶\nchůze', styl).setOrigin(0.5).setScrollFactor(0).setDepth(200);
      const vpravo = this.add.text(N.SIRKA * 0.75, N.VYSKA - 90, 'ťukni = skok\n2× ťukni = HAF', styl).setOrigin(0.5).setScrollFactor(0).setDepth(200);
      const cara = this.add.rectangle(N.SIRKA / 2, N.VYSKA / 2 + 40, 3, N.VYSKA - 160, 0xffffff, 0.35).setScrollFactor(0).setDepth(200);
      this.tweens.add({ targets: [vlevo, vpravo, cara], alpha: 0, delay: 3500, duration: 800, onComplete: () => [vlevo, vpravo, cara].forEach((o) => o.destroy()) });
    }

    if (PARAMETRY.get('debug') === '1') this.physics.world.createDebugGraphic();
  }

  update(cas, delta) {
    const ov = this.ctiOvladani();
    if (Phaser.Input.Keyboard.JustDown(this.klavesy.ESC)) return this.doMenu();

    this.hrac.update(ov, cas);
    if (ov.hafStisknut) this.haf(cas);
    for (const n of this.seznamNepratel) if (n.zivy) n.update(cas, this.hrac);

    // kyslík
    if (N.KYSLIK.zapnuto && !this.hotovo && !this.hrac.zmrazeny) {
      this.kyslik -= (N.KYSLIK.ubytekZaSekundu * delta) / 1000;
      if (this.kyslik < N.KYSLIK.max * 0.25 && !this.varovaniKysliku) {
        this.varovaniKysliku = true;
        this.vyskakovaciText(this.hrac.x, this.hrac.y - 60, 'Málo kyslíku!', '#ff6b6b');
      }
      if (this.kyslik <= 0) this.zasah('Došel kyslík!');
    }

    // propadl se dírou ve dně
    if (this.hrac.y > this.vyskaSveta + 40 && !this.hrac.zmrazeny) this.zasah('Žbluňk!');

    if (!this.hotovo) this.casHry = this.time.now - this.zacatek;
    this.ukazatele.update(this.pocetKosti, this.kyslik, this.casHry);
  }

  ctiOvladani() {
    const k = this.klavesy;
    const d = this.dotyk ? this.dotyk.stav() : {};
    const skok = k.UP.isDown || k.W.isDown || k.SPACE.isDown || !!d.skok;
    const haf = k.X.isDown || k.K.isDown || !!d.haf;
    const ov = {
      vlevo: k.LEFT.isDown || k.A.isDown || !!d.vlevo,
      vpravo: k.RIGHT.isDown || k.D.isDown || !!d.vpravo,
      osaX: d.osaX || 0,
      skok,
      haf,
      skokStisknut: skok && !this.predchozi.skok,
      hafStisknut: haf && !this.predchozi.haf,
    };
    this.predchozi = { skok, haf };
    return ov;
  }

  // --- události ---

  seberKost(kost) {
    kost.destroy();
    this.pocetKosti++;
    Zvuky.kost();
    this.vyskakovaciText(kost.x, kost.y - 20, '+1', '#ffffff', 26);
  }

  seberKyslik(bublina) {
    bublina.destroy();
    this.kyslik = Math.min(N.KYSLIK.max, this.kyslik + N.KYSLIK.bublina);
    this.varovaniKysliku = false;
    Zvuky.kyslik();
    this.vypustBublinky(bublina.x, bublina.y, 6);
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

  zasah(hlaska) {
    if (!this.hrac.zranitelny || this.hotovo) return;
    Zvuky.zasah();
    this.cameras.main.shake(160, 0.006);
    this.vyskakovaciText(this.hrac.x, this.hrac.y - 50, hlaska, '#ff8787');
    this.vypustBublinky(this.hrac.x, this.hrac.y, 10);
    this.hrac.zmraz();
    this.time.delayedCall(450, () => {
      this.hrac.presun(this.kontrolniBod.x, this.kontrolniBod.y);
      this.kyslik = Math.max(this.kyslik, N.KYSLIK.max * 0.6);
      this.varovaniKysliku = false;
    });
  }

  dotekNepritele(nepritel) {
    if (!nepritel.zivy || this.hrac.zmrazeny || this.hotovo) return;
    const hrac = this.hrac.telo.body;
    const shora = hrac.velocity.y > 0 && hrac.bottom <= nepritel.sprite.body.top + 18;
    if (shora) {
      const hlaska = nepritel.skokShora();
      if (!nepritel.zivy) this.zniceno++;
      this.hrac.odraz(this.predchozi.skok);
      Zvuky.bum();
      this.vyskakovaciText(nepritel.sprite.x, nepritel.sprite.y - 40, hlaska, '#ffd43b');
      return;
    }
    if (nepritel.nebezpecny) this.zasah('AU!');
  }

  haf(cas) {
    if (cas < this.hafPripravenOd || this.hrac.zmrazeny) return;
    // štěk stojí kyslík, jiný limit nemá: kdo se uštěká, utone
    if (N.KYSLIK.zapnuto) {
      this.kyslik -= N.HAF.kyslik;
      this.vyskakovaciText(this.hrac.x + 50, this.hrac.y - 20, `-${N.HAF.kyslik} O2`, '#74c0fc', 24);
    }
    this.hafPripravenOd = cas + N.HAF.pauza;
    Zvuky.haf();
    this.vyskakovaciText(this.hrac.x, this.hrac.y - 50, 'HAF!', '#ffd43b', 44);
    const kruh = this.add.circle(this.hrac.x, this.hrac.y, N.HAF.dosah).setStrokeStyle(6, 0xffd43b, 0.9).setDepth(4).setScale(0.1);
    this.tweens.add({ targets: kruh, scale: 1, alpha: 0, duration: 380, onComplete: () => kruh.destroy() });
    let zasazeno = false;
    for (const n of this.seznamNepratel) {
      if (!n.zivy) continue;
      const d = Phaser.Math.Distance.Between(this.hrac.x, this.hrac.y, n.sprite.x, n.sprite.y);
      if (d < N.HAF.dosah && n.nebezpecny) {
        n.omrac(N.HAF.omraceni);
        zasazeno = true;
      }
    }
    if (zasazeno) Zvuky.omraceni();
    if (N.KYSLIK.zapnuto && this.kyslik <= 0) this.zasah('Uštěkal se!');
  }

  cil() {
    if (this.hotovo) return;
    this.hotovo = true;
    Zvuky.konec();
    this.hrac.zmraz();
    this.hrac.odpoj(); // obrázek teď řídí animace nástupu
    const cas = Math.round(this.casHry);
    this.tweens.add({
      targets: this.hrac.obrazek, x: this.ponorka.x, y: this.ponorka.y - 60, scale: 0.3, alpha: 0, duration: 600,
      onComplete: () => this.hrac.obrazek.setVisible(false),
    });
    this.cameras.main.stopFollow();
    this.tweens.add({ targets: this.ponorka, x: '+=700', delay: 700, duration: 2200, ease: 'Sine.in' });
    this.time.delayedCall(2600, () => {
      this.cameras.main.fadeOut(400);
      this.time.delayedCall(450, () => this.scene.start('Konec', {
        uroven: this.idUrovne, kosti: this.pocetKosti, celkem: this.celkemKosti, cas, zniceno: this.zniceno,
      }));
    });
  }

  doMenu() {
    this.scene.start('Menu');
  }

  // --- efekty ---

  pridejRasu(x, horniOkraj) {
    const r = this.add.image(x + Phaser.Math.Between(-12, 12), horniOkraj + 4, 'rasa').setOrigin(0.5, 1).setDepth(0);
    this.tweens.add({ targets: r, angle: { from: -7, to: 7 }, duration: 1600 + (x % 5) * 200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  vypustBublinky(x, y, pocet) {
    for (let i = 0; i < pocet; i++) {
      const b = this.add.image(x + Phaser.Math.Between(-14, 14), y, 'bublinka').setDepth(6).setScale(Phaser.Math.FloatBetween(0.5, 1.2));
      this.tweens.add({
        targets: b, y: y - Phaser.Math.Between(50, 110), x: b.x + Phaser.Math.Between(-15, 15), alpha: 0,
        duration: Phaser.Math.Between(500, 900), onComplete: () => b.destroy(),
      });
    }
  }

  rozsypSrouby(x, y) {
    for (let i = 0; i < 8; i++) {
      const sroub = this.add.rectangle(x, y, 6, 6, i % 2 ? 0x8a9bb0 : 0x495057).setDepth(6);
      this.tweens.add({
        targets: sroub,
        x: x + Phaser.Math.Between(-70, 70), y: y + Phaser.Math.Between(-60, 40), angle: Phaser.Math.Between(-360, 360),
        alpha: 0, duration: Phaser.Math.Between(500, 900), onComplete: () => sroub.destroy(),
      });
    }
  }

  vyskakovaciText(x, y, text, barva = '#ffffff', velikost = 34) {
    const t = this.add.text(x, y, text, {
      fontFamily: N.PISMO_NADPIS, fontSize: `${velikost}px`, color: barva, stroke: '#1b1b1b', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, delay: 350, duration: 700, onComplete: () => t.destroy() });
  }
}
