// Robo-žralok: boss úrovně 5. Řídí ho Čuňas z kabiny na hřbetě.
// Plave sem a tam po aréně a vypouští malé žraloky, kteří honí Dog Mana.
// Zranit ho jdou jen bubliny z čudlíků. Čím méně životů má, tím je rychlejší,
// vypouští víc malých žraloků a od 2. kola dělá výpady na Dog Mana (předem varování „!“).
const ZRALOK = {
  sirka: 330,          // šířka obrázku ve hře
  zivoty: 12,
  nezranitelnost: 900, // po zásahu bublinou chvíli nic necítí
  // kolo podle zbylých životů (každé 4 zásahy přidá): rychlost plavání, kolik malých žraloků najednou, jak často vypouští, výpad (0 = žádný)
  kola: [
    { rychlost: 110, maliMax: 1, maliPauza: 5500, vypad: 0 },
    { rychlost: 135, maliMax: 2, maliPauza: 4500, vypad: 7500 },
    { rychlost: 160, maliMax: 3, maliPauza: 3500, vypad: 5500 },
  ],
  vyskaPlavani: [100, 210], // mezi jakými výškami normálně plave (střed těla)
  rychlostVypadu: 430,
};

class Zralok {
  constructor(scene) {
    this.scene = scene;
    this.zivoty = ZRALOK.zivoty;
    this.stav = 'ceka';
    this.smer = -1; // -1 = plave doleva
    this.x = scene.sirkaSveta - 220;
    this.y = 150;
    this.nezranitelnyDo = 0;
    this.dalsiMaly = 0;
    this.dalsiVypad = 0;
    this.vyskaCile = 150;

    this.obr = scene.add.image(this.x, this.y, 'zralok').setDepth(3);
    this.meritko = ZRALOK.sirka / this.obr.width;
    this.obr.setScale(this.meritko);
  }

  get kolo() {
    const ztraceno = ZRALOK.zivoty - this.zivoty;
    return Math.min(ZRALOK.kola.length - 1, Math.floor(ztraceno / 4));
  }

  get nastaveni() { return ZRALOK.kola[this.kolo]; }

  get zranitelny() { return this.stav !== 'ceka' && this.stav !== 'konec' && this.scene.time.now >= this.nezranitelnyDo; }

  start() {
    this.stav = 'plave';
    this.dalsiMaly = this.scene.time.now + 2500;
    this.dalsiVypad = this.scene.time.now + 6000;
  }

  // obdélníky, které se počítají jako žralok: trup a kabina (obrázek se dívá doprava)
  casti() {
    const k = ZRALOK.sirka / 330; // čísla jsou pro šířku 330
    const s = this.smer; // otočený doleva = zrcadlově
    return [
      { x: this.x + 38 * k * s, y: this.y + 4 * k, sx: 124 * k, sy: 30 * k },
      { x: this.x + 73 * k * s, y: this.y - 46 * k, sx: 16 * k, sy: 24 * k },
    ];
  }

  // dotýká se něco o poloměru r v bodě (x, y)?
  dotyka(x, y, r = 0) {
    return this.casti().some((c) => Math.abs(x - c.x) < c.sx + r && Math.abs(y - c.y) < c.sy + r);
  }

  // dotýká se tělo Dog Mana?
  dotykaTela(telo) {
    return this.casti().some((c) => Math.abs(telo.center.x - c.x) < c.sx + telo.halfWidth - 6 && Math.abs(telo.center.y - c.y) < c.sy + telo.halfHeight - 6);
  }

  // kde je tlama (odtud vyplouvají malí žraloci)
  tlama() {
    return { x: this.x + 150 * (ZRALOK.sirka / 330) * (this.smer > 0 ? 1 : -1), y: this.y + 20 };
  }

  update(cas, hrac) {
    if (this.stav === 'konec' || this.stav === 'ceka') return;
    const s = this.scene;
    const dt = s.game.loop.delta / 1000;
    const kraj = 140;

    if (this.stav === 'plave') {
      this.x += this.smer * this.nastaveni.rychlost * dt;
      if (this.x < kraj) this.otoc(1);
      if (this.x > s.sirkaSveta - kraj) this.otoc(-1);
      // vlní se nahoru a dolů, občas si vybere jinou výšku
      if (Math.abs(this.y - this.vyskaCile) < 4) this.vyskaCile = Phaser.Math.Between(...ZRALOK.vyskaPlavani);
      this.y += Math.sign(this.vyskaCile - this.y) * 40 * dt;
      this.obr.angle = Math.sin(cas * 0.004) * 3;

      if (cas > this.dalsiMaly && s.pocetMalych() < this.nastaveni.maliMax) {
        this.dalsiMaly = cas + this.nastaveni.maliPauza;
        const t = this.tlama();
        s.vypustMalehoZraloka(t.x, t.y, this.smer);
      }
      if (this.nastaveni.vypad && cas > this.dalsiVypad && !hrac.zmrazeny) this.varuj(hrac);
    } else if (this.stav === 'vypad') {
      this.x += this.smer * ZRALOK.rychlostVypadu * dt;
      if (this.x < kraj || this.x > s.sirkaSveta - kraj) this.vratSe();
    }

    this.obr.setPosition(this.x, this.y + Math.sin(cas * 0.003) * 4);
    this.obr.setFlipX(this.smer < 0);
  }

  otoc(smer) {
    this.smer = smer;
    this.scene.tweens.add({ targets: this.obr, scaleX: { from: this.meritko * 0.6, to: this.meritko }, duration: 250 });
  }

