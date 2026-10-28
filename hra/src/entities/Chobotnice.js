// Robo-chobotnice: boss úrovně 2. Řídí ji Čuňas z prosklené kabiny.
// Kolo souboje: 3 údery chapadlem na místo, kde stojí Dog Man (předem varování „!“),
// od 2. kola i inkoustové koule. Pak se unaví: sklopí se a otevře kryt s vypínačem.
// Skok na vypínač = zásah. Po 3 zásazích se rozpadne.
const CHOBOTNICE = {
  odPravehoOkraje: 150, // střed těla je tolik pixelů od pravého okraje arény
  yNahore: 236,        // střed těla, když útočí
  yDole: 352,          // střed těla, když je unavená (vypínač jde dosáhnout)
  vyskaTela: 260,      // výška obrázku těla ve hře
  zivoty: 3,
  // pro každé kolo: varování před úderem, pauza mezi údery, jak dlouho je unavená, inkoust (0 = žádný)
  kola: [
    { varovani: 950, pauza: 1300, unava: 4800, inkoust: 0 },
    { varovani: 800, pauza: 1100, unava: 4000, inkoust: 1700 },
    { varovani: 650, pauza: 950,  unava: 3400, inkoust: 1250 },
  ],
  uderuVKole: 3,
};

class Chobotnice {
  constructor(scene) {
    this.scene = scene;
    this.zivoty = CHOBOTNICE.zivoty;
    this.kolo = 0;
    this.stav = 'ceka';
    this.inkousty = [];
    this.chapadla = [];
    this.y = CHOBOTNICE.yNahore;
    this.x0 = scene.sirkaSveta - CHOBOTNICE.odPravehoOkraje; // střed těla ve světě

    // vizuál v kontejneru, aby se hýbal celý najednou
    const c = scene.add.container(this.x0, this.y).setDepth(3);
    this.kontejner = c;
    const telo = scene.add.image(0, 0, 'chobotnice');
    const m = CHOBOTNICE.vyskaTela / telo.height;
    this.meritko = m;
    telo.setScale(m);
    // visící chapadla (jen ozdoba, pohupují se)
    this.visici = [-86, -28, 28, 86].map((dx, i) => {
      const ch = scene.add.image(dx * m * 1.15, 120 * m, 'chapadlo').setOrigin(0.5, 0).setScale(0.42);
      scene.tweens.add({ targets: ch, angle: { from: -10, to: 10 }, duration: 900 + i * 130, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: i * 200 });
      return ch;
    });
    // kabina s Čuňasem nahoře
    const cunas = scene.add.image(0, -126 * m, 'cunas');
    cunas.setScale(78 / cunas.height);
    this.cunas = cunas;
    const sklo = scene.add.graphics();
    sklo.fillStyle(0xbfe9ff, 0.25).fillCircle(0, -128 * m, 54);
    sklo.lineStyle(7, 0x1b1622).strokeCircle(0, -128 * m, 54);
    sklo.lineStyle(5, 0xffffff, 0.7).beginPath().arc(0, -128 * m, 42, Math.PI * 1.1, Math.PI * 1.45).strokePath();
    // vypínač a kryt (vlevo nahoře na hlavě, kam Dog Man doskočí)
    this.vypinacPozice = { x: -78 * m, y: -96 * m };
    const vypinac = scene.add.image(this.vypinacPozice.x, this.vypinacPozice.y, 'vypinac');
    this.vypinac = vypinac;
    const kryt = scene.add.image(this.vypinacPozice.x - 34, this.vypinacPozice.y + 4, 'kryt').setOrigin(0, 0.5);
    this.kryt = kryt;
    c.add([...this.visici, telo, cunas, sklo, vypinac, kryt]);
    this.telo = telo;

    // neviditelná zeď: tělo chobotnice se nedá projít, ale dá se na něj doskočit
    this.zed = scene.physics.add.staticImage(0, 0, '__WHITE').setVisible(false);
    this.aktualizujZed();
    scene.tweens.add({ targets: c, angle: { from: -1.5, to: 1.5 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  get otevreno() { return this.stav === 'unava'; }

  // svět: kde je vypínač a horní hrana těla
  vypinacSvet() {
    return { x: this.x0 + this.vypinacPozice.x, y: this.kontejner.y + this.vypinacPozice.y };
  }

  aktualizujZed() {
    const horni = this.kontejner.y - 92 * this.meritko;
    const vyska = 600 - horni;
    this.zed.setPosition(this.x0 + 20, horni + vyska / 2).setDisplaySize(250, vyska).refreshBody();
  }

  start() {
    this.dalsiKolo(0);
  }

  dalsiKolo(kolo) {
    this.kolo = kolo;
    this.utoc();
  }

  get nastaveni() { return CHOBOTNICE.kola[Math.min(this.kolo, CHOBOTNICE.kola.length - 1)]; }

  // --- útok: 3 údery chapadlem, mezitím inkoust ---
  utoc() {
    this.stav = 'utok';
    this.uderu = 0;
    this.dalsiUder = this.scene.time.now + 700;
    this.dalsiInkoust = this.scene.time.now + 1200;
  }

  update(cas, hrac) {
    if (this.stav === 'konec') return;
    this.aktualizujZed();
    if (this.stav === 'utok') {
      if (cas >= this.dalsiUder && this.chapadla.length === 0) {
        if (this.uderu < CHOBOTNICE.uderuVKole) {
          this.uder(hrac.x);
          this.uderu++;
          this.dalsiUder = cas + this.nastaveni.varovani + 700 + this.nastaveni.pauza;
        } else {
          this.unav();
        }
      }
      if (this.nastaveni.inkoust && cas >= this.dalsiInkoust) {
        this.vystrelInkoust();
        this.dalsiInkoust = cas + this.nastaveni.inkoust;
      }
    }
    if (this.stav === 'unava' && cas >= this.konecUnavy) this.probudSe();

    // inkoustové koule letí doleva
    for (const k of this.inkousty) {
      k.x -= (k.rychlost * this.scene.game.loop.delta) / 1000;
      k.rotation -= 0.08;
    }
    this.inkousty = this.inkousty.filter((k) => (k.x > -60 ? true : (k.destroy(), false)));
  }

  // úder: varování na dně, pak chapadlo shora
  uder(cilX) {
    const s = this.scene;
    const x = Phaser.Math.Clamp(cilX, 50, this.x0 - 160);
    const podlaha = s.vyskaPodlahy;
    const stin = s.add.ellipse(x, podlaha - 2, 90, 18, 0xff3b3b, 0.5).setDepth(2);
    const vykricnik = s.add.text(x, podlaha - 120, '!', {
      fontFamily: N.PISMO_NADPIS, fontSize: '64px', color: '#ff6b6b', stroke: '#1b1622', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(40);
    s.tweens.add({ targets: [stin, vykricnik], alpha: 0.3, duration: 150, yoyo: true, repeat: -1 });
    const ch = s.add.image(x, -30, 'chapadlo').setOrigin(0.5, 1).setDepth(4);
    const uder = { x, ch, stin, vykricnik, nebezpecne: false, zruseno: false };
    this.chapadla.push(uder);
    Zvuky.ton('square', 220, 330, 0.12, 0.05);

    s.time.delayedCall(this.nastaveni.varovani, () => {
      if (uder.zruseno) return;
      stin.destroy(); vykricnik.destroy();
      s.tweens.add({
        targets: ch, y: podlaha + 6, duration: 170, ease: 'Quad.in',
        onComplete: () => {
          if (uder.zruseno) return;
          uder.nebezpecne = true;
          Zvuky.bum();
          s.cameras.main.shake(140, 0.008);
          s.vypustBublinky(x, podlaha - 10, 8);
          s.time.delayedCall(520, () => this.stahniChapadlo(uder));
        },
      });
      s.time.delayedCall(60, () => { if (!uder.zruseno) uder.nebezpecne = true; });
    });
  }

  stahniChapadlo(uder) {
    if (uder.stazeno) return;
    uder.stazeno = true;
    uder.nebezpecne = false;
    if (uder.stin.active) uder.stin.destroy();
    if (uder.vykricnik.active) uder.vykricnik.destroy();
    this.scene.tweens.add({
      targets: uder.ch, y: -40, duration: 380, ease: 'Quad.out',
      onComplete: () => { uder.ch.destroy(); this.chapadla = this.chapadla.filter((u) => u !== uder); },
    });
  }

  // zasahuje chapadlo hráče? (obdélník spodní části chapadla)
  zasahujeChapadlo(telo) {
    return this.chapadla.some((u) => u.nebezpecne && Math.abs(telo.center.x - u.x) < 34 + telo.halfWidth && telo.top < u.ch.y);
  }

  vystrelInkoust() {
    const s = this.scene;
    const nizko = Phaser.Math.Between(0, 1) === 0;
    const y = nizko ? s.vyskaPodlahy - 22 : s.vyskaPodlahy - 112; // nízko = přeskoč, vysoko = nezkákej
    const k = s.add.image(this.x0 - 120, y, 'inkoust').setDepth(5);
    k.rychlost = 290;
    this.inkousty.push(k);
    Zvuky.ton('sine', 500, 160, 0.2, 0.08);
    s.tweens.add({ targets: this.telo, scaleX: this.meritko * 1.06, duration: 90, yoyo: true });
  }

  zasahujeInkoust(telo) {
    const zasazena = this.inkousty.find((k) => Math.abs(k.x - telo.center.x) < 16 + telo.halfWidth && Math.abs(k.y - telo.center.y) < 16 + telo.halfHeight);
    if (zasazena) {
      zasazena.destroy();
      this.inkousty = this.inkousty.filter((k) => k !== zasazena);
    }
    return !!zasazena;
  }

  // štěk zruší blízké chapadlo a rozprskne inkoust
  omracHafem(x, y, dosah) {
    let neco = false;
    for (const u of this.chapadla) {
      if (u.zruseno || Math.abs(u.x - x) > dosah) continue;
      u.zruseno = true;
      neco = true;
      this.scene.vyskakovaciText(u.x, this.scene.vyskaPodlahy - 140, 'BZZT!', '#74c0fc');
      this.stahniChapadlo(u);
    }
    for (const k of this.inkousty) {
      if (Phaser.Math.Distance.Between(k.x, k.y, x, y) < dosah) { k.destroy(); k.prasknuto = true; neco = true; }
    }
    this.inkousty = this.inkousty.filter((k) => !k.prasknuto);
    return neco;
  }

  // --- únava: sklopí se a otevře kryt s vypínačem ---
  unav() {
    this.stav = 'unava';
    const s = this.scene;
    this.konecUnavy = s.time.now + 700 + this.nastaveni.unava;
    s.tweens.add({ targets: this.kontejner, y: CHOBOTNICE.yDole, duration: 600, ease: 'Sine.inOut' });
    s.tweens.add({ targets: this.kryt, angle: -110, duration: 400, delay: 500 });
    this.zareni = s.tweens.add({ targets: this.vypinac, scale: 1.25, duration: 300, yoyo: true, repeat: -1, delay: 600 });
    this.telo.setTint(0xd0bfff);
    s.time.delayedCall(450, () => s.vyskakovaciText(this.x0 - 150, CHOBOTNICE.yDole - 130, 'VYPÍNAČ!', '#ffd43b', 40));
    s.cunasRekne(Phaser.Utils.Array.GetRandom(['Ne! Kryt se otevřel!', 'Uf, chobotnice se unavila…', 'Bobánku, zavři ten kryt!']));
  }

  zavriKryt() {
    if (this.zareni) { this.zareni.stop(); this.vypinac.setScale(1); }
    this.scene.tweens.add({ targets: this.kryt, angle: 0, duration: 250 });
    this.telo.clearTint();
  }

  probudSe() {
    this.stav = 'probouzi';
    const s = this.scene;
    this.zavriKryt();
    s.odhodHraceZHlavy();
    s.tweens.add({ targets: this.kontejner, y: CHOBOTNICE.yNahore, duration: 600, ease: 'Sine.inOut', onComplete: () => this.utoc() });
    s.cunasRekne(Phaser.Utils.Array.GetRandom(['Chi chi! Zkus to znovu!', 'Moc pomalý, pejsku!']));
  }

  // Dog Man skočil na vypínač
  zasah() {
    if (this.stav !== 'unava') return false;
    this.stav = 'zasah';
    const s = this.scene;
    this.zivoty--;
    const v = this.vypinacSvet();
    this.zavriKryt();
    s.rozsypSrouby(v.x, v.y, 14, 110);
    this.telo.setTint(0xff6b6b);
    s.tweens.add({ targets: this.kontejner, x: this.x0 + 14, duration: 60, yoyo: true, repeat: 5, onComplete: () => this.telo.clearTint() });
    if (this.zivoty <= 0) {
      s.time.delayedCall(500, () => this.rozpadniSe());
      return true;
    }
    s.cunasRekne(Phaser.Utils.Array.GetRandom(['Au! Moje chobotnice!', 'To bolelo! Teď se zlobím!']));
    s.time.delayedCall(900, () => {
      s.tweens.add({ targets: this.kontejner, y: CHOBOTNICE.yNahore, duration: 600, ease: 'Sine.inOut', onComplete: () => this.dalsiKolo(this.kolo + 1) });
    });
    return true;
  }

  rozpadniSe() {
    this.stav = 'konec';
    const s = this.scene;
    for (const u of this.chapadla) { u.zruseno = true; this.stahniChapadlo(u); }
    this.inkousty.forEach((k) => k.destroy());
    this.inkousty = [];
    Zvuky.konec();
    s.cameras.main.shake(700, 0.012);
    for (let i = 0; i < 5; i++) {
      s.time.delayedCall(i * 140, () => {
        Zvuky.bum();
        s.rozsypSrouby(this.x0 + Phaser.Math.Between(-100, 100), this.kontejner.y + Phaser.Math.Between(-80, 80), 16, 140);
      });
    }
    // kabina s Čuňasem odletí, zbytek se rozsype a klesne
    const kabina = s.add.container(this.x0, this.kontejner.y - 128 * this.meritko).setDepth(8);
    this.cunas.setPosition(0, 2);
    this.kontejner.remove(this.cunas);
    const sklo = s.add.graphics();
    sklo.fillStyle(0xbfe9ff, 0.25).fillCircle(0, 0, 54).lineStyle(7, 0x1b1622).strokeCircle(0, 0, 54);
    kabina.add([this.cunas, sklo]);
    s.tweens.add({ targets: kabina, y: -150, x: this.x0 + 160, angle: 40, duration: 1800, delay: 500, ease: 'Quad.in' });
    s.time.delayedCall(450, () => s.cunasRekne('Já se vrátím!!!', kabina.x - 40, kabina.y - 80));
    s.tweens.add({ targets: this.kontejner, y: 700, alpha: 0, angle: 25, duration: 1600, delay: 400, ease: 'Quad.in' });
    this.zed.destroy();
  }
}
