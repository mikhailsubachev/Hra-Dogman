// Úroveň 5: souboj s Robo-žralokem v Čuňasově hangáru.
// Po aréně jsou tři čudlíky. Když na čudlíku Dog Man stojí, bublinomet střílí
// bubliny na žraloka. Po pár bublinách se čudlík vybije a chvíli se dobíjí.
class ZralokScena extends HerniScena {
  constructor() { super('Zralok'); }

  init() {
    this.idUrovne = 'zralok';
  }

  create() {
    const uroven = UROVNE.zralok;
    // na širší obrazovce prodloužit arénu doleva o kus dna
    let mapa = nactiMapu(uroven.mapa);
    const navic = Math.max(0, Math.ceil((N.SIRKA - mapa[0].length * N.DLAZDICE) / N.DLAZDICE));
    mapa = mapa.map((r) => (r.split('').every((z) => z === '#') ? '#' : '.').repeat(navic) + r);
    const T = N.DLAZDICE;
    this.sirkaSveta = mapa[0].length * T;
    this.vyskaSveta = mapa.length * T;
    this.vyskaPodlahy = (mapa.findIndex((r) => r.split('').every((z) => z === '#'))) * T || this.vyskaSveta - 2 * T;

    this.physics.world.gravity.y = N.GRAVITACE;
    this.physics.world.setBounds(0, 0, this.sirkaSveta, this.vyskaSveta);
    this.cameras.main.setBounds(0, 0, this.sirkaSveta, this.vyskaSveta);

    Textury.hangar(this);
    Textury.bublinky(this);

    const data = mapa.map((radek, r) => [...radek].map((znak, s) => {
      if (znak !== '#') return -1;
      return r === 0 || mapa[r - 1][s] !== '#' ? 0 : 1;
    }));
    const tilemapa = this.make.tilemap({ data, tileWidth: T, tileHeight: T });
    this.dlazdice = tilemapa.createLayer(0, tilemapa.addTilesetImage('sada_kov', 'sada_kov', T, T, 0, 0), 0, 0).setDepth(1);
    this.dlazdice.setCollision([0, 1]);

    let start = { x: 2 * T, y: 9 * T };
    this.pruduchy = [];
    this.cudliky = [];
    mapa.forEach((radek, r) => [...radek].forEach((znak, s) => {
      const x = s * T + T / 2;
      if (znak === 'S') start = { x, y: r * T + T / 2 };
      if (znak === 'V') {
        this.add.image(x, (r + 1) * T - 4, 'pruduch').setDepth(2);
        this.pruduchy.push({ x, y: (r + 1) * T - 10 });
      }
      if (znak === 'C') this.pridejCudlik(x, (r + 1) * T);
    }));

    this.kysliky = this.physics.add.group({ allowGravity: false });
    this.nepratele = this.physics.add.group({ allowGravity: false });
    this.mali = [];
    this.strely = [];
    this.cunasMluviDo = 0;
    this.pripravHrace(start, { boss: 'ROBO-ŽRALOK', zivoty: ZRALOK.zivoty });
    this.physics.add.collider(this.hrac.telo, this.dlazdice);
    this.physics.add.overlap(this.hrac.telo, this.kysliky, (h, o) => this.seberKyslik(o));
    this.physics.add.overlap(this.hrac.telo, this.nepratele, (h, s) => this.dotekNepritele(s.nepritel));

    this.boss = new Zralok(this);

    this.cameras.main.startFollow(this.hrac.telo, true, 0.12, 0.12);
    this.cameras.main.fadeIn(400);
    this.ukazNazev(uroven.nazev);

    this.time.addEvent({ delay: 6500, loop: true, startAt: 3500, callback: () => this.vypustKyslik() });
    this.time.delayedCall(2200, () => {
      this.cunasRekne('Chi chi! Můj Robo-žralok tě sní i se skafandrem!', undefined, undefined, true);
      this.boss.start();
    });
    this.time.delayedCall(4800, () => this.vyskakovaciText(this.cudliky[0].x, this.cudliky[0].y - 70, 'Stoupni si na čudlík!', '#ffd43b', 30));
    if (PARAMETRY.get('debug') === '1') this.physics.world.createDebugGraphic();
  }

