// Čuňasovi pomocníci. Všichni umí být omráčení štěkotem (HAF!).
class Nepritel {
  constructor(scene, x, y, klic) {
    this.scene = scene;
    this.startX = x;
    this.startY = y;
    this.omracenDo = 0;
    this.koliduje = true; // srážky s dnem a vraky
    this.zivy = true;
    this.sprite = scene.physics.add.sprite(x, y, klic).setDepth(3);
    scene.nepratele.add(this.sprite);
    this.sprite.body.setAllowGravity(false);
    this.sprite.nepritel = this;
  }

  get nebezpecny() { return this.scene.time.now >= this.omracenDo; }

  omrac(doba) {
    this.omracenDo = this.scene.time.now + doba;
    this.sprite.setTint(0x99ddff);
    this.sprite.setVelocity(0, 0);
  }

  // Dog Man na něj skočil shora. Vrací text, který vyskočí nad nepřítelem.
  skokShora() {
    this.omrac(2000);
    return t('boing');
  }

  znic() {
    this.zivy = false;
    this.sprite.body.enable = false;
    this.sprite.setTint(0x666666);
    this.scene.tweens.add({
      targets: this.sprite, y: this.sprite.y + 120, angle: 540, alpha: 0, scale: 0.4, duration: 700,
      onComplete: () => this.sprite.destroy(),
    });
  }

