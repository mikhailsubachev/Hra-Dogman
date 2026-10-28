// Horní lišta: kosti (nebo životy bosse), stopky, kyslík a tlačítko do menu.
// nastaveni: { kosti: celkem } pro běžnou úroveň, { boss: 'Jméno', zivoty: 3 } pro souboj.
class Ukazatele {
  constructor(scene, nastaveni = {}) {
    this.scene = scene;
    this.celkem = nastaveni.kosti;
    const styl = { fontFamily: N.PISMO_NADPIS, fontSize: '30px', color: '#ffffff', stroke: '#0b2a55', strokeThickness: 6 };
    this.styl = styl;

    if (this.celkem !== undefined) {
      scene.add.image(34, 30, 'kost').setScrollFactor(0).setDepth(100).setScale(1.2);
      this.kosti = scene.add.text(60, 12, '', styl).setScrollFactor(0).setDepth(100);
    }
    if (nastaveni.boss) {
      scene.add.text(16, 12, nastaveni.boss, { ...styl, color: '#e5dbff' }).setScrollFactor(0).setDepth(100);
      this.srdce = [];
      for (let i = 0; i < nastaveni.zivoty; i++) {
        this.srdce.push(scene.add.text(16 + i * 34, 48, '⚙', { ...styl, fontSize: '32px', color: '#b197fc' })
          .setScrollFactor(0).setDepth(100));
      }
    }
    this.stopky = scene.add.text(N.SIRKA / 2 - 20, 10, '', { ...styl, fontSize: '34px' })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    if (N.KYSLIK.zapnuto) {
      this.kyslikPopis = scene.add.text(N.SIRKA - 330, 12, 'KYSLÍK', styl).setScrollFactor(0).setDepth(100);
      this.ramecek = scene.add.rectangle(N.SIRKA - 225, 18, 170, 22).setOrigin(0, 0)
        .setStrokeStyle(3, 0xffffff).setFillStyle(0x0b2a55, 0.5).setScrollFactor(0).setDepth(100);
      this.pruh = scene.add.rectangle(N.SIRKA - 222, 21, 164, 16, 0x4dabf7).setOrigin(0, 0)
        .setScrollFactor(0).setDepth(101);
    }

    this.menu = scene.add.text(N.SIRKA - 16, 12, '☰', { ...styl, fontSize: '34px' })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(100).setInteractive({ useHandCursor: true });
    this.menu.on('pointerdown', () => scene.doMenu());
    this.rozmisti();
  }

  // pravá část lišty se drží u pravého okraje, stopky uprostřed (po otočení telefonu)
  rozmisti() {
    const S = N.SIRKA;
    this.stopky.setX(S / 2 - 20);
    if (this.pruh) {
      this.kyslikPopis.setX(S - 330);
      this.ramecek.setX(S - 225);
      this.pruh.setX(S - 222);
    }
    this.menu.setX(S - 16);
  }

  // kolik životů bossovi zbývá (vypnuté ozubené kolečko = ztracený život)
  zivotyBosse(zbyva) {
    this.srdce.forEach((s, i) => {
      s.setColor(i < zbyva ? '#b197fc' : '#495057').setAlpha(i < zbyva ? 1 : 0.6);
      if (i === zbyva) this.scene.tweens.add({ targets: s, scale: { from: 1.8, to: 1 }, duration: 400 });
    });
  }

  update(kosti, kyslik, cas) {
    if (this.kosti) this.kosti.setText(`${kosti} / ${this.celkem}`);
    this.stopky.setText(`⏱ ${formatCas(cas)}`);
    if (this.pruh) {
      const podil = Phaser.Math.Clamp(kyslik / N.KYSLIK.max, 0, 1);
      this.pruh.width = 164 * podil;
      const malo = podil < 0.25;
      this.pruh.setFillStyle(malo ? 0xff6b6b : 0x4dabf7);
      this.pruh.setAlpha(malo && Math.floor(this.scene.time.now / 250) % 2 ? 0.4 : 1);
    }
  }
}
