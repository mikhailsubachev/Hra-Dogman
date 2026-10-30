// Mise splněna: hvězdy za kosti, čas a Síň slávy nejrychlejších.
// Se serverem: přihlášený hráč se zapíše sám, host tabulku jen vidí.
// Bez serveru: tabulka z tohoto zařízení a jméno se píše ručně.
class KonecScena extends Phaser.Scene {
  constructor() { super('Konec'); }

  init(data) { this.vysledek = data; }

  create() {
    const S = N.ZAKLADNI_SIRKA; // rozvržení na 960, kamera ho na širší obrazovce vycentruje
    const { uroven, kosti, celkem, cas, zniceno, zasahu } = this.vysledek;
    this.celkem = celkem;
    const souboj = celkem === undefined; // souboj s bossem nemá kosti
    this.uroven = uroven;
    this.cas = cas;
    this.kostiVysledek = kosti;
    Ulozeni.zapisUroven(uroven, kosti, celkem, cas);
    this.input.keyboard.clearCaptures(); // ať jde do políčka psát mezera
    Textury.voda(this);
    Textury.bublinky(this);

    this.add.text(S / 2, 54, t('konec_nadpis'), {
      fontFamily: N.PISMO_NADPIS, fontSize: '74px', color: '#ffd43b', stroke: '#1b1b1b', strokeThickness: 11,
    }).setOrigin(0.5).setAngle(-2);

    // levá půlka: výsledek
    // hvězdy: v běžné úrovni za kosti, v souboji za to, kolikrát Dog Mana něco zasáhlo
    let hvezdy;
    if (souboj) hvezdy = zasahu === 0 ? 3 : zasahu <= 2 ? 2 : 1;
    else { const podil = celkem ? kosti / celkem : 1; hvezdy = podil >= 0.9 ? 3 : podil >= 0.5 ? 2 : 1; }
    for (let i = 0; i < 3; i++) {
      const h = this.add.text(240 + (i - 1) * 74, 140, '★', {
        fontFamily: 'sans-serif', fontSize: '70px', color: i < hvezdy ? '#ffd43b' : '#355070', stroke: '#1b1b1b', strokeThickness: 6,
      }).setOrigin(0.5).setScale(0);
      this.tweens.add({ targets: h, scale: 1, delay: 300 + i * 250, duration: 350, ease: 'Back.out', onStart: () => i < hvezdy && Zvuky.kost() });
    }
    const styl = { fontFamily: N.PISMO, fontSize: '32px', color: '#ffffff', stroke: '#0b2a55', strokeThickness: 6 };
    this.add.text(240, 215, `⏱ ${formatCas(cas)}`, { ...styl, fontFamily: N.PISMO_NADPIS, fontSize: '54px', color: '#ffd43b' }).setOrigin(0.5);
    if (souboj) {
      this.add.text(240, 270, t(uroven === 'zralok' ? 'konec_zralok' : 'konec_chobotnice'), styl).setOrigin(0.5);
      this.add.text(240, 308, t('konec_zasahy', { pocet: zasahu || 0 }), styl).setOrigin(0.5);
    } else {
      this.add.text(240, 270, t('konec_kosti', { kosti, celkem }), styl).setOrigin(0.5);
      this.add.text(240, 308, t('konec_rybky', { pocet: zniceno || 0 }), styl).setOrigin(0.5);
    }

    // pravá půlka: Síň slávy
    this.add.text(690, 112, t('sin_nadpis'), {
      fontFamily: N.PISMO_NADPIS, fontSize: '40px', color: '#ffffff', stroke: '#1b1b1b', strokeThickness: 7,
    }).setOrigin(0.5);
    this.tabulka = this.add.container(0, 0);

    if (Ucet.prihlaseny) this.zapisHrace();
    else if (SdileneVysledky.zapnuto) this.ukazProHosta();
    else this.zacniSinSlavy();

    this.prizpusobSirce();
    const dalsi = Postup.dalsi(uroven);
    this.tlacitko(110, 488, t('konec_znovu'), () => Postup.spust(this, uroven, false), 190, 70);
    this.tlacitko(315, 488, t('konec_menu'), () => this.scene.start('Menu'), 190, 70);
    if (dalsi) this.tlacitko(520, 488, t('konec_dalsi'), () => Postup.spust(this, dalsi.id, true), 190, 70);
  }