  // varování před výpadem: otočí se k Dog Manovi, sjede do jeho výšky a zčervená mu oko
  varuj(hrac) {
    const s = this.scene;
    this.stav = 'varuje';
    this.smer = hrac.x < this.x ? -1 : 1;
    const cilY = Phaser.Math.Clamp(hrac.y, ZRALOK.vyskaPlavani[0], s.vyskaPodlahy - 40);
    const vykricnik = s.add.text(this.x, this.y - 110, '!', {
      fontFamily: N.PISMO_NADPIS, fontSize: '72px', color: '#ff6b6b', stroke: '#1b1622', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(40);
    s.tweens.add({ targets: vykricnik, alpha: 0.3, duration: 150, yoyo: true, repeat: 4, onComplete: () => vykricnik.destroy() });
    this.obr.setTint(0xff9a9a);
    Zvuky.ton('square', 180, 120, 0.3, 0.06);
    s.tweens.add({ targets: this, y: cilY, duration: 900, ease: 'Sine.inOut' });
    s.time.delayedCall(1000, () => {
      if (this.stav !== 'varuje') return;
      this.stav = 'vypad';
      this.obr.clearTint();
      s.cunasRekne(Phaser.Utils.Array.GetRandom(['Kousni ho!', 'Plnou parou vpřed!', 'Chi chi! Ham!']));
    });
  }

  vratSe() {
    this.stav = 'navrat';
    this.x = Phaser.Math.Clamp(this.x, 140, this.scene.sirkaSveta - 140);
    this.otoc(-this.smer);
    this.dalsiVypad = this.scene.time.now + this.nastaveni.vypad;
    this.scene.tweens.add({
      targets: this, y: 150, duration: 900, ease: 'Sine.inOut',
      onComplete: () => { if (this.stav === 'navrat') this.stav = 'plave'; },
    });
  }

  // zásah bublinou; vrací true, když se počítal
  zasah() {
    if (!this.zranitelny) return false;
    const s = this.scene;
    this.zivoty--;
    this.nezranitelnyDo = s.time.now + ZRALOK.nezranitelnost;
    this.obr.setTint(0xff6b6b);
    s.tweens.add({ targets: this.obr, alpha: 0.5, duration: 90, yoyo: true, repeat: 3, onComplete: () => { this.obr.clearTint(); this.obr.setAlpha(1); } });
    if (this.zivoty <= 0) {
      this.rozpadniSe();
      return true;
    }
    if (this.zivoty % 4 === 0) s.cunasRekne('Grrr! Teď přidám!', undefined, undefined, true);
    else s.cunasRekne(Phaser.Utils.Array.GetRandom(['Au! Moje ploutev!', 'Nech ty čudlíky!', 'Bublinky ne!', 'Au au au!']));
    return true;
  }

  rozpadniSe() {
    this.stav = 'konec';
    const s = this.scene;
    Zvuky.konec();
    s.cameras.main.shake(700, 0.012);
    for (let i = 0; i < 5; i++) {
      s.time.delayedCall(i * 140, () => {
        Zvuky.bum();
        s.rozsypSrouby(this.x + Phaser.Math.Between(-120, 120), this.y + Phaser.Math.Between(-30, 30), 16, 140);
      });
    }
    // Čuňas v kabině odletí, žralok se rozsype a klesne ke dnu
    const k = ZRALOK.sirka / 330;
    const kabina = s.add.container(this.x + 73 * k * (this.smer > 0 ? 1 : -1), this.y - 50 * k).setDepth(8);
    const cunas = s.add.image(0, 2, 'cunas');
    cunas.setScale(60 / cunas.height);
    const sklo = s.add.graphics();
    sklo.fillStyle(0xbfe9ff, 0.25).fillCircle(0, 0, 40).lineStyle(6, 0x1b1622).strokeCircle(0, 0, 40);
    kabina.add([cunas, sklo]);
    s.tweens.add({ targets: kabina, y: -150, x: kabina.x + 160, angle: 40, duration: 1800, delay: 500, ease: 'Quad.in' });
    s.time.delayedCall(450, () => s.cunasRekne('Já se vrátím!!!', kabina.x - 40, kabina.y - 60, true));
    this.obr.setTint(0x777777);
    s.tweens.add({ targets: this.obr, y: s.vyskaPodlahy + 40, angle: 160, alpha: 0, duration: 1800, delay: 400, ease: 'Quad.in' });
  }
}

// Malý robo-žralok: vyplave z tlamy velkého a honí Dog Mana.
// Zničí ho štěk (HAF!) nebo skok shora.
class MalyZralok extends Nepritel {
  constructor(scene, x, y, smer) {
    super(scene, x, y, 'maly_zralok');
    this.koliduje = false;
    this.sprite.setScale(92 / this.sprite.width);
    this.sprite.body.setSize(this.sprite.width * 0.7, this.sprite.height * 0.4).setOffset(this.sprite.width * 0.25, this.sprite.height * 0.45);
    this.vx = smer * 220; // vystřelí z tlamy
    this.vy = 0;
    this.rychlost = Phaser.Math.Between(85, 115);
  }

  skokShora() {
    this.znic();
    this.scene.rozsypSrouby(this.sprite.x, this.sprite.y);
    return 'KRACH!';
  }

  update(cas, hrac) {
    if (this.omracenyKrok(cas)) return;
    const s = this.sprite;
    // pomalu zatáčí za Dog Manem, takže se mu dá uhnout
    const u = Phaser.Math.Angle.Between(s.x, s.y, hrac.x, hrac.y);
    this.vx += (Math.cos(u) * this.rychlost - this.vx) * 0.025;
    this.vy += (Math.sin(u) * this.rychlost - this.vy) * 0.025;
    s.setVelocity(this.vx, this.vy);
    s.setFlipX(this.vx < 0); // kresba kouká doprava
    s.angle = Phaser.Math.Clamp(this.vy * 0.15, -20, 20) * (this.vx < 0 ? -1 : 1);
  }
}
