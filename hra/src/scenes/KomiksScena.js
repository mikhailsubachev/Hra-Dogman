// Komiks mezi úrovněmi. Panely jsou v texty/*.js (komiks_...), děti je mohou snadno přepsat.
class KomiksScena extends Phaser.Scene {
  constructor() { super('Komiks'); }

  init(data) {
    this.panely = data.panely || t('komiks_uvod');
    this.dalsi = data.dalsi || { scena: 'Ponor', data: { uroven: 'ponor1' } };
  }

  create() {
    Textury.voda(this);
    this.index = -1;
    this.konci = false;
    this.obsah = null;

    this.add.text(N.SIRKA - 20, 14, t('komiks_preskocit'), {
      fontFamily: N.PISMO_NADPIS, fontSize: '28px', color: '#ffffff', stroke: '#0b2a55', strokeThickness: 6,
    }).setOrigin(1, 0).setDepth(10).setInteractive({ useHandCursor: true })
      .on('pointerdown', (p, x, y, e) => { e.stopPropagation(); this.konec(); });

    this.pokracuj = this.add.text(N.SIRKA / 2, N.VYSKA - 26, t('komiks_pokracuj'), {
      fontFamily: N.PISMO, fontSize: '26px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(10);
    this.tweens.add({ targets: this.pokracuj, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    this.input.on('pointerdown', () => this.dalsiPanel());
    this.input.keyboard.on('keydown-SPACE', () => this.dalsiPanel());
    this.input.keyboard.on('keydown-ENTER', () => this.dalsiPanel());
    this.input.keyboard.on('keydown-ESC', () => this.konec());
    this.dalsiPanel();
  }

  dalsiPanel() {
    this.index++;
    if (this.index >= this.panely.length) return this.konec();
    if (this.index > 0) Zvuky.klik();
    if (this.obsah) this.obsah.destroy();
    const p = this.panely[this.index];
    const c = this.add.container(N.SIRKA / 2, N.VYSKA / 2 - 10);
    this.obsah = c;

    // rámeček panelu
    c.add(this.add.rectangle(0, 0, 880, 440, 0xfff9db).setStrokeStyle(8, 0x1b1b1b));

    // postava vlevo
    const obr = this.add.image(-250, 40, p.postava);
    obr.setScale(Math.min(270 / obr.height, 320 / obr.width));
    c.add(obr);
    this.tweens.add({ targets: obr, y: 30, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // vypravěč (žlutý rámeček nahoře)
    if (p.vypravec) {
      const vyska = p.text ? 90 : 150;
      const y = p.text ? -165 : -40;
      const x = p.text ? 0 : 180;
      const sirka = p.text ? 820 : 460;
      c.add(this.add.rectangle(x, y, sirka, vyska, 0xffd43b).setStrokeStyle(5, 0x1b1b1b));
      c.add(this.add.text(x, y, p.vypravec, {
        fontFamily: N.PISMO, fontSize: '32px', color: '#1b1b1b', align: 'center', wordWrap: { width: sirka - 40 },
      }).setOrigin(0.5));
    }

    // bublina s řečí
    if (p.text) {
      const bx = 170;
      const by = p.vypravec ? 30 : -20;
      const g = this.add.graphics();
      g.fillStyle(0xffffff); g.lineStyle(5, 0x1b1b1b);
      g.fillTriangle(bx - 200, by + 40, bx - 300, by + 110, bx - 170, by + 70);
      g.strokeTriangle(bx - 200, by + 40, bx - 300, by + 110, bx - 170, by + 70);
      g.fillRoundedRect(bx - 240, by - 95, 480, 190, 40);
      g.strokeRoundedRect(bx - 240, by - 95, 480, 190, 40);
      g.fillStyle(0xffffff); g.fillRect(bx - 205, by + 45, 40, 30); // schová čáru mezi bublinou a ocáskem
      c.add(g);
      c.add(this.add.text(bx - 210, by - 85, t(`jmeno_${p.mluvi}`).toUpperCase(), {
        fontFamily: N.PISMO_NADPIS, fontSize: '28px', color: '#e8590c',
      }));
      c.add(this.add.text(bx, by + 12, p.text, {
        fontFamily: N.PISMO, fontSize: p.text.length < 10 ? '64px' : '34px', color: '#1b1b1b',
        align: 'center', wordWrap: { width: 420 },
      }).setOrigin(0.5));
    }

    // číslo panelu v rohu (navrch)
    c.add(this.add.circle(-410, -190, 22, 0x1b1b1b));
    c.add(this.add.text(-410, -188, `${this.index + 1}`, {
      fontFamily: N.PISMO_NADPIS, fontSize: '28px', color: '#ffffff',
    }).setOrigin(0.5));

    c.setScale(0.92).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 220, ease: 'Back.out' });
  }

  konec() {
    if (this.konci) return;
    this.konci = true;
    this.scene.start(this.dalsi.scena, this.dalsi.data);
  }
}
