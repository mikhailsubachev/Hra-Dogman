// Server hry (soubor server/vysledky.php na hostingu): sdílená Síň slávy a hráči.
// Bez adresy v N.SIN_SLAVY_ADRESA nebo bez internetu hra použije jen výsledky z tohoto zařízení.
const SdileneVysledky = {
  get zapnuto() { return !!N.SIN_SLAVY_ADRESA; },

  chyba: '', // proč server naposledy neodpověděl (ukáže se v Síni slávy)

  // vrací { ok, data } (i chybovou odpověď serveru), nebo null, když server neodpoví (do 8 s)
  async dotaz(parametry, telo) {
    if (!this.zapnuto) return null;
    const stop = new AbortController();
    const casovac = setTimeout(() => stop.abort(), 8000);
    try {
      const odpoved = await fetch(N.SIN_SLAVY_ADRESA + parametry, {
        method: telo ? 'POST' : 'GET',
        // text/plain: prohlížeč se nemusí serveru předem ptát (bez CORS preflightu)
        headers: telo ? { 'Content-Type': 'text/plain' } : undefined,
        body: telo ? JSON.stringify(telo) : undefined,
        signal: stop.signal,
      });
      const text = await odpoved.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        // místo odpovědi hry přišlo něco jiného (třeba stránka hostingu)
        this.chyba = `HTTP ${odpoved.status}: ${text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)}`;
        console.warn('Síň slávy: server neposlal výsledky', odpoved.status, text.slice(0, 300));
        return null;
      }
      return { ok: odpoved.ok, data };
    } catch (e) {
      this.chyba = e.name === 'AbortError' ? 'timeout' : `${e.name}: ${e.message}`;
      console.warn('Síň slávy: server neodpověděl', e);
      return null;
    } finally {
      clearTimeout(casovac);
    }
  },

  // tabulka úrovně; když server napoprvé neodpoví, zkusí to ještě jednou
  async nacti(uroven) {
    const adresa = `?uroven=${encodeURIComponent(uroven)}`;
    const o = (await this.dotaz(adresa)) || (await this.dotaz(adresa));
    if (o && !o.ok) this.chyba = prelozChybu(o.data.chyba || 'HTTP'); // třeba úroveň, kterou server ještě nezná
    return o && o.ok && Array.isArray(o.data.rekordy) ? o.data.rekordy : null;
  },
};