  // obsah je rozvržený na šířku 960, na širší obrazovce ho kamera vycentruje
  prizpusobSirce() {
    this.cameras.main.setSize(N.SIRKA, N.VYSKA);
    this.cameras.main.setScroll(-(N.SIRKA - N.ZAKLADNI_SIRKA) / 2, 0);
  }

  // přihlášený hráč: čas se zapíše pod jeho přezdívkou
  zapisHrace() {
    const ukladam = this.add.text(690, 220, t('konec_ukladam'), { fontFamily: N.PISMO, fontSize: '30px', color: '#d0ebff' }).setOrigin(0.5);
    Ucet.zapis(this.uroven, this.cas, this.kostiVysledek, this.celkem).then((vysledek) => {
      if (!this.sys.isActive()) return;
      ukladam.destroy();
      if (vysledek && !vysledek.chyba) {
        this.ukazTabulku(vysledek.poradi, vysledek.rekordy, true);
        if (vysledek.poradi >= 0) Zvuky.checkpoint();
        if (!vysledek.zlepseni) this.poznamka(t('konec_rekord_zustava'));
        else if (vysledek.poradi >= 6) this.poznamka(t('konec_misto', { jmeno: Ucet.prezdivka, misto: vysledek.poradi + 1 }));
      } else {
        // server nejde nebo čas odmítl: aspoň do tabulky tohoto zařízení
        const rekordy = Ulozeni.pridejRekord(this.uroven, Ucet.prezdivka, this.cas, this.kostiVysledek);
        this.ukazTabulku(rekordy.findIndex((r) => r.jmeno === Ucet.prezdivka && r.cas === this.cas));
        if (vysledek) this.poznamka(t('konec_server_neprijal', { chyba: prelozChybu(vysledek.chyba) }));
      }
    });
  }

  // host: tabulku vidí, ale zapisují se jen přihlášení
  ukazProHosta() {
    const cekam = this.add.text(690, 220, t('nacitam'), { fontFamily: N.PISMO, fontSize: '30px', color: '#d0ebff' }).setOrigin(0.5);
    SdileneVysledky.nacti(this.uroven).then((rekordy) => {
      if (!this.sys.isActive()) return;
      cekam.destroy();
      if (rekordy) this.ukazTabulku(-1, rekordy, true);
      else this.ukazTabulku(-1);
      this.poznamka(t('konec_prihlas_se'));
    });
  }

  poznamka(text) {
    this.add.text(690, 430, text, { fontFamily: N.PISMO, fontSize: '24px', color: '#ffd43b', stroke: '#0b2a55', strokeThickness: 5 }).setOrigin(0.5);
  }

  // bez serveru: o jméno se hra zeptá, když se čas vejde do tabulky zařízení
  zacniSinSlavy() {
    const misto = Ulozeni.poradi(this.uroven, this.cas);
    if (misto) this.zeptejSeNaJmeno(misto);
    else this.ukazTabulku(-1);
  }

