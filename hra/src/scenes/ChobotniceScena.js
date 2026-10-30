// Úroveň 2: souboj s Robo-chobotnicí v Čuňasově podmořské základně.
class ChobotniceScena extends HerniScena {
  constructor() { super('Chobotnice'); }

  init() {
    this.idUrovne = 'chobotnice';
  }

  create() {
    const uroven = UROVNE.chobotnice;
    // na širší obrazovce se aréna rozloží do celé šířky (plošiny a mezery se rozšíří);
    // posledních 6 sloupců u chobotnice zůstane, ať jde na vypínač doskočit stejně jako dřív
    const puvodni = nactiMapu(uroven.mapa);
    const vlevo = roztahniMapu(puvodni.map((r) => r.slice(0, -6)), Math.ceil(N.SIRKA / N.DLAZDICE) - 6);
    const mapa = vlevo.map((r, i) => r + puvodni[i].slice(-6));
    const T = N.DLAZDICE;
    this.sirkaSveta = mapa[0].length * T;
    this.vyskaSveta = mapa.length * T;
    this.vyskaPodlahy = (mapa.findIndex((r) => r.split('').every((z) => z === '#'))) * T || this.vyskaSveta - 2 * T;

    this.physics.world.gravity.y = N.GRAVITACE;
    this.physics.world.setBounds(0, 0, this.sirkaSveta, this.vyskaSveta);
    this.cameras.main.setBounds(0, 0, this.sirkaSveta, this.vyskaSveta);

    Textury.voda(this);
    Textury.bublinky(this);
    // tmavší voda hluboko v základně
    this.add.rectangle(0, 0, 1400, N.VYSKA, 0x0b1a3a, 0.35).setOrigin(0).setScrollFactor(0).setDepth(-15);

    const data = mapa.map((radek, r) => [...radek].map((znak, s) => {
      if (znak !== '#') return -1;
      return r === 0 || mapa[r - 1][s] !== '#' ? 0 : 1;
    }));
    const tilemapa = this.make.tilemap({ data, tileWidth: T, tileHeight: T });
    this.dlazdice = tilemapa.createLayer(0, tilemapa.addTilesetImage('sada_dna', 'sada_dna', T, T, 0, 0), 0, 0).setDepth(1);
    this.dlazdice.setCollision([0, 1]);

    let start = { x: 5 * T, y: 9 * T };
    this.pruduchy = [];
    let bobanekPozice = null;
    mapa.forEach((radek, r) => [...radek].forEach((znak, s) => {
      const x = s * T + T / 2;
      if (znak === 'S') start = { x, y: r * T + T / 2 };
      if (znak === 'V') {
        this.add.image(x, (r + 1) * T - 4, 'pruduch').setDepth(2);
        this.pruduchy.push({ x, y: (r + 1) * T - 10 });
      }
      if (znak === 'B') bobanekPozice = { x, y: (r + 1) * T };
    }));

    this.kysliky = this.physics.add.group({ allowGravity: false });
    this.pripravHrace(start, { boss: t('boss_chobotnice'), zivoty: CHOBOTNICE.zivoty });
    this.physics.add.collider(this.hrac.telo, this.dlazdice);
    this.physics.add.overlap(this.hrac.telo, this.kysliky, (h, o) => this.seberKyslik(o));

    // Bobánek: fandí šéfovi, ve 3. kole hází klíče
    if (bobanekPozice) {
      this.bobanek = this.add.image(bobanekPozice.x, bobanekPozice.y + 4, 'bobanek').setOrigin(0.5, 1).setDepth(3);
      this.bobanek.setScale(84 / this.bobanek.height);
      this.tweens.add({ targets: this.bobanek, y: '-=8', duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.bobanekOmracenDo = 0;
      this.dalsiKlic = 0;
      this.klice = [];
    }

    this.boss = new Chobotnice(this);
    this.physics.add.collider(this.hrac.telo, this.boss.zed);

    this.cameras.main.startFollow(this.hrac.telo, true, 0.12, 0.12);
    this.cameras.main.fadeIn(400);
    this.ukazNazev(t('uroven_chobotnice_titulek'));

    // bubliny kyslíku z průduchů
    this.time.addEvent({ delay: 6500, loop: true, startAt: 3500, callback: () => this.vypustKyslik() });
    // souboj začne po krátké chvilce
    this.time.delayedCall(2200, () => {
      this.cunasRekne(t('cunas_chobotnice_start'));
      this.boss.start();
    });
    if (PARAMETRY.get('debug') === '1') this.physics.world.createDebugGraphic();
  }

  update(cas, delta) {
    if (!this.zakladniUpdate(cas, delta)) return;
    this.boss.update(cas, this.hrac);
    const telo = this.hrac.telo.body;

    if (!this.hrac.zmrazeny && !this.hotovo) {
      // skok na vypínač
      if (this.boss.otevreno && telo.velocity.y > 0) {
        const v = this.boss.vypinacSvet();
        if (Math.abs(telo.center.x - v.x) < 42 + telo.halfWidth && telo.bottom > v.y - 22 && telo.bottom < v.y + 26) this.zasahVypinace();
      }
      // na hlavě se během útoku stát nedá, chobotnice Dog Mana setřese
      if (this.boss.stav !== 'unava' && this.boss.stav !== 'konec' && this.naHlaveChobotnice()) this.odhodHraceZHlavy();
      if (this.boss.zasahujeChapadlo(telo)) this.zasah(t('au_chapadlo'));
      if (this.boss.zasahujeInkoust(telo)) this.zasah(t('fuj_inkoust'));
      this.aktualizujKlice(cas, telo);
    }
    // bubliny kyslíku stoupají a nahoře prasknou
    for (const o of this.kysliky.getChildren()) if (o.y < 70) o.destroy();

    this.ukazatele.update(0, this.kyslik, this.casHry);
  }

  zasahVypinace() {
    if (!this.boss.zasah()) return;
    Zvuky.bum();
    this.vyskakovaciText(this.hrac.x, this.hrac.y - 60, t('klik_zasah'), '#ffd43b', 40);
    this.ukazatele.zivotyBosse(this.boss.zivoty);
    // Dog Man se odrazí rovně nahoru a může na vypínač dopadnout znovu
    this.hrac.odraz(true);
    this.hrac.nezranitelnyDo = this.time.now + 1200;
    if (this.boss.zivoty <= 0) this.vyhra();
    else if (this.bobanek) this.time.delayedCall(700, () => this.bobanekRekne(t('bobanek_spravim')));
  }

  // stojí Dog Man na hlavě chobotnice?
  naHlaveChobotnice() {
    const telo = this.hrac.telo.body;
    return telo.center.x > this.boss.x0 - 170 && telo.bottom < this.vyskaPodlahy - 60 && (telo.blocked.down || telo.touching.down);
  }

  // když se chobotnice probudí (nebo útočí) a Dog Man stojí na její hlavě, shodí ho daleko doleva
  odhodHraceZHlavy() {
    const telo = this.hrac.telo.body;
    if (telo.center.x > this.boss.x0 - 170 && telo.bottom < this.vyskaPodlahy - 60) {
      this.hrac.odhod(-430, -380);
      this.vyskakovaciText(this.hrac.x, this.hrac.y - 50, t('boing'), '#ffd43b');
    }
  }

  omracHafem() {
    let neco = this.boss.omracHafem(this.hrac.x, this.hrac.y, N.HAF.dosah);
    if (this.bobanek && Phaser.Math.Distance.Between(this.hrac.x, this.hrac.y, this.bobanek.x, this.bobanek.y - 40) < N.HAF.dosah) {
      this.bobanekOmracenDo = this.time.now + N.HAF.omraceni;
      this.bobanek.setTint(0x99ddff);
      this.time.delayedCall(N.HAF.omraceni, () => this.bobanek && this.bobanek.clearTint());
      this.bobanekRekne(t('ouvej'));
      neco = true;
    }
    return neco;
  }

  // --- Bobánek hází klíče (od 3. kola) ---
  aktualizujKlice(cas, telo) {
    if (!this.bobanek) return;
    if (this.boss.kolo >= 2 && this.boss.stav === 'utok' && cas > this.dalsiKlic && cas > this.bobanekOmracenDo) {
      this.dalsiKlic = cas + 2600;
      const k = this.add.image(this.bobanek.x + 20, this.bobanek.y - 60, 'klic').setDepth(5);
      // nešikovný: míří na Dog Mana, ale ne moc přesně
      const cilX = this.hrac.x + Phaser.Math.Between(-90, 90);
      k.vx = (cilX - k.x) / 1.2;
      k.vy = -360;
      this.klice.push(k);
      if (Math.random() < 0.4) this.bobanekRekne(t('bobanek_chytej'));
    }
    const dt = this.game.loop.delta / 1000;
    for (const k of this.klice) {
      k.vy += 600 * dt;
      k.x += k.vx * dt;
      k.y += k.vy * dt;
      k.rotation += 0.25;
      if (Math.abs(k.x - telo.center.x) < 14 + telo.halfWidth && Math.abs(k.y - telo.center.y) < 10 + telo.halfHeight) {
        k.zasah = true;
        this.zasah(t('au_klic'));
      }
    }
    this.klice = this.klice.filter((k) => (k.y < this.vyskaPodlahy && !k.zasah ? true : (k.destroy(), false)));
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

  // --- řeči ---
  cunasRekne(text, x, y) {
    const k = this.boss ? this.boss.kontejner : null;
    const bx = this.boss ? this.boss.x0 : this.sirkaSveta - 150;
    this.rekni(x || bx - 210, y || (k ? k.y - 60 : 200), text, '#c92a2a');
  }

  bobanekRekne(text) {
    if (this.bobanek) this.rekni(this.bobanek.x + 30, this.bobanek.y - 90, text, '#2b8a3e');
  }

  vyhra() {
    this.hotovo = true;
    this.hrac.nezranitelnyDo = Infinity;
    if (this.bobanek) {
      this.time.delayedCall(1600, () => {
        this.bobanekRekne(t('bobanek_pockej'));
        this.tweens.add({ targets: this.bobanek, x: -120, duration: 1800, delay: 400, ease: 'Quad.in' });
      });
    }
    this.time.delayedCall(3600, () => this.dokonceno({ celkem: undefined, kosti: 0 }));
  }
}
