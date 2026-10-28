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
    return 'BOING!';
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
    return 'KRACH!';
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
    return 'BZZZT!';
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
    return 'Ouvej!';
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
      this.scene.vyskakovaciText(s.x, s.y - 50, 'Ham ham!', '#a9e34b');
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
      this.scene.vyskakovaciText(s.x, s.y - 50, 'BUM!', '#ffd43b');
      this.scene.cameras.main.shake(120, 0.004);
      this.omrac(1200);
    }
  }
}
