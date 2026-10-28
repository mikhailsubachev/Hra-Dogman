class MenuScena extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const S = N.SIRKA;
    const V = N.VYSKA;
    Textury.voda(this);
    Textury.bublinky(this);

    this.add.text(S / 2, 78, 'DOG MAN', {
      fontFamily: N.PISMO_NADPIS, fontSize: '118px', color: '#ffd43b', stroke: '#1b1b1b', strokeThickness: 14,
    }).setOrigin(0.5).setAngle(-3);
    this.add.text(S / 2, 168, 'Čuňas pod mořem', {
      fontFamily: N.PISMO_NADPIS, fontSize: '48px', color: '#ffffff', stroke: '#0b2a55', strokeThickness: 8,
    }).setOrigin(0.5);

    // postavy
    const dogman = this.add.image(170, 360, 'dogman');
    dogman.setScale(230 / dogman.height);
    const petulka = this.add.image(290, 430, 'petulka');
    petulka.setScale(100 / petulka.height);
    const cunas = this.add.image(770, 345, 'cunas');
    cunas.setScale(240 / cunas.height);
    const bobanek = this.add.image(895, 430, 'bobanek');
    bobanek.setScale(100 / bobanek.height);
    this.tweens.add({ targets: [dogman, petulka], y: '-=10', duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: cunas, angle: { from: -4, to: 4 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: bobanek, y: '-=14', duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // tlačítko HRÁT
    const tlacitko = this.add.rectangle(S / 2, 300, 270, 96, 0xff922b)
      .setStrokeStyle(7, 0x1b1b1b).setInteractive({ useHandCursor: true });
    const napis = this.add.text(S / 2, 302, 'HRÁT', {
      fontFamily: N.PISMO_NADPIS, fontSize: '64px', color: '#ffffff', stroke: '#1b1b1b', strokeThickness: 8,
    }).setOrigin(0.5);
    this.tweens.add({ targets: [tlacitko, napis], scale: 1.06, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const nejlepsi = Ulozeni.rekordy('ponor1')[0];
    if (nejlepsi) {
      this.add.text(S / 2, 385, `🏆 Nejrychlejší: ${nejlepsi.jmeno}  ${formatCas(nejlepsi.cas)}`, {
        fontFamily: N.PISMO, fontSize: '30px', color: '#ffd43b', stroke: '#0b2a55', strokeThickness: 5,
      }).setOrigin(0.5);
    }

    const napoveda = jeDotykoveZarizeni(this)
      ? 'Vlevo táhni palcem = chůze   ·   Vpravo ťukni = skok, 2× ťukni = HAF'
      : 'Šipky = chůze   ·   Mezerník = skok   ·   X = HAF!   ·   Esc = menu';
    this.add.text(S / 2, V - 34, napoveda, {
      fontFamily: N.PISMO, fontSize: '26px', color: '#d0ebff',
    }).setOrigin(0.5);

    // číslo verze, ať je poznat, jestli prohlížeč načetl tu nejnovější
    this.add.text(S - 12, V - 10, `verze ${VERZE}`, {
      fontFamily: N.PISMO, fontSize: '20px', color: '#a5d8ff',
    }).setOrigin(1, 1).setAlpha(0.8);

    const start = () => {
      Zvuky.klik();
      this.scene.start('Komiks');
    };
    tlacitko.on('pointerdown', start);
    this.input.keyboard.once('keydown-ENTER', start);
    this.input.keyboard.once('keydown-SPACE', start);
  }
}