  // čudlík bublinometu stojí na políčku; y = horní hrana políčka
  pridejCudlik(x, y) {
    const obr = this.add.image(x, y, 'cudlik').setOrigin(0.5, 1).setDepth(2);
    const ukazatel = this.add.graphics().setDepth(2);
    this.cudliky.push({ x, y, obr, ukazatel, naboje: N.CUDLIK.naboje, dobitoV: 0, dalsiVystrel: 0, stisknuty: false });
  }

  update(cas, delta) {
    if (!this.zakladniUpdate(cas, delta)) return;
    this.boss.update(cas, this.hrac);
    const telo = this.hrac.telo.body;

    this.aktualizujCudliky(cas, telo);
    this.aktualizujStrely(delta);
    for (const m of this.mali) if (m.zivy) m.update(cas, this.hrac);
    this.mali = this.mali.filter((m) => m.zivy);
    if (!this.hrac.zmrazeny && !this.hotovo && this.boss.stav !== 'konec' && this.boss.dotykaTela(telo)) this.zasah('KOUS!');

    for (const o of this.kysliky.getChildren()) if (o.y < 70) o.destroy();
    this.ukazatele.update(0, this.kyslik, this.casHry);
  }

  // stojí Dog Man na čudlíku? Pak bublinomet střílí, dokud má náboje.
  aktualizujCudliky(cas, telo) {
    const naZemi = telo.blocked.down || telo.touching.down;
    for (const c of this.cudliky) {
      if (!c.naboje && cas >= c.dobitoV) {
        c.naboje = N.CUDLIK.naboje;
        c.obr.setTexture('cudlik');
        this.vyskakovaciText(c.x, c.y - 60, 'Nabito!', '#8ce99a', 26);
      }
      const stoji = naZemi && !this.hrac.zmrazeny && Math.abs(telo.center.x - c.x) < 30 && Math.abs(telo.bottom - c.y) < 8;
      if (stoji !== c.stisknuty) {
        c.stisknuty = stoji;
        c.obr.setScale(1, stoji ? 0.6 : 1);
        if (stoji) { Zvuky.klik(); c.dalsiVystrel = Math.max(c.dalsiVystrel, cas + 150); }
      }
      if (stoji && c.naboje && cas >= c.dalsiVystrel && !this.hotovo && this.boss.stav !== 'ceka') {
        c.dalsiVystrel = cas + N.CUDLIK.pauza;
        this.vystrel(c);
        c.naboje--;
        if (!c.naboje) {
          c.dobitoV = cas + N.CUDLIK.dobiti;
          c.obr.setTexture('cudlik_prazdny');
          this.vyskakovaciText(c.x, c.y - 60, 'Prázdný! Jiný čudlík!', '#ff8787', 26);
        }
      }
      // tečky nad čudlíkem: kolik bublin ještě má
      c.ukazatel.clear();
      for (let i = 0; i < N.CUDLIK.naboje; i++) {
        c.ukazatel.fillStyle(i < c.naboje ? 0x9be7ff : 0x343a40).fillCircle(c.x - (N.CUDLIK.naboje - 1) * 6 + i * 12, c.y - 48, 4);
      }
    }
  }

  // bublina letí z čudlíku na žraloka (míří tam, kde žralok je teď, takže se dá i minout)
  vystrel(c) {
    const cil = this.boss.casti()[0];
    const x = c.x;
    const y = c.y - 60;
    const u = Phaser.Math.Angle.Between(x, y, cil.x, cil.y);
    const b = this.add.image(x, y, 'strela').setDepth(6).setScale(0.5);
    this.tweens.add({ targets: b, scale: 1, duration: 150 });
    b.vx = Math.cos(u) * N.CUDLIK.rychlost;
    b.vy = Math.sin(u) * N.CUDLIK.rychlost;
    b.zivotnost = 2500;
    this.strely.push(b);
    Zvuky.ton('sine', 300, 700, 0.12, 0.06);
  }

