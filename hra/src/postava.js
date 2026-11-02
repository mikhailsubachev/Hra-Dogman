// Za koho se hraje: Dog Man (štěká) nebo Peťulka (je menší a střílí bubliny).
// Volba se pamatuje v prohlížeči jako jazyk, ?postava=petulka v adrese ji přepne.
// Síň slávy postavu nerozlišuje, čas je čas.
const Postava = {
  KLIC: 'dogman-postava',
  SEZNAM: ['dogman', 'petulka'],
  kod: 'dogman',

  nacti() {
    let kod = null;
    try { kod = localStorage.getItem(this.KLIC); } catch (e) { /* bez úložiště zůstane Dog Man */ }
    const zAdresy = new URLSearchParams(window.location.search).get('postava');
    if (zAdresy) kod = zAdresy;
    this.kod = this.SEZNAM.includes(kod) ? kod : 'dogman';
  },

  nastav(kod) {
    if (!this.SEZNAM.includes(kod)) return;
    this.kod = kod;
    try { localStorage.setItem(this.KLIC, kod); } catch (e) { /* jen do zavření stránky */ }
  },

  // nápis schopnosti do nápověd: HAF! nebo BUBL!
  get schopnost() { return t(this.kod === 'petulka' ? 'bubl' : 'haf'); },
};
