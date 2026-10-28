// Mise splněna: hvězdy za kosti, čas a Síň slávy nejrychlejších.
class KonecScena extends Phaser.Scene {
  constructor() { super('Konec'); }

  init(data) { this.vysledek = data; }

  create() {
    const S = N.ZAKLADNI_SIRKA; // rozvržení na 960, kamera ho na širší obrazovce vycentruje
    const { uroven, kosti, celkem, cas, zniceno } = this.vysledek;
    this.uroven = uroven;
    this.cas = cas;
    this.kostiVysledek = kosti;
    Ulozeni.zapisUroven(uroven, kosti, celkem, cas);
    this.input.keyboard.clearCaptures(); // ať jde do políčka psát mezera
    Textury.voda(this);
    Textury.bublinky(this);

    this.add.text(S / 2, 54, 'MISE SPLNĚNA!', {
      fontFamily: N.PISMO_NADPIS, fontSize: '74px', color: '#ffd43b', stroke: '#1b1b1b', strokeThickness: 11,
    }).setOrigin(0.5).setAngle(-2);

    // levá půlka: výsledek
    const podil = celkem ? kosti / celkem : 1;
    const hvezdy = podil >= 0.9 ? 3 : podil >= 0.5 ? 2 : 1;
    for (let i = 0; i < 3; i++) {
      const h = this.add.text(240 + (i - 1) * 74, 140, '★', {
        fontFamily: 'sans-serif', fontSize: '70px', color: i < hvezdy ? '#ffd43b' : '#355070', stroke: '#1b1b1b', strokeThickness: 6,
      }).setOrigin(0.5).setScale(0);
      this.tweens.add({ targets: h, scale: 1, delay: 300 + i * 250, duration: 350, ease: 'Back.out', onStart: () => i < hvezdy && Zvuky.kost() });
    }
    const styl = { fontFamily: N.PISMO, fontSize: '32px', color: '#ffffff', stroke: '#0b2a55', strokeThickness: 6 };
    this.add.text(240, 215, `⏱ ${formatCas(cas)}`, { ...styl, fontFamily: N.PISMO_NADPIS, fontSize: '54px', color: '#ffd43b' }).setOrigin(0.5);
    this.add.text(240, 270, `Kosti: ${kosti} / ${celkem}`, styl).setOrigin(0.5);
    this.add.text(240, 308, `Zničené rybky: ${zniceno || 0}`, styl).setOrigin(0.5);

    // pravá půlka: Síň slávy
    this.add.text(690, 112, 'SÍŇ SLÁVY', {
      fontFamily: N.PISMO_NADPIS, fontSize: '40px', color: '#ffffff', stroke: '#1b1b1b', strokeThickness: 7,
    }).setOrigin(0.5);
    this.tabulka = this.add.container(0, 0);

    const misto = Ulozeni.poradi(uroven, cas);
    if (misto) this.zeptejSeNaJmeno(misto);
    else this.ukazTabulku(-1);

    this.prizpusobSirce();
    this.tlacitko(160, 480, 'ZNOVU', () => this.scene.start('Ponor', { uroven }));
    this.tlacitko(400, 480, 'MENU', () => this.scene.start('Menu'));
  }

  // obsah je rozvržený na šířku 960, na širší obrazovce ho kamera vycentruje
  prizpusobSirce() {
    this.cameras.main.setSize(N.SIRKA, N.VYSKA);
    this.cameras.main.setScroll(-(N.SIRKA - N.ZAKLADNI_SIRKA) / 2, 0);
  }

  zeptejSeNaJmeno(misto) {
    const vyzva = this.add.text(690, 170, `${misto}. místo! Kdo hrál?`, {
      fontFamily: N.PISMO, fontSize: '32px', color: '#ffd43b', stroke: '#0b2a55', strokeThickness: 6,
    }).setOrigin(0.5);
    const policko = this.add.dom(690, 230, 'input', [
      'width: 280px', 'font: 30px "Patrick Hand", sans-serif', 'padding: 6px 12px', 'border: 4px solid #1b1b1b',
      'border-radius: 12px', 'text-align: center', 'outline: none',
    ].join(';'));
    const input = policko.node;
    input.maxLength = 12;
    input.value = Ulozeni.posledniJmeno();
    input.placeholder = 'Tvoje jméno';
    this.time.delayedCall(100, () => input.focus());

    const ulozit = () => {
      const jmeno = input.value.trim().slice(0, 12) || 'Neznámý hrdina';
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
    const tl = this.tlacitko(690, 305, 'ZAPSAT', ulozit, 200, 64);
  }

  ukazTabulku(zvyraznit) {
    const rekordy = Ulozeni.rekordy(this.uroven).slice(0, 7);
    if (!rekordy.length) {
      this.tabulka.add(this.add.text(690, 220, 'Zatím prázdná', { fontFamily: N.PISMO, fontSize: '30px', color: '#d0ebff' }).setOrigin(0.5));
      return;
    }
    rekordy.forEach((r, i) => {
      const y = 160 + i * 42;
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
      this.input.keyboard.once('keydown-ENTER', () => this.scene.start('Ponor', { uroven: this.uroven }));
    });
  }

  tlacitko(x, y, popis, akce, sirka = 220, vyska = 76) {
    const r = this.add.rectangle(x, y, sirka, vyska, 0xff922b).setStrokeStyle(6, 0x1b1b1b).setInteractive({ useHandCursor: true });
    const t = this.add.text(x, y + 2, popis, {
      fontFamily: N.PISMO_NADPIS, fontSize: `${Math.round(vyska * 0.58)}px`, color: '#ffffff', stroke: '#1b1b1b', strokeThickness: 7,
    }).setOrigin(0.5);
    r.on('pointerdown', () => { Zvuky.klik(); akce(); });
    return [r, t];
  }
}