  aktualizujStrely(delta) {
    for (const b of this.strely) {
      b.x += (b.vx * delta) / 1000;
      b.y += (b.vy * delta) / 1000;
      b.zivotnost -= delta;
      if (this.boss.stav !== 'konec' && this.boss.dotyka(b.x, b.y, 12)) {
        b.prasknuto = true;
        this.vypustBublinky(b.x, b.y, 8);
        if (this.boss.zasah()) this.zasahZraloka(b.x, b.y);
      }
    }
    this.strely = this.strely.filter((b) => (b.zivotnost > 0 && !b.prasknuto && b.y > -40 ? true : (b.destroy(), false)));
  }

  zasahZraloka(x, y) {
    Zvuky.bum();
    this.rozsypSrouby(x, y, 10, 90);
    this.vyskakovaciText(x, y - 30, 'BLUB! ZÁSAH!', '#ffd43b', 38);
    this.ukazatele.zivotyBosse(this.boss.zivoty);
    if (this.boss.zivoty <= 0) this.vyhra();
  }

  pocetMalych() { return this.mali.filter((m) => m.zivy).length; }

  vypustMalehoZraloka(x, y, smer) {
    const x0 = Phaser.Math.Clamp(x, 60, this.sirkaSveta - 60);
    this.mali.push(new MalyZralok(this, x0, y, smer));
    this.vypustBublinky(x0, y, 6);
    Zvuky.ton('square', 600, 300, 0.15, 0.04);
  }

  // štěk zničí malé žraloky v dosahu
  omracHafem() {
    let neco = false;
    for (const m of this.mali) {
      if (!m.zivy) continue;
      if (Phaser.Math.Distance.Between(this.hrac.x, this.hrac.y, m.sprite.x, m.sprite.y) < N.HAF.dosah) {
        this.rozsypSrouby(m.sprite.x, m.sprite.y);
        this.vyskakovaciText(m.sprite.x, m.sprite.y - 30, 'KRACH!', '#ffd43b');
        m.znic();
        this.zniceno++;
        neco = true;
      }
    }
    return neco;
  }

  vypustKyslik() {
    if (this.hotovo || !this.pruduchy.length) return;
    const p = Phaser.Utils.Array.GetRandom(this.pruduchy);
    const o = this.kysliky.create(p.x, p.y - 10, 'kyslik').setDepth(2);
    o.body.setAllowGravity(false);
    o.setVelocityY(-55);
    this.tweens.add({ targets: o, scale: 1.15, duration: 600, yoyo: true, repeat: -1 });
    this.vypustBublinky(p.x, p.y, 5);
  }

  // Čuňas mluví nejvýš jednou za dvě vteřiny, ať se bubliny nepřekrývají (dulezite = vždy)
  cunasRekne(text, x, y, dulezite = false) {
    if (!dulezite && this.time.now < (this.cunasMluviDo || 0)) return;
    this.cunasMluviDo = this.time.now + 2000;
    const b = this.boss;
    this.rekni(x || Phaser.Math.Clamp(b ? b.x : 300, 150, this.sirkaSveta - 150), y || Math.max(110, (b ? b.y : 150) - 80), text, '#c92a2a');
  }

  vyhra() {
    this.hotovo = true;
    this.hrac.nezranitelnyDo = Infinity;
    for (const m of this.mali) if (m.zivy) { this.rozsypSrouby(m.sprite.x, m.sprite.y); m.znic(); }
    this.time.delayedCall(3600, () => this.dokonceno({ celkem: undefined, kosti: 0 }));
  }
}
