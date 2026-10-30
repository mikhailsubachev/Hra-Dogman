// Horní lišta: kosti (nebo životy bosse), klíčky, stopky, kyslík, světlo a tlačítko do menu.
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
    if (nastaveni.klice !== undefined) {
      this.klicekObr = scene.add.image(196, 30, 'klicek').setScrollFactor(0).setDepth(100);
      this.klicePocet = scene.add.text(220, 12, '0', styl).setScrollFactor(0).setDepth(100);
      this.klicekObr.setAlpha(0.4);
    }
    if (nastaveni.boss) {
      scene.add.text(16, 12, nastaveni.boss, { ...styl, color: '#e5dbff' }).setScrollFactor(0).setDepth(100);
      this.srdce = [];
      for (let i = 0; i < nastaveni.zivoty; i++) {
        // životy jako ozubená kolečka, nebo obrázek (ikona: klíč textury, třeba šroubek)
        this.srdce.push(nastaveni.ikona
          ? scene.add.image(28 + i * 26, 66, nastaveni.ikona).setScrollFactor(0).setDepth(100)
          : scene.add.text(16 + i * 34, 48, '⚙', { ...styl, fontSize: '32px', color: '#b197fc' }).setScrollFactor(0).setDepth(100));
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

    if (nastaveni.svetlo) {
      this.svetloPopis = scene.add.text(N.SIRKA - 330, 46, 'SVĚTLO', { ...styl, fontSize: '24px' }).setScrollFactor(0).setDepth(100);
      this.svetloRamecek = scene.add.rectangle(N.SIRKA - 225, 52, 170, 18).setOrigin(0, 0)
        .setStrokeStyle(3, 0xffffff).setFillStyle(0x0b2a55, 0.5).setScrollFactor(0).setDepth(100);
      this.svetloPruh = scene.add.rectangle(N.SIRKA - 222, 55, 164, 12, 0xffe066).setOrigin(0, 0)
        .setScrollFactor(0).setDepth(101);
    }

    this.menu = scene.add.text(N.SIRKA - 16, 12, '☰', { ...styl, fontSize: '34px' })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(100).setInteractive({ useHandCursor: true });
    this.menu.on('pointerdown', () => scene.pauza());
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
    if (this.svetloPruh) {
      this.svetloPopis.setX(S - 330);
      this.svetloRamecek.setX(S - 225);
      this.svetloPruh.setX(S - 222);
    }
    this.menu.setX(S - 16);
  }

  // kolik klíčků má Dog Man u sebe
  klice(pocet) {
    this.klicePocet.setText(String(pocet));
    this.klicekObr.setAlpha(pocet ? 1 : 0.4);
    if (pocet) this.scene.tweens.add({ targets: this.klicekObr, scale: { from: 1.8, to: 1 }, duration: 400 });
  }

  // nabití lampy ve vraku (0 až 1)
  svetlo(podil) {
    this.svetloPruh.width = 164 * podil;
    this.svetloPruh.setFillStyle(podil < 0.25 ? 0xffa94d : 0xffe066);
  }

  // kolik životů bossovi zbývá (šedé kolečko nebo vybledlý šroubek = ztracený život)
  zivotyBosse(zbyva) {
    this.srdce.forEach((s, i) => {
      if (s.setColor) s.setColor(i < zbyva ? '#b197fc' : '#495057').setAlpha(i < zbyva ? 1 : 0.6);
      else s.setAlpha(i < zbyva ? 1 : 0.2);
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
