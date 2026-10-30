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

    // postavy: rozestavené od středu, na široké obrazovce (celá obrazovka na mobilu) se rozestoupí
    const k = Math.min(S / N.ZAKLADNI_SIRKA, 1.35);
    const odStredu = (dx) => S / 2 + dx * k;
    const dogman = this.add.image(odStredu(-310), 360, 'dogman');
    dogman.setScale(230 / dogman.height);
    const petulka = this.add.image(odStredu(-190), 430, 'petulka');
    petulka.setScale(100 / petulka.height);
    const cunas = this.add.image(odStredu(290), 345, 'cunas');
    cunas.setScale(240 / cunas.height);
    const bobanek = this.add.image(odStredu(415), 430, 'bobanek');
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

    // nejlepší čas té úrovně ze Síně slávy všech hráčů (jen pro přihlášené)
    if (Ucet.prihlaseny) this.ukazRekord(aktualni.id);

    // výběr konkrétní úrovně a Síň slávy: vlevo nahoře, ať nezakrývají postavy
    const tlacitkoMenu = (y, popis, akce) => this.add.text(16, y, popis, {
      fontFamily: N.PISMO, fontSize: '26px', color: '#ffffff', stroke: '#0b2a55', strokeThickness: 6,
      backgroundColor: '#7048e8', padding: { x: 12, y: 3 },
    }).setInteractive({ useHandCursor: true }).on('pointerup', () => { Zvuky.klik(); akce(); });
    tlacitkoMenu(12, '☰ VYBRAT ÚROVEŇ', () => this.ukazVyber());
    tlacitkoMenu(60, '🏆 SÍŇ SLÁVY', () => this.ukazSinSlavy());

    const napoveda = jeDotykoveZarizeni(this)
      ? 'Vlevo táhni palcem = chůze   ·   Vpravo ťukni = skok, 2× ťukni = HAF'
      : 'Šipky = chůze   ·   Mezerník = skok   ·   X = HAF!   ·   Esc = menu';
    this.add.text(S / 2, V - 34, napoveda, {
      fontFamily: N.PISMO, fontSize: '26px', color: '#d0ebff',
    }).setOrigin(0.5);

    // na mobilu přepínač celé obrazovky (zapnout, nebo ji zase zrušit).
    // iPhone v Safari celou obrazovku neumí: tlačítko poradí přidat hru na plochu.
    const prepinacObrazovky = jeDotykoveZarizeni(this) && !jeNaPlose();
    if (prepinacObrazovky) {
      const cela = !!document.fullscreenElement;
      this.add.text(16, 108, cela ? '✕ zrušit celou obrazovku' : '⛶ celá obrazovka', {
        fontFamily: N.PISMO, fontSize: '28px', color: '#ffffff', stroke: '#0b2a55', strokeThickness: 6,
      }).setInteractive({ useHandCursor: true }).on('pointerup', () => {
        if (!document.fullscreenEnabled) { this.ukazNaPlochu(); return; }
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
    // vlevo pod tlačítky: v rozích by ho na iPhonu schovalo zaoblení obrazovky
    this.add.text(22, prepinacObrazovky ? 156 : 108, `verze ${VERZE}`, {
      fontFamily: N.PISMO, fontSize: '20px', color: '#a5d8ff',
    }).setAlpha(0.8);

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

  // pod tlačítkem HRÁT: nejrychlejší hráč úrovně
  ukazRekord(id) {
    const S = N.SIRKA;
    const rekord = this.add.text(S / 2, 398, '', {
      fontFamily: N.PISMO, fontSize: '24px', color: '#ffd43b', stroke: '#0b2a55', strokeThickness: 5,
    }).setOrigin(0.5);
    this.rekordyUrovne(id).then((rekordy) => {
      if (this.sys.isActive() && rekordy[0]) rekord.setText(`🏆 ${rekordy[0].jmeno}  ${formatCas(rekordy[0].cas)}`);
    });
  }

  // tabulka úrovně: všichni hráči ze serveru, bez serveru (nebo když neodpoví) z tohoto zařízení
  async rekordyUrovne(id) {
    const rekordy = SdileneVysledky.zapnuto ? await SdileneVysledky.nacti(id) : null;
    return rekordy || Ulozeni.rekordy(id);
  }

  // tmavé okno přes menu s nadpisem a tlačítkem ZPĚT; obsah doplní volající do this.vyber
  otevriOkno(nadpis, zpetY) {
    const S = N.SIRKA;
    const V = N.VYSKA;
    const zavrit = this.add.rectangle(S / 2, V / 2, S, V, 0x0b2a55, 0.92).setInteractive();
    zavrit.on('pointerup', () => this.zavriVyber());
    const titulek = this.add.text(S / 2, 64, nadpis, {
      fontFamily: N.PISMO_NADPIS, fontSize: '56px', color: '#ffd43b', stroke: '#1b1b1b', strokeThickness: 9,
    }).setOrigin(0.5);
    const zpet = this.add.text(S / 2, zpetY, 'ZPĚT', {
      fontFamily: N.PISMO_NADPIS, fontSize: '40px', color: '#ffffff', stroke: '#1b1b1b', strokeThickness: 7,
      backgroundColor: '#ff922b', padding: { x: 26, y: 4 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    zpet.on('pointerup', () => { Zvuky.klik(); this.zavriVyber(); });
    this.vyber = this.add.container(0, 0, [zavrit, titulek, zpet]).setDepth(200);
  }

  // iPhone: návod, jak hru přidat na plochu (pak běží přes celou obrazovku)
  ukazNaPlochu() {
    Zvuky.klik();
    this.otevriOkno('CELÁ OBRAZOVKA', 440);
    const S = N.SIRKA;
    this.vyber.add(this.add.text(S / 2, 270, [
      'Na iPhonu to Safari neumí, ale jde to takhle:',
      '',
      '1. V Safari ťukni na Sdílet ⬆ (nebo na ⋯ a potom Sdílet).',
      '2. Vyber „Přidat na plochu“ a potvrď.',
      '3. Hru pak spouštěj z ikony Dog Mana na ploše.',
      '',
      'Poběží přes celou obrazovku, bez adresního řádku.',
    ].join('\n'), {
      fontFamily: N.PISMO, fontSize: '28px', color: '#ffffff', stroke: '#0b2a55', strokeThickness: 5, align: 'center', lineSpacing: 4,
    }).setOrigin(0.5));
  }

  // okno se seznamem úrovní: odemčené jdou spustit, vpravo nejlepší čas ze Síně slávy
  ukazVyber() {
    if (this.vyber) return;
    const S = N.SIRKA;
    const postup = Ulozeni.nacti();
    // řádky se zmenší, aby se vešly všechny úrovně
    const krok = Math.min(76, Math.floor(340 / UROVNE_HRY.length));
    this.otevriOkno('VYBER ÚROVEŇ', 140 + UROVNE_HRY.length * krok + 10);
    const okno = this.vyber;

    UROVNE_HRY.forEach((u, i) => {
      const y = 140 + i * krok;
      const odemceno = Postup.jeOdemcena(u.id);
      // ✓ a vlastní čas jen přihlášenému hráči u úrovně, kterou opravdu dohrál
      const muj = Ucet.prihlaseny && postup[u.id] && postup[u.id].hotovo ? postup[u.id].nejrychleji : undefined;
      const radek = this.add.rectangle(S / 2, y, 680, krok - 8, odemceno ? 0x7048e8 : 0x343a40)
        .setStrokeStyle(5, 0x1b1b1b);
      const popis = `${odemceno ? '' : '🔒 '}${i + 1}: ${u.menu || u.nazev}${muj ? ' ✓' : ''}`;
      const text = this.add.text(S / 2 - 320, muj ? y - 11 : y, popis, {
        fontFamily: N.PISMO, fontSize: '30px', color: odemceno ? '#ffffff' : '#adb5bd', stroke: '#1b1b1b', strokeThickness: 5,
      }).setOrigin(0, 0.5);
      okno.add(radek);
      if (muj) {
        okno.add(this.add.text(S / 2 - 320, y + 16, `tvůj nejlepší čas: ${formatCas(muj)}`, {
          fontFamily: N.PISMO, fontSize: '20px', color: '#8ce99a', stroke: '#1b1b1b', strokeThickness: 4,
        }).setOrigin(0, 0.5));
      }
      const info = this.add.text(S / 2 + 320, y, odemceno ? '' : `dokonči ${UROVNE_HRY[i - 1].nazev}`, {
        fontFamily: N.PISMO, fontSize: '22px', color: '#ffd43b', stroke: '#1b1b1b', strokeThickness: 5,
      }).setOrigin(1, 0.5);
      okno.add([text, info]);
      if (odemceno) {
        radek.setInteractive({ useHandCursor: true }).on('pointerup', () => { Zvuky.klik(); Postup.spust(this, u.id); });
        this.rekordyUrovne(u.id).then((rekordy) => {
          if (info.active && rekordy[0]) info.setText(`🏆 ${rekordy[0].jmeno} ${formatCas(rekordy[0].cas)}`);
        });
      }
    });
  }

  // Síň slávy všech hráčů: vedle sebe nejlepší časy každé úrovně
  ukazSinSlavy() {
    if (this.vyber) return;
    const S = N.SIRKA;
    this.otevriOkno('SÍŇ SLÁVY', 470);
    const okno = this.vyber;
    const sirka = Math.min(210, (S - 40) / UROVNE_HRY.length - 10); // úzké sloupce: vejdou se i další úrovně
    UROVNE_HRY.forEach((u, i) => {
      const x = S / 2 + (i - (UROVNE_HRY.length - 1) / 2) * (sirka + 10);
      const styl = { fontFamily: N.PISMO, fontSize: '20px', color: '#ffffff', stroke: '#0b2a55', strokeThickness: 5 };
      const nacitam = this.add.text(x, 200, 'Načítám…', { ...styl, color: '#d0ebff' }).setOrigin(0.5);
      okno.add([
        this.add.rectangle(x, 262, sirka, 280, 0x1864ab, 0.95).setStrokeStyle(4, 0x1b1b1b),
        this.add.text(x, 140, `${i + 1}: ${u.nazev}`, { ...styl, fontSize: '24px', color: '#ffd43b' }).setOrigin(0.5),
        nacitam,
      ]);
      this.rekordyUrovne(u.id).then((rekordy) => {
        if (!nacitam.active) return;
        nacitam.setText(rekordy.length ? '' : 'Zatím prázdná');
        rekordy.slice(0, 7).forEach((r, j) => {
          const y = 178 + j * 32;
          const medaile = ['🥇', '🥈', '🥉'][j] || `${j + 1}.`;
          okno.add([
            this.add.text(x - sirka / 2 + 12, y, `${medaile} ${r.jmeno}`, styl).setOrigin(0, 0.5),
            this.add.text(x + sirka / 2 - 12, y, formatCas(r.cas), styl).setOrigin(1, 0.5),
          ]);
        });
      });
    });
  }

  zavriVyber() {
    if (!this.vyber) return;
    this.vyber.destroy();
    // tlačítko HRÁT reaguje na pointerdown: ať to samé ťuknutí hned nespustí hru
    this.time.delayedCall(50, () => { this.vyber = null; });
  }
}
