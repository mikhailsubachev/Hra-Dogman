// Společný základ všech hratelných úrovní: Dog Man, ovládání, kyslík, štěkot,
// zásahy, horní lišta a efekty. Jednotlivé úrovně (Ponor, Chobotnice) z něj dědí.
class HerniScena extends Phaser.Scene {
  // připraví Dog Mana, ovládání a stav hry; volá se v create() každé úrovně
  pripravHrace(start, ukazateleNastaveni) {
    this.start = { ...start };
    this.kontrolniBod = { ...start };
    this.hrac = new DogMan(this, start.x, start.y);
    this.seznamNepratel = this.seznamNepratel || [];

    this.kyslik = N.KYSLIK.max;
    this.varovaniKysliku = false;
    this.hafPripravenOd = 0;
    this.zniceno = 0;
    this.zasahu = 0;
    this.hotovo = false;
    this.zacatek = this.time.now;
    this.casHry = 0;
    this.predchozi = { skok: false, haf: false };

    this.klavesy = this.input.keyboard.addKeys('LEFT,RIGHT,UP,A,D,W,SPACE,X,K,ESC');
    this.input.keyboard.addCapture('SPACE,UP,DOWN,LEFT,RIGHT');
    this.dotyk = jeDotykoveZarizeni(this) ? new DotykoveOvladani(this) : null;
    this.ukazatele = new Ukazatele(this, ukazateleNastaveni);
  }

