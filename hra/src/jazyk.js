// Jazyk hry: čeština (výchozí), angličtina a ruština. Texty jsou ve složce texty/.
// Volba jazyka se pamatuje v prohlížeči (i na mobilu), ?jazyk=en v adrese ji přepne.
const TEXTY = {};

const Jazyk = {
  KLIC: 'dogman-jazyk',
  SEZNAM: ['cs', 'en', 'ru'],
  kod: 'cs',

  nacti() {
    let kod = null;
    try { kod = localStorage.getItem(this.KLIC); } catch (e) { /* bez úložiště zůstane čeština */ }
    const zAdresy = new URLSearchParams(window.location.search).get('jazyk');
    if (zAdresy) kod = zAdresy;
    this.kod = this.SEZNAM.includes(kod) ? kod : 'cs';
    this.poZmene();
  },

  nastav(kod) {
    if (!this.SEZNAM.includes(kod)) return;
    this.kod = kod;
    try { localStorage.setItem(this.KLIC, kod); } catch (e) { /* jen do zavření stránky */ }
    this.poZmene();
  },

  // texty mimo hru: jazyk stránky a výzva k otočení telefonu
  poZmene() {
    document.documentElement.lang = this.kod;
    const otoc = document.getElementById('otoc');
    if (otoc) otoc.innerHTML = `<b>↻</b>${t('otoc_telefon')}`;
  },
};

// text podle klíče v aktuálním jazyce; {nazev} nahradí hodnotou z parametry
function t(klic, parametry) {
  const preklad = TEXTY[Jazyk.kod] && TEXTY[Jazyk.kod][klic];
  let text = preklad !== undefined ? preklad : TEXTY.cs[klic];
  if (text === undefined) return klic;
  if (typeof text === 'string' && parametry) {
    text = text.replace(/\{(\w+)\}/g, (cely, jmeno) => (parametry[jmeno] !== undefined ? parametry[jmeno] : cely));
  }
  return text;
}

// chyba ze serveru (server píše česky) v aktuálním jazyce
function prelozChybu(chyba) {
  const server = t('server');
  return (server && server[chyba]) || chyba;
}
