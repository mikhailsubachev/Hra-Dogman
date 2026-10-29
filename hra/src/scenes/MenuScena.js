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

    // tlačítko HRÁT: pokračuje od poslední dosažené úrovně
    const aktualni = Postup.aktualni();
    const poradi = UROVNE_HRY.indexOf(aktualni) + 1;
    const tlacitko = this.add.rectangle(S / 2, 290, 270, 96, 0xff922b)
      .setStrokeStyle(7, 0x1b1b1b).setInteractive({ useHandCursor: true });
    const napis = this.add.text(S / 2, 292, 'HRÁT', {
      fontFamily: N.PISMO_NADPIS, fontSize: '64px', color: '#ffffff', stroke: '#1b1b1b', strokeThickness: 8,
    }).setOrigin(0.5);
    this.tweens.add({ targets: [tlacitko, napis], scale: 1.06, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.add.text(S / 2, 362, `${poradi}: ${aktualni.menu || aktualni.nazev}`, {
      fontFamily: N.PISMO, fontSize: '28px', color: '#ffffff', stroke: '#0b2a55', strokeThickness: 6,
    }).setOrigin(0.5);

    // nejlepší čas té úrovně: ze sdílené Síně slávy, bez serveru z tohoto zařízení
    const rekord = this.add.text(S / 2, 398, '', {
      fontFamily: N.PISMO, fontSize: '24px', color: '#ffd43b', stroke: '#0b2a55', strokeThickness: 5,
    }).setOrigin(0.5);
    const ukazRekord = (nejlepsi) => {
      if (nejlepsi) rekord.setText(`🏆 ${nejlepsi.jmeno}  ${formatCas(nejlepsi.cas)}`);
    };
    if (SdileneVysledky.zapnuto) {
      SdileneVysledky.nacti(aktualni.id).then((rekordy) => {
        if (!this.sys.isActive()) return;
        ukazRekord(rekordy ? rekordy[0] : Ulozeni.rekordy(aktualni.id)[0]);
      });
    } else {
      ukazRekord(Ulozeni.rekordy(aktualni.id)[0]);
    }

    // výběr konkrétní úrovně
    const vyber = this.add.text(S / 2, 446, '☰ VYBRAT ÚROVEŇ', {
      fontFamily: N.PISMO, fontSize: '27px', color: '#ffffff', stroke: '#0b2a55', strokeThickness: 6,
      backgroundColor: '#7048e8', padding: { x: 14, y: 3 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    vyber.on('pointerup', () => { Zvuky.klik(); this.ukazVyber(); });

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

    this.vyber = null;
    const start = () => {
      if (this.vyber) return; // otevřený výběr úrovně
      Zvuky.klik();
      Postup.spust(this, aktualni.id);
    };
    tlacitko.on('pointerdown', start);
    this.input.keyboard.on('keydown-ENTER', start);
    this.input.keyboard.on('keydown-SPACE', start);
    this.input.keyboard.on('keydown-ESC', () => this.zavriVyber());
  }

  // okno se seznamem úrovní: odemčené jdou spustit, u dokončených je ✓ a nejlepší čas hráče
  ukazVyber() {
    if (this.vyber) return;
    const S = N.SIRKA;
    const V = N.VYSKA;
    const postup = Ulozeni.nacti();
    const prvky = [];
    const zavrit = this.add.rectangle(S / 2, V / 2, S, V, 0x0b2a55, 0.85).setInteractive();
    zavrit.on('pointerup', () => this.zavriVyber());
    prvky.push(zavrit);
    prvky.push(this.add.text(S / 2, 70, 'VYBER ÚROVEŇ', {
      fontFamily: N.PISMO_NADPIS, fontSize: '56px', color: '#ffd43b', stroke: '#1b1b1b', strokeThickness: 9,
    }).setOrigin(0.5));

    UROVNE_HRY.forEach((u, i) => {
      const y = 160 + i * 82;
      const odemceno = Postup.jeOdemcena(u.id);
      const stav = postup[u.id] || {};
      const radek = this.add.rectangle(S / 2, y, 620, 68, odemceno ? 0x7048e8 : 0x343a40)
        .setStrokeStyle(5, 0x1b1b1b);
      const popis = odemceno ? `${i + 1}: ${u.menu || u.nazev}` : `🔒 ${i + 1}: ${u.menu || u.nazev}`;
      const text = this.add.text(S / 2 - 290, y, popis, {
        fontFamily: N.PISMO, fontSize: '30px', color: odemceno ? '#ffffff' : '#adb5bd', stroke: '#1b1b1b', strokeThickness: 5,
      }).setOrigin(0, 0.5);
      const vpravo = stav.hotovo
        ? `✓ ${stav.nejrychleji ? formatCas(stav.nejrychleji) : ''}`
        : odemceno ? '▶' : `dokonči ${UROVNE_HRY[i - 1].nazev}`;
      const info = this.add.text(S / 2 + 290, y, vpravo, {
        fontFamily: N.PISMO, fontSize: odemceno ? '30px' : '22px', color: stav.hotovo ? '#8ce99a' : '#ffffff', stroke: '#1b1b1b', strokeThickness: 5,
      }).setOrigin(1, 0.5);
      prvky.push(radek, text, info);
      if (odemceno) {
        radek.setInteractive({ useHandCursor: true }).on('pointerup', () => { Zvuky.klik(); Postup.spust(this, u.id); });
      }
    });

    const y = 160 + UROVNE_HRY.length * 82 + 10;
    const zpet = this.add.text(S / 2, y, 'ZPĚT', {
      fontFamily: N.PISMO_NADPIS, fontSize: '40px', color: '#ffffff', stroke: '#1b1b1b', strokeThickness: 7,
      backgroundColor: '#ff922b', padding: { x: 26, y: 4 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    zpet.on('pointerup', () => { Zvuky.klik(); this.zavriVyber(); });
    prvky.push(zpet);
    this.vyber = this.add.container(0, 0, prvky).setDepth(200);
  }

  zavriVyber() {
    if (!this.vyber) return;
    this.vyber.destroy();
    // tlačítko HRÁT reaguje na pointerdown: ať to samé ťuknutí hned nespustí hru
    this.time.delayedCall(50, () => { this.vyber = null; });
  }
}
