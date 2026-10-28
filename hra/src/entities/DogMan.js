// Dog Man: jediná hratelná postava.
// Fyzika je neviditelné "tělo", obrázek se k němu jen přikresluje. Díky tomu
// může obrázek houpat a naklánět se, aniž by to rozbilo srážky s dnem.
class DogMan {
  constructor(scene, x, y) {
    this.scene = scene;
    // velikost postavy ve hře (výška v pixelech); obrázek se zmenší, ať je jakkoli velký
    const VYSKA_POSTAVY = 72;
    this.telo = scene.physics.add.sprite(x, y, 'dogman').setVisible(false);
    const w = this.telo.width;
    const h = this.telo.height;
    this.meritko = VYSKA_POSTAVY / h;
    this.telo.setScale(this.meritko);
    // fyzikální tělo: jen trup a hlava (plášť a nunčaky nepočítáme), spodek přesně u bot
    this.telo.body.setSize(w * 0.34, h * 0.7).setOffset(w * 0.37, h * 0.245);
    this.telo.body.setMaxVelocity(N.DOGMAN.rychlost, 2000);
    this.telo.setCollideWorldBounds(true);

    this.obrazek = scene.add.image(x, y, 'dogman').setDepth(5).setScale(this.meritko);
    this.smer = 1;
    this.pohyb = 0;
    this.naZemi = false;
    this.posledniNaZemi = -1000;   // pro "skok i chvilku po sejití z hrany"
    this.skokPozadan = -1000;      // pro "skok zmáčknutý chvilku před dopadem"
    this.nezranitelnyDo = 0;
    this.zmrazeny = false;
    this.odrazDo = 0;

    scene.events.on('postupdate', this.vykresli, this);
    scene.events.once('shutdown', () => scene.events.off('postupdate', this.vykresli, this));
  }

  get x() { return this.telo.x; }
  get y() { return this.telo.y; }

  update(ovladani, cas) {
    const b = this.telo.body;
    if (this.zmrazeny) {
      b.setVelocity(0, 0);
      return;
    }

    this.naZemi = b.blocked.down || b.touching.down;
    if (this.naZemi) this.posledniNaZemi = cas;

    // chůze: pod vodou se rozjíždí a brzdí trochu líně
    // klávesy dávají -1 / 0 / 1, kolečko na mobilu i něco mezi (pomalejší chůze)
    const klavesy = (ovladani.vpravo ? 1 : 0) - (ovladani.vlevo ? 1 : 0);
    this.pohyb = ovladani.osaX ? ovladani.osaX : klavesy;
    if (this.pohyb !== 0) this.smer = Math.sign(this.pohyb);
    const cil = this.pohyb * N.DOGMAN.rychlost;
    // chvíli po odhození (chobotnicí) ovládání nebrzdí let do strany
    if (cas > (this.odhozenDo || 0)) b.velocity.x = Phaser.Math.Linear(b.velocity.x, cil, this.naZemi ? 0.35 : 0.12);

    // skok s malou tolerancí, aby to dětem "nepropadlo"
    if (ovladani.skokStisknut) this.skokPozadan = cas;
    if (cas - this.skokPozadan < 130 && cas - this.posledniNaZemi < 120) {
      b.velocity.y = -N.DOGMAN.skok;
      this.skokPozadan = -1000;
      this.posledniNaZemi = -1000;
      Zvuky.skok();
      this.scene.vypustBublinky(this.x, this.y + 24, 3);
    }
    // krátké zmáčknutí = nízký skok (ne hned po odrazu od nepřítele)
    if (!ovladani.skok && b.velocity.y < -200 && cas > this.odrazDo) b.velocity.y = -200;
    // voda brzdí pád
    if (b.velocity.y > N.DOGMAN.maxPad) b.velocity.y = N.DOGMAN.maxPad;
  }

  vykresli() {
    const t = this.scene.time.now;
    let dy = 0;
    let uhel = 0;
    if (this.zmrazeny) {
      uhel = Math.sin(t * 0.03) * 12;
    } else if (!this.naZemi) {
      uhel = this.telo.body.velocity.y < 0 ? 10 * this.smer : -5 * this.smer;
    } else if (this.pohyb !== 0) {
      dy = -Math.abs(Math.sin(t * 0.018)) * 5;   // poskakování při chůzi
      uhel = Math.sin(t * 0.018) * 6;            // kolébání
    } else {
      dy = Math.sin(t * 0.004) * 1.5;            // klidné pohupování ve vodě
    }
    this.obrazek
      .setPosition(this.telo.x, this.telo.y + dy)
      .setAngle(uhel)
      .setFlipX(this.smer < 0)
      .setAlpha(t < this.nezranitelnyDo && Math.floor(t / 90) % 2 ? 0.35 : 1);
  }

  get zranitelny() {
    return !this.zmrazeny && this.scene.time.now >= this.nezranitelnyDo;
  }

  // odskok po skoku na nepřítele; se zmáčknutým skokem vyletí výš
  odraz(drziSkok) {
    this.telo.body.velocity.y = -(drziSkok ? N.DOGMAN.skok : N.SKOK_NA_NEPRITELE.odraz);
    this.odrazDo = this.scene.time.now + 250;
    this.posledniNaZemi = -1000;
  }

  // odhození do strany (třeba z hlavy chobotnice)
  odhod(vx, vy) {
    this.telo.body.velocity.x = vx;
    this.telo.body.velocity.y = vy;
    this.odhozenDo = this.scene.time.now + 600;
    this.odrazDo = this.scene.time.now + 250;
  }

  // proud bublin zespodu: tlačí nahoru a krátký skok ho nepřibrzdí
  vynes(sila, max) {
    const b = this.telo.body;
    b.velocity.y = Math.max(b.velocity.y - sila, -max);
    this.odrazDo = this.scene.time.now + 120;
    this.posledniNaZemi = -1000;
  }

  odpoj() { this.scene.events.off('postupdate', this.vykresli, this); }

  zmraz() { this.zmrazeny = true; this.telo.body.setAllowGravity(false); }

  presun(x, y) {
    this.telo.setPosition(x, y);
    this.telo.body.reset(x, y);
    this.telo.body.setAllowGravity(true);
    this.zmrazeny = false;
    this.nezranitelnyDo = this.scene.time.now + 1500;
  }
}