  zeptejSeNaJmeno(misto) {
    const vyzva = this.add.text(690, 170, t('konec_misto_kdo', { misto }), {
      fontFamily: N.PISMO, fontSize: '32px', color: '#ffd43b', stroke: '#0b2a55', strokeThickness: 6,
    }).setOrigin(0.5);
    const policko = this.add.dom(690, 230, 'input', [
      'width: 280px', 'font: 30px "Patrick Hand", "Pangolin", sans-serif', 'padding: 6px 12px', 'border: 4px solid #1b1b1b',
      'border-radius: 12px', 'text-align: center', 'outline: none',
    ].join(';'));
    const input = policko.node;
    input.maxLength = 12;
    input.value = Ulozeni.posledniJmeno();
    input.placeholder = t('konec_tvoje_jmeno');
    this.time.delayedCall(100, () => input.focus());

    const ulozit = () => {
      const jmeno = input.value.trim().slice(0, 12) || t('konec_neznamy');
      Zvuky.checkpoint();
      const rekordy = Ulozeni.pridejRekord(this.uroven, jmeno, this.cas, this.kostiVysledek);
      const index = rekordy.findIndex((r) => r.jmeno === jmeno && r.cas === this.cas);
      policko.destroy();
      vyzva.destroy();
      tl.forEach((o) => o.destroy());
      this.ukazTabulku(index);
    };
    input.addEventListener('keydown', (e) => {
      e.stopPropagation(); // písmena a Enter nepatří hře, jen políčku
      if (e.key === 'Enter') ulozit();
    });
    const tl = this.tlacitko(690, 305, t('konec_zapsat'), ulozit, 200, 64);
  }

  ukazTabulku(zvyraznit, vsechny = Ulozeni.rekordy(this.uroven), sdilena = false) {
    const rekordy = vsechny.slice(0, SdileneVysledky.zapnuto ? 6 : 7); // pod tabulkou se serverem je místo na poznámku
    if (SdileneVysledky.zapnuto) {
      this.tabulka.add(this.add.text(690, 146, sdilena ? t('konec_vsichni') : t('konec_jen_zarizeni'), {
        fontFamily: N.PISMO, fontSize: '22px', color: '#a5d8ff',
      }).setOrigin(0.5));
    }
    const odshora = SdileneVysledky.zapnuto ? 186 : 160;
    if (!rekordy.length) {
      this.tabulka.add(this.add.text(690, 220, t('sin_prazdna'), { fontFamily: N.PISMO, fontSize: '30px', color: '#d0ebff' }).setOrigin(0.5));
      return;
    }
    rekordy.forEach((r, i) => {
      const y = odshora + i * 40;
      const barva = i === zvyraznit ? '#ffd43b' : '#ffffff';
      const styl = { fontFamily: N.PISMO, fontSize: '30px', color: barva, stroke: '#0b2a55', strokeThickness: 5 };
      const medaile = ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
      this.tabulka.add([
        this.add.text(510, y, medaile, styl).setOrigin(0, 0.5),
        this.add.text(560, y, r.jmeno, styl).setOrigin(0, 0.5),
        this.add.text(870, y, formatCas(r.cas), styl).setOrigin(1, 0.5),
      ]);
      if (i === zvyraznit) {
        const pozadi = this.add.rectangle(690, y, 400, 40, 0xffd43b, 0.18).setStrokeStyle(2, 0xffd43b);
        this.tabulka.addAt(pozadi, 0);
      }
    });
    this.time.delayedCall(400, () => {
      this.input.keyboard.once('keydown-ENTER', () => Postup.spust(this, this.uroven, false));
    });
  }

  tlacitko(x, y, popis, akce, sirka = 220, vyska = 76) {
    const r = this.add.rectangle(x, y, sirka, vyska, 0xff922b).setStrokeStyle(6, 0x1b1b1b).setInteractive({ useHandCursor: true });
    const napis = this.add.text(x, y + 2, popis, {
      fontFamily: N.PISMO_NADPIS, fontSize: `${Math.round(vyska * 0.58)}px`, color: '#ffffff', stroke: '#1b1b1b', strokeThickness: 7,
    }).setOrigin(0.5);
    if (napis.width > sirka - 20) napis.setScale((sirka - 20) / napis.width); // dlouhý překlad se zmenší
    r.on('pointerdown', () => { Zvuky.klik(); akce(); });
    return [r, napis];
  }
}
