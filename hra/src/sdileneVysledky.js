// Sdílená Síň slávy na serveru (soubor server/vysledky.php na hostingu).
// Bez adresy v N.SIN_SLAVY_ADRESA nebo bez internetu hra použije jen výsledky z tohoto zařízení.
const SdileneVysledky = {
  get zapnuto() { return !!N.SIN_SLAVY_ADRESA; },

  // vrací odpověď serveru, nebo null, když se to nepovede (do 5 s)
  async dotaz(parametry, telo) {
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
      if (!odpoved.ok) return null;
      return await odpoved.json();
    } catch (e) {
      return null;
    } finally {
      clearTimeout(casovac);
    }
  },

  async nacti(uroven) {
    const data = await this.dotaz(`?uroven=${encodeURIComponent(uroven)}`);
    return data && Array.isArray(data.rekordy) ? data.rekordy : null;
  },

  // { rekordy, poradi } nebo null
  async zapis(uroven, jmeno, cas, kosti) {
    const data = await this.dotaz('', { uroven, jmeno, cas, kosti });
    return data && Array.isArray(data.rekordy) ? data : null;
  },
};