  // Peťulčina bublina ho obalí a odnese nahoru na hladinu
  odnesBublinou() {
    const scene = this.scene;
    const s = this.sprite;
    this.zivy = false;
    s.body.enable = false;
    s.clearTint();
    const obal = scene.add.image(s.x, s.y, 'strela').setDepth(s.depth + 1).setAlpha(0.8);
    obal.setScale((Math.max(s.displayWidth, s.displayHeight) * 1.2) / obal.width);
    const kolebani = scene.tweens.add({ targets: [s, obal], x: '+=12', duration: 450, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    scene.tweens.add({
      targets: [s, obal], y: -100, duration: Math.max(900, ((s.y + 100) / 180) * 1000), ease: 'Sine.in',
      onComplete: () => { kolebani.remove(); s.destroy(); obal.destroy(); },
    });
  }

  // vrací true, dokud je omráčený (pak se jen točí)
  omracenyKrok(cas) {
    if (cas < this.omracenDo) {
      this.sprite.setVelocity(0, 0);
      this.sprite.angle += 8;
      return true;
    }
    if (this.sprite.isTinted) {
      this.sprite.clearTint();
      this.sprite.angle = 0;
    }
    return false;
  }
}

// R: pluje sem a tam, otočí se o zeď nebo po třech políčkách
class RobotickaRybka extends Nepritel {
  constructor(scene, x, y) {
    super(scene, x, y, 'rybka');
    this.sprite.body.setSize(38, 22).setOffset(2, 7);
    this.rozsah = 3 * N.DLAZDICE;
    this.rychlost = 95;
    this.smer = -1;
  }

  skokShora() {
    this.znic();
    this.scene.rozsypSrouby(this.sprite.x, this.sprite.y);
    return t('krach');
  }

  update(cas) {
    if (this.omracenyKrok(cas)) return;
    const s = this.sprite;
    const b = s.body;
    if (b.blocked.left || s.x < this.startX - this.rozsah) this.smer = 1;
    else if (b.blocked.right || s.x > this.startX + this.rozsah) this.smer = -1;
    s.setVelocityX(this.rychlost * this.smer);
    s.y = this.startY + Math.sin(cas * 0.003 + this.startX) * 5;
    s.setFlipX(this.smer > 0);
    s.angle = Math.sin(cas * 0.006) * 4;
  }
}

// M: vznáší se nahoru a dolů, prochází i skrz dno
class Meduza extends Nepritel {
  constructor(scene, x, y) {
    super(scene, x, y, 'meduza');
    this.koliduje = false;
    this.sprite.body.setSize(32, 40).setOffset(4, 6);
    this.faze = (x / N.DLAZDICE) * 0.7;
  }

  skokShora() {
    this.omrac(N.SKOK_NA_NEPRITELE.omraceniMeduzy);
    return t('bzzzt');
  }

  update(cas) {
    if (this.omracenyKrok(cas)) return;
    this.sprite.y = this.startY + Math.sin(cas * 0.0022 + this.faze) * N.DLAZDICE * 1.3;
    this.sprite.scaleY = 1 + Math.sin(cas * 0.008) * 0.06;
  }
}

// B: Bobánek. Když Dog Mana uvidí, honí ho, ale je nešikovný a naráží do vraků.
class Bobanek extends Nepritel {
  constructor(scene, x, y) {
    super(scene, x, y, 'bobanek');
    this.sprite.setScale(88 / this.sprite.height);
    this.sprite.body.setSize(this.sprite.width * 0.7, this.sprite.height * 0.75, true);
    this.rozsah = 9 * N.DLAZDICE;
    this.rychlost = 135;
    this.honi = false;
    this.bumPauzaDo = 0;
  }

  skokShora() {
    this.omrac(N.SKOK_NA_NEPRITELE.omraceniBobanka);
    return t('ouvej');
  }

  update(cas, hrac) {
    if (this.omracenyKrok(cas)) return;
    const s = this.sprite;
    const b = s.body;
    const dx = hrac.x - s.x;
    const dy = hrac.y - s.y;
    const vidi = Math.abs(dx) < 7 * N.DLAZDICE && Math.abs(dy) < 4 * N.DLAZDICE;

    if (vidi && !this.honi) {
      this.honi = true;
      this.scene.vyskakovaciText(s.x, s.y - 50, t('ham_ham'), '#a9e34b');
    } else if (!vidi) {
      this.honi = false;
    }

    let cilX = this.honi ? hrac.x : this.startX;
    cilX = Phaser.Math.Clamp(cilX, this.startX - this.rozsah, this.startX + this.rozsah);
    const cilY = this.honi ? Phaser.Math.Clamp(hrac.y, this.startY - 2 * N.DLAZDICE, this.startY + N.DLAZDICE) : this.startY;
    const vx = Math.abs(cilX - s.x) > 6 ? Math.sign(cilX - s.x) * this.rychlost : 0;
    const vy = Math.abs(cilY - s.y) > 6 ? Math.sign(cilY - s.y) * 60 : 0;
    s.setVelocity(vx, vy);
    if (vx !== 0) s.setFlipX(vx > 0); // kresba kouká doleva
    s.angle = Math.sin(cas * 0.01) * (this.honi ? 8 : 3);

    // naboural do vraku!
    if (this.honi && (b.blocked.left || b.blocked.right) && cas > this.bumPauzaDo) {
      this.bumPauzaDo = cas + 3000;
      Zvuky.bum();
      this.scene.vyskakovaciText(s.x, s.y - 50, t('bum'), '#ffd43b');
      this.scene.cameras.main.shake(120, 0.004);
      this.omrac(1200);
    }
  }
}

// U: elektrický úhoř (podle dětské kresby). Pomalu plave sem a tam, občas se nabije
// (jiskří a bliká) a pak vypustí blesky: zasáhnou všechno v jeho blízkém okolí,
// Dog Mana i ostatní roboty. Skok shora nebo štěk ho omráčí a výboj zruší.
class ElektrickyUhor extends Nepritel {
  constructor(scene, x, y) {
    super(scene, x, y, 'uhor');
    const s = this.sprite;
    s.setScale(N.UHOR.sirka / s.width);
    s.body.setSize(s.width * 0.88, s.height * 0.5).setOffset(s.width * 0.03, s.height * 0.27);
    this.velky = true; // bublina ho neodnese, jen omráčí
    this.rozsah = N.UHOR.rozsah * N.DLAZDICE;
    this.smer = -1;
    this.stav = 'klid';
    this.dalsiVyboj = scene.time.now + Phaser.Math.Between(800, N.UHOR.klid[1]);
    this.blesky = scene.add.graphics().setDepth(7);
    this.prekresleno = 0;
  }

  omrac(doba) {
    super.omrac(doba);
    this.stav = 'klid';
    this.blesky.clear();
    this.dalsiVyboj = this.scene.time.now + doba + Phaser.Math.Between(...N.UHOR.klid);
  }

  skokShora() {
    this.omrac(N.UHOR.omraceni);
    return t('boing');
  }

  update(cas, hrac) {
    if (this.omracenyKrok(cas)) return;
    const s = this.sprite;
    const U = N.UHOR;
    if (this.stav === 'klid') {
      const b = s.body;
      if (b.blocked.left || s.x < this.startX - this.rozsah) this.smer = 1;
      else if (b.blocked.right || s.x > this.startX + this.rozsah) this.smer = -1;
      s.setVelocityX(U.rychlost * this.smer);
      s.y = this.startY + Math.sin(cas * 0.002 + this.startX) * 6;
      s.setFlipX(this.smer > 0); // kresba kouká doleva
      s.angle = Math.sin(cas * 0.005) * 3;
      if (cas >= this.dalsiVyboj) {
        this.stav = 'nabiji';
        this.konecStavu = cas + U.nabijeni;
        s.setVelocity(0, 0);
        Zvuky.nabijeni(this.hlasitost(hrac));
      }
      return;
    }
    if (this.stav === 'nabiji') {
      // varování: bliká a kolem přeskakují jiskry
      s.setTint(Math.floor(cas / 90) % 2 ? 0x74c0fc : 0xffffff);
      if (cas > this.prekresleno) this.kresliBlesky(U.dosah * 0.45, 4, 2);
      if (cas >= this.konecStavu) {
        this.stav = 'vyboj';
        this.konecStavu = cas + U.vyboj;
        s.setTint(0xd0ebff);
        const sila = this.hlasitost(hrac);
        Zvuky.blesk(sila);
        if (sila > 0.5) this.scene.cameras.main.shake(150, 0.004);
      }
      return;
    }
    // výboj: blesky do okolí, zasáhnou každého, kdo je blízko
    if (cas > this.prekresleno) this.kresliBlesky(U.dosah, 9, 4);
    this.scene.uderBlesku(this);
    if (cas >= this.konecStavu) {
      this.stav = 'klid';
      s.clearTint();
      this.blesky.clear();
      this.dalsiVyboj = cas + Phaser.Math.Between(...U.klid);
    }
  }

  // úhoře je slyšet jen zblízka: hned u něj naplno, dál tišeji, od N.UHOR.slyset vůbec
  hlasitost(hrac) {
    const d = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, hrac.x, hrac.y);
    return Phaser.Math.Clamp((N.UHOR.slyset - d) / (N.UHOR.slyset - N.UHOR.dosah), 0, 1);
  }

  // klikaté čáry od úhoře do všech stran
  kresliBlesky(dosah, pocet, tloustka) {
    const g = this.blesky;
    const { x, y } = this.sprite;
    this.prekresleno = this.scene.time.now + 70;
    g.clear();
    if (pocet > 6) {
      g.fillStyle(0x74c0fc, 0.18);
      g.fillCircle(x, y, dosah);
    }
    for (let i = 0; i < pocet; i++) {
      const u = (i / pocet) * Math.PI * 2 + Math.random() * 0.6;
      g.lineStyle(tloustka + 4, 0x1864ab, 0.5);
      const body = [];
      for (let j = 0; j <= 5; j++) {
        const d = (dosah * j) / 5;
        const kolmo = j === 0 || j === 5 ? 0 : Phaser.Math.Between(-14, 14);
        body.push({ x: x + Math.cos(u) * d - Math.sin(u) * kolmo, y: y + Math.sin(u) * d * 0.8 + Math.cos(u) * kolmo });
      }
      g.strokePoints(body);
      g.lineStyle(tloustka, 0xe7f5ff, 1);
      g.strokePoints(body);
    }
  }

  znic() { this.blesky.destroy(); super.znic(); }
}