  // název úrovně a na mobilu krátká nápověda k ovládání
  ukazNazev(nazev) {
    const t = this.add.text(N.SIRKA / 2, 110, nazev, {
      fontFamily: N.PISMO_NADPIS, fontSize: '54px', color: '#ffffff', stroke: '#0b2a55', strokeThickness: 10,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
    this.tweens.add({ targets: t, alpha: 0, delay: 1800, duration: 700, onComplete: () => t.destroy() });
    if (this.dotyk) {
      const styl = { fontFamily: N.PISMO, fontSize: '34px', color: '#ffffff', stroke: '#0b2a55', strokeThickness: 7, align: 'center' };
      const vlevo = this.add.text(N.SIRKA * 0.25, N.VYSKA - 90, '◀ táhni ▶\nchůze', styl).setOrigin(0.5).setScrollFactor(0).setDepth(200);
      const vpravo = this.add.text(N.SIRKA * 0.75, N.VYSKA - 90, 'ťukni = skok\n2× ťukni = HAF', styl).setOrigin(0.5).setScrollFactor(0).setDepth(200);
      const cara = this.add.rectangle(N.SIRKA / 2, N.VYSKA / 2 + 40, 3, N.VYSKA - 160, 0xffffff, 0.35).setScrollFactor(0).setDepth(200);
      this.tweens.add({ targets: [vlevo, vpravo, cara], alpha: 0, delay: 3500, duration: 800, onComplete: () => [vlevo, vpravo, cara].forEach((o) => o.destroy()) });
    }
  }

  // společná část update(): ovládání, kyslík, stopky. Vrací ovládání, nebo null při odchodu do menu.
  zakladniUpdate(cas, delta) {
    const ov = this.ctiOvladani();
    if (Phaser.Input.Keyboard.JustDown(this.klavesy.ESC)) { this.doMenu(); return null; }
    this.hrac.update(ov, cas);
    if (ov.hafStisknut) this.haf(cas);

    if (N.KYSLIK.zapnuto && !this.hotovo && !this.hrac.zmrazeny) {
      this.kyslik -= (N.KYSLIK.ubytekZaSekundu * delta) / 1000;
      if (this.kyslik < N.KYSLIK.max * 0.25 && !this.varovaniKysliku) {
        this.varovaniKysliku = true;
        this.vyskakovaciText(this.hrac.x, this.hrac.y - 60, 'Málo kyslíku!', '#ff6b6b');
      }
      if (this.kyslik <= 0) this.zasah('Došel kyslík!');
    }
    if (!this.hotovo) this.casHry = this.time.now - this.zacatek;
    return ov;
  }

  ctiOvladani() {
    const k = this.klavesy;
    const d = this.dotyk ? this.dotyk.stav() : {};
    const skok = k.UP.isDown || k.W.isDown || k.SPACE.isDown || !!d.skok;
    const haf = k.X.isDown || k.K.isDown || !!d.haf;
    const ov = {
      vlevo: k.LEFT.isDown || k.A.isDown || !!d.vlevo,
      vpravo: k.RIGHT.isDown || k.D.isDown || !!d.vpravo,
      osaX: d.osaX || 0,
      skok,
      haf,
      skokStisknut: skok && !this.predchozi.skok,
      hafStisknut: haf && !this.predchozi.haf,
    };
    this.predchozi = { skok, haf };
    return ov;
  }

  // --- události ---

  seberKyslik(bublina) {
    bublina.destroy();
    this.kyslik = Math.min(N.KYSLIK.max, this.kyslik + N.KYSLIK.bublina);
    this.varovaniKysliku = false;
    Zvuky.kyslik();
    this.vypustBublinky(bublina.x, bublina.y, 6);
  }

  zasah(hlaska) {
    if (!this.hrac.zranitelny || this.hotovo) return;
    this.zasahu++;
    Zvuky.zasah();
    this.cameras.main.shake(160, 0.006);
    this.vyskakovaciText(this.hrac.x, this.hrac.y - 50, hlaska, '#ff8787');
    this.vypustBublinky(this.hrac.x, this.hrac.y, 10);
    this.hrac.zmraz();
    this.time.delayedCall(450, () => {
      this.hrac.presun(this.kontrolniBod.x, this.kontrolniBod.y);
      this.kyslik = Math.max(this.kyslik, N.KYSLIK.max * 0.6);
      this.varovaniKysliku = false;
    });
  }

  dotekNepritele(nepritel) {
    if (!nepritel.zivy || this.hrac.zmrazeny || this.hotovo) return;
    const hrac = this.hrac.telo.body;
    const shora = hrac.velocity.y > 0 && hrac.bottom <= nepritel.sprite.body.top + 18;
    if (shora) {
      const hlaska = nepritel.skokShora();
      if (!nepritel.zivy) this.zniceno++;
      this.hrac.odraz(this.predchozi.skok);
      Zvuky.bum();
      this.vyskakovaciText(nepritel.sprite.x, nepritel.sprite.y - 40, hlaska, '#ffd43b');
      return;
    }
    if (nepritel.nebezpecny) this.zasah('AU!');
  }

  haf(cas) {
    if (cas < this.hafPripravenOd || this.hrac.zmrazeny || this.hotovo) return;
    // štěk stojí kyslík, jiný limit nemá: kdo se uštěká, utone
    if (N.KYSLIK.zapnuto) {
      this.kyslik -= N.HAF.kyslik;
      this.vyskakovaciText(this.hrac.x + 50, this.hrac.y - 20, `-${N.HAF.kyslik} O2`, '#74c0fc', 24);
    }
    this.hafPripravenOd = cas + N.HAF.pauza;
    Zvuky.haf();
    this.vyskakovaciText(this.hrac.x, this.hrac.y - 50, 'HAF!', '#ffd43b', 44);
    const kruh = this.add.circle(this.hrac.x, this.hrac.y, N.HAF.dosah).setStrokeStyle(6, 0xffd43b, 0.9).setDepth(4).setScale(0.1);
    this.tweens.add({ targets: kruh, scale: 1, alpha: 0, duration: 380, onComplete: () => kruh.destroy() });
    if (this.omracHafem()) Zvuky.omraceni();
    if (N.KYSLIK.zapnuto && this.kyslik <= 0) this.zasah('Uštěkal se!');
  }

  // co štěkot omráčí; úrovně mohou přidat vlastní cíle (chapadla)
  omracHafem() {
    let zasazeno = false;
    for (const n of this.seznamNepratel) {
      if (!n.zivy) continue;
      const d = Phaser.Math.Distance.Between(this.hrac.x, this.hrac.y, n.sprite.x, n.sprite.y);
      if (d < N.HAF.dosah && n.nebezpecny) {
        n.omrac(N.HAF.omraceni);
        zasazeno = true;
      }
    }
    return zasazeno;
  }

  // konec úrovně: případně komiks a pak výsledky na obrazovku Mise splněna
  dokonceno(data) {
    const vysledky = { uroven: this.idUrovne, cas: Math.round(this.casHry), zniceno: this.zniceno, zasahu: this.zasahu, ...data };
    const uroven = Postup.najdi(this.idUrovne);
    this.time.delayedCall(300, () => {
      this.cameras.main.fadeOut(400);
      this.time.delayedCall(450, () => {
        if (uroven && uroven.komiksPo) {
          this.scene.start('Komiks', { panely: uroven.komiksPo(), dalsi: { scena: 'Konec', data: vysledky } });
        } else {
          this.scene.start('Konec', vysledky);
        }
      });
    });
  }

  // po otočení telefonu: větší záběr kamery a přeskládaná lišta, hra běží dál
  prizpusobSirce() {
    this.cameras.main.setSize(N.SIRKA, N.VYSKA);
    this.ukazatele.rozmisti();
  }

  doMenu() {
    this.scene.start('Menu');
  }

  // --- efekty ---

  vypustBublinky(x, y, pocet) {
    for (let i = 0; i < pocet; i++) {
      const b = this.add.image(x + Phaser.Math.Between(-14, 14), y, 'bublinka').setDepth(6).setScale(Phaser.Math.FloatBetween(0.5, 1.2));
      this.tweens.add({
        targets: b, y: y - Phaser.Math.Between(50, 110), x: b.x + Phaser.Math.Between(-15, 15), alpha: 0,
        duration: Phaser.Math.Between(500, 900), onComplete: () => b.destroy(),
      });
    }
  }

  rozsypSrouby(x, y, pocet = 8, rozptyl = 70) {
    for (let i = 0; i < pocet; i++) {
      const sroub = this.add.rectangle(x, y, 6, 6, i % 2 ? 0x8a9bb0 : 0x495057).setDepth(6);
      this.tweens.add({
        targets: sroub,
        x: x + Phaser.Math.Between(-rozptyl, rozptyl), y: y + Phaser.Math.Between(-rozptyl, rozptyl * 0.6), angle: Phaser.Math.Between(-360, 360),
        alpha: 0, duration: Phaser.Math.Between(500, 1100), onComplete: () => sroub.destroy(),
      });
    }
  }

  vyskakovaciText(x, y, text, barva = '#ffffff', velikost = 34) {
    const t = this.add.text(x, y, text, {
      fontFamily: N.PISMO_NADPIS, fontSize: `${velikost}px`, color: barva, stroke: '#1b1b1b', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, delay: 350, duration: 700, onComplete: () => t.destroy() });
  }

  // bublina s řečí postavy (komiksová), zmizí po chvíli
  rekni(x, y, text, barva = '#1b1622', doba = 2200) {
    const t = this.add.text(x, y, text, {
      fontFamily: N.PISMO, fontSize: '26px', color: barva, backgroundColor: '#ffffff', padding: { x: 10, y: 6 },
      align: 'center', wordWrap: { width: 260 },
    }).setOrigin(0.5, 1).setDepth(60);
    this.tweens.add({ targets: t, alpha: 0, delay: doba, duration: 400, onComplete: () => t.destroy() });
    return t;
  }
}
