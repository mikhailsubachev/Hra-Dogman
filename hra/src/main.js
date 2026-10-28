// Spuštění hry. Nejdřív počkáme na komiksová písma (nejdéle 2 sekundy).

// Výška hry je vždy 540, šířka se přizpůsobí obrazovce: na širokém telefonu
// je hra širší, takže vyplní celou obrazovku bez černých pruhů po stranách.
N.ZAKLADNI_SIRKA = 960;
function sirkaPodleObrazovky() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (!w || !h || h > w) return N.ZAKLADNI_SIRKA; // na výšku platí výzva „otoč telefon“
  return Math.round(Phaser.Math.Clamp((N.VYSKA * w) / h, 960, 1400) / 2) * 2;
}
N.SIRKA = sirkaPodleObrazovky();

// Komiksové písmo Bangers je skloněné a Phaser měří text bez přesahu,
// takže by se poslednímu písmenu uřízl kraj. Nadpisy proto dostanou okraj.
const puvodniText = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, text, styl) {
  if (styl && styl.fontFamily === N.PISMO_NADPIS && !styl.padding) {
    const velikost = parseInt(styl.fontSize, 10) || 30;
    styl = { ...styl, padding: { x: Math.ceil(velikost * 0.15), y: 2 } };
  }
  return puvodniText.call(this, x, y, text, styl);
};

const KONFIGURACE = {
  type: Phaser.AUTO,
  parent: 'hra',
  width: N.SIRKA,
  height: N.VYSKA,
  backgroundColor: '#0b2a55',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { y: N.GRAVITACE }, debug: false } },
  input: { activePointers: 4 },
  dom: { createContainer: true }, // pro políčko se jménem v Síni slávy
  scene: [ZavadeciScena, MenuScena, KomiksScena, PonorScena, ChobotniceScena, KonecScena],
};

// Po otočení telefonu nebo změně okna: nová šířka hry. Scény, které to umí,
// se jen přeskládají (rozehraná úroveň pokračuje), ostatní se spustí znovu.
function prizpusobSirku() {
  const hra = window.hra;
  if (!hra || !hra.scale) return;
  const nova = sirkaPodleObrazovky();
  if (nova !== N.SIRKA) {
    N.SIRKA = nova;
    hra.scale.setGameSize(nova, N.VYSKA);
    for (const scena of hra.scene.getScenes(true)) {
      if (scena.prizpusobSirce) scena.prizpusobSirce();
      else if (scena.scene.key !== 'Zavadeci') scena.scene.restart(scena.sys.settings.data);
    }
  }
  hra.scale.refresh();
}

// Na mobilu: první dotyk zapne celou obrazovku (zmizí adresní řádek) a zamkne šířku.
function naCelouObrazovku() {
  const el = document.documentElement;
  if (document.fullscreenElement || !el.requestFullscreen) return Promise.resolve();
  return el.requestFullscreen({ navigationUI: 'hide' })
    .then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}))
    .catch(() => {});
}
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  document.addEventListener('touchend', naCelouObrazovku, { once: true });
}

const ceskaPismena = 'ČĚŠŘŽÝÁÍÉŮÚ čěšřžýáíéůú';
Promise.race([
  Promise.all([
    document.fonts.load('40px "Bangers"', ceskaPismena),
    document.fonts.load('20px "Patrick Hand"', ceskaPismena),
  ]),
  new Promise((hotovo) => setTimeout(hotovo, 2000)),
]).catch(() => {}).then(() => {
  N.SIRKA = sirkaPodleObrazovky();
  KONFIGURACE.width = N.SIRKA;
  window.hra = new Phaser.Game(KONFIGURACE);
  let cekani = null;
  const poZmene = () => { clearTimeout(cekani); cekani = setTimeout(prizpusobSirku, 150); };
  const obal = document.getElementById('hra');
  if (window.ResizeObserver) new ResizeObserver(poZmene).observe(obal);
  window.addEventListener('orientationchange', poZmene);
  document.addEventListener('fullscreenchange', poZmene);
});
