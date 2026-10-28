// Skákací část mise: Dog Man pod vodou.
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

  cil() {
    if (this.hotovo) return;
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

  // --- efekty ---

  pridejRasu(x, horniOkraj) {
    const r = this.add.image(x + Phaser.Math.Between(-12, 12), horniOkraj + 4, 'rasa').setOrigin(0.5, 1).setDepth(0);
    this.tweens.add({ targets: r, angle: { from: -7, to: 7 }, duration: 1600 + (x % 5) * 200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }
}
