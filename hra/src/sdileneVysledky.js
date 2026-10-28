// Server hry (soubor server/vysledky.php na hostingu): sdílená Síň slávy a hráči.
// Bez adresy v N.SIN_SLAVY_ADRESA nebo bez internetu hra použije jen výsledky z tohoto zařízení.
const SdileneVysledky = {
  get zapnuto() { return !!N.SIN_SLAVY_ADRESA; },

  // vrací { ok, data } (i chybovou odpověď serveru), nebo null, když server neodpoví (do 5 s)
  async dotaz(parametry, telo) {
    if (!this.zapnuto) return null;
    const stop = new AbortController();
    const casovac = setTimeout(() => stop.abort(), 5000);
    try {
      const odpoved = await fetch(N.SIN_SLAVY_ADRESA + parametry, {
        method: telo ? 'POST' : 'GET',
        // text/plain: prohlížeč se nemusí serveru předem ptát (bez CORS preflightu)
        headers: telo ? { 'Content-Type': 'text/plain' } : undefined,
        body: telo ? JSON.stringify(telo) : undefined,
        signal: stop.signal,
      });
      const data = await odpoved.json();
      return { ok: odpoved.ok, data };
    } catch (e) {
      return null;
    } finally {
      clearTimeout(casovac);
    }
  },

  async nacti(uroven) {
    const o = await this.dotaz(`?uroven=${encodeURIComponent(uroven)}`);
    return o && o.ok && Array.isArray(o.data.rekordy) ? o.data.rekordy : null;
  },
};
