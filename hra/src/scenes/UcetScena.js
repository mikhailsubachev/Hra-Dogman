// Přihlášení a registrace hráče: přezdívka a 4místný PIN.
class UcetScena extends Phaser.Scene {
  constructor() { super('Ucet'); }

  create() {
    const S = N.ZAKLADNI_SIRKA; // rozvržení na 960, kamera ho na širší obrazovce vycentruje
    Textury.voda(this);
    Textury.bublinky(this);
    this.input.keyboard.clearCaptures(); // ať jde do políček psát
    this.prizpusobSirce();
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('Menu'));

    this.add.text(S / 2, 64, t('ucet_nadpis'), {
      fontFamily: N.PISMO_NADPIS, fontSize: '68px', color: '#ffd43b', stroke: '#1b1b1b', strokeThickness: 10,
    }).setOrigin(0.5);
    const styl = { fontFamily: N.PISMO, fontSize: '30px', color: '#ffffff', stroke: '#0b2a55', strokeThickness: 6, align: 'center' };

    if (Ucet.prihlaseny) {
      this.add.text(S / 2, 190, t('ucet_hraje', { jmeno: Ucet.prezdivka }), { ...styl, fontSize: '44px', color: '#ffd43b' }).setOrigin(0.5);
      this.add.text(S / 2, 265, t('ucet_info'), styl).setOrigin(0.5);
      this.tlacitko(S / 2 - 130, 400, t('ucet_odhlasit'), () => { Ucet.odhlas(); this.scene.start('Menu'); });
      this.tlacitko(S / 2 + 130, 400, t('zpet'), () => this.scene.start('Menu'));
      return;
    }

    this.add.text(S / 2, 132, t('ucet_novy_info'), {
      ...styl, fontSize: '25px', color: '#d0ebff', wordWrap: { width: 760 },
    }).setOrigin(0.5);
    const policko = 'width: 300px; font: 30px "Patrick Hand", "Pangolin", sans-serif; padding: 6px 12px; border: 4px solid #1b1b1b; '
      + 'border-radius: 12px; text-align: center; outline: none;';
    const formular = this.add.dom(S / 2, 240).createFromHTML(`
      <div style="display: flex; flex-direction: column; gap: 14px; align-items: center;">
        <input name="prezdivka" maxlength="12" autocomplete="off" autocapitalize="words" placeholder="${t('ucet_prezdivka')}" style='${policko}'>
        <input name="pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" placeholder="${t('ucet_pin')}" style='${policko}'>
      </div>`);
    const prezdivka = formular.getChildByName('prezdivka');
    const pin = formular.getChildByName('pin');
    prezdivka.value = Ulozeni.posledniJmeno();
    pin.addEventListener('input', () => { pin.value = pin.value.replace(/\D/g, '').slice(0, 4); });
    this.zprava = this.add.text(S / 2, 340, '', { ...styl, fontSize: '26px', color: '#ff8787' }).setOrigin(0.5);

    let pracuji = false;
    const odeslat = async (akce) => {
      if (pracuji) return;
      if (prezdivka.value.trim().length < 2) return this.zprava.setText(t('ucet_kratka_prezdivka'));
      if (pin.value.length !== 4) return this.zprava.setText(t('ucet_pin_4'));
      pracuji = true;
      this.zprava.setColor('#d0ebff').setText(t(akce === 'registrace' ? 'ucet_zakladam' : 'ucet_prihlasuji'));
      const chyba = await Ucet.vstup(akce, prezdivka.value.trim(), pin.value);
      pracuji = false;
      if (!this.sys.isActive()) return;
      if (chyba) {
        this.zprava.setColor('#ff8787').setText(chyba);
        return;
      }
      Zvuky.checkpoint();
      this.scene.start('Menu');
    };
    for (const pole of [prezdivka, pin]) {
      pole.addEventListener('keydown', (e) => {
        e.stopPropagation(); // písmena a Enter patří políčku, ne hře
        if (e.key === 'Enter') odeslat('prihlaseni');
      });
    }
    this.time.delayedCall(100, () => (prezdivka.value ? pin : prezdivka).focus());

    this.tlacitko(S / 2 - 240, 430, t('ucet_prihlasit'), () => odeslat('prihlaseni'));
    this.tlacitko(S / 2, 430, t('ucet_novy'), () => odeslat('registrace'));
    this.tlacitko(S / 2 + 240, 430, t('zpet'), () => this.scene.start('Menu'));
  }

  prizpusobSirce() {
    this.cameras.main.setSize(N.SIRKA, N.VYSKA);
    this.cameras.main.setScroll(-(N.SIRKA - N.ZAKLADNI_SIRKA) / 2, 0);
  }

  tlacitko(x, y, popis, akce) {
    const r = this.add.rectangle(x, y, 220, 70, 0xff922b).setStrokeStyle(6, 0x1b1b1b).setInteractive({ useHandCursor: true });
    const napis = this.add.text(x, y + 2, popis, {
      fontFamily: N.PISMO_NADPIS, fontSize: '36px', color: '#ffffff', stroke: '#1b1b1b', strokeThickness: 7,
    }).setOrigin(0.5);
    if (napis.width > 200) napis.setScale(200 / napis.width); // dlouhý překlad se zmenší
    r.on('pointerup', () => { Zvuky.klik(); akce(); });
  }
}
