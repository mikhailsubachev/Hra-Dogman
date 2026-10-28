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

    // další úrovně: každá se odemkne po dokončení předchozí
    UROVNE_HRY.slice(1).forEach((u, i) => {
      const odemceno = Postup.jeOdemcena(u.id);
      const predchozi = UROVNE_HRY[i];
      const popis = odemceno ? `${i + 2}: ${u.menu} ▶` : `🔒 ${i + 2}: ${u.nazev} (nejdřív dokonči ${predchozi.nazev})`;
      const t = this.add.text(S / 2, 372 + i * 50, popis, {
        fontFamily: N.PISMO, fontSize: '27px', color: odemceno ? '#ffffff' : '#a5d8ff', stroke: '#0b2a55', strokeThickness: 6,
        backgroundColor: odemceno ? '#7048e8' : undefined, padding: { x: 14, y: 3 },
      }).setOrigin(0.5);
      if (odemceno) t.setInteractive({ useHandCursor: true }).on('pointerdown', () => { Zvuky.klik(); Postup.spust(this, u.id); });
    });

    // nejlepší čas Ponoru 1: ze sdílené Síně slávy, bez serveru z tohoto zařízení
    const rekord = this.add.text(S / 2, 366 + (UROVNE_HRY.length - 1) * 50, '', {
      fontFamily: N.PISMO, fontSize: '24px', color: '#ffd43b', stroke: '#0b2a55', strokeThickness: 5,
    }).setOrigin(0.5);
    const ukazRekord = (nejlepsi) => {
      if (nejlepsi) rekord.setText(`🏆 Ponor 1: ${nejlepsi.jmeno}  ${formatCas(nejlepsi.cas)}`);
    };
    if (SdileneVysledky.zapnuto) {
      SdileneVysledky.nacti('ponor1').then((rekordy) => {
        if (!this.sys.isActive()) return;
        ukazRekord(rekordy ? rekordy[0] : Ulozeni.rekordy('ponor1')[0]);
      });
    } else {
      ukazRekord(Ulozeni.rekordy('ponor1')[0]);
    }

    const napoveda = jeDotykoveZarizeni(this)
      ? 'Vlevo táhni palcem = chůze   ·   Vpravo ťukni = skok, 2× ťukni = HAF'
      : 'Šipky = chůze   ·   Mezerník = skok   ·   X = HAF!   ·   Esc = menu';
    this.add.text(S / 2, V - 34, napoveda, {
      fontFamily: N.PISMO, fontSize: '26px', color: '#d0ebff',
    }).setOrigin(0.5);

    // na mobilu přepínač celé obrazovky (zapnout, nebo ji zase zrušit)
    if (jeDotykoveZarizeni(this) && document.fullscreenEnabled) {
      const cela = !!document.fullscreenElement;
      this.add.text(16, 12, cela ? '✕ zrušit celou obrazovku' : '⛶ celá obrazovka', {
        fontFamily: N.PISMO, fontSize: '28px', color: '#ffffff', stroke: '#0b2a55', strokeThickness: 6,
      }).setInteractive({ useHandCursor: true }).on('pointerup', () => {
        const prepni = cela ? document.exitFullscreen().catch(() => {}) : naCelouObrazovku();
        prepni.then(() => setTimeout(() => this.sys.isActive() && this.scene.restart(), 300));
      });
    }

    // hráč vpravo nahoře: kdo hraje, nebo pozvánka k přihlášení
    if (SdileneVysledky.zapnuto) {
      const hrac = this.add.text(S - 16, 12, Ucet.prihlaseny ? `👤 ${Ucet.prezdivka}` : '👤 Přihlásit se', {
        fontFamily: N.PISMO, fontSize: '30px', color: '#ffffff', stroke: '#0b2a55', strokeThickness: 6,
        backgroundColor: Ucet.prihlaseny ? undefined : '#7048e8', padding: { x: 12, y: 4 },
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
      hrac.on('pointerup', () => { Zvuky.klik(); this.scene.start('Ucet'); });
      // postup z jiného zařízení: když se něco změní, menu se překreslí (odemknou se úrovně)
      if (Ucet.prihlaseny) {
        Ucet.obnovPostup().then((zmena) => {
          if (this.sys.isActive() && (zmena || !Ucet.prihlaseny)) this.scene.restart();
        });
      }
    }

    // číslo verze, ať je poznat, jestli prohlížeč načetl tu nejnovější
    this.add.text(S - 12, V - 10, `verze ${VERZE}`, {
      fontFamily: N.PISMO, fontSize: '20px', color: '#a5d8ff',
    }).setOrigin(1, 1).setAlpha(0.8);

    const start = () => {
      Zvuky.klik();
      Postup.spust(this, 'ponor1');
    };
    tlacitko.on('pointerdown', start);
    this.input.keyboard.once('keydown-ENTER', start);
    this.input.keyboard.once('keydown-SPACE', start);
  }
}
