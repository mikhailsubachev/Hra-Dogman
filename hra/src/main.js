// Spuštění hry. Nejdřív počkáme na komiksová písma (nejdéle 2 sekundy).
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
  scene: [ZavadeciScena, MenuScena, KomiksScena, PonorScena, KonecScena],
};

const ceskaPismena = 'ČĚŠŘŽÝÁÍÉŮÚ čěšřžýáíéůú';
Promise.race([
  Promise.all([
    document.fonts.load('40px "Bangers"', ceskaPismena),
    document.fonts.load('20px "Patrick Hand"', ceskaPismena),
  ]),
  new Promise((hotovo) => setTimeout(hotovo, 2000)),
]).catch(() => {}).then(() => {
  window.hra = new Phaser.Game(KONFIGURACE);
  // přepočítat velikost při otočení mobilu nebo změně okna
  const obal = document.getElementById('hra');
  if (window.ResizeObserver) new ResizeObserver(() => window.hra.scale.refresh()).observe(obal);
});
