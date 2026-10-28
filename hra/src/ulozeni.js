// Ukládání postupu do prohlížeče (na každém zařízení zvlášť).
const Ulozeni = {
  KLIC: 'dogman-postup',

  nacti() {
    try {
      return JSON.parse(localStorage.getItem(this.KLIC)) || {};
    } catch (e) {
      return {};
    }
  },

  uloz(data) {
    try {
      localStorage.setItem(this.KLIC, JSON.stringify(data));
    } catch (e) {
      // soukromé okno nebo zakázané úložiště: hra jede dál bez ukládání
    }
  },

  zapisUroven(id, kosti, celkem, cas) {
    const data = this.nacti();
    const predtim = data[id] || {};
    data[id] = {
      hotovo: true,
      kosti: Math.max(predtim.kosti || 0, kosti),
      celkem,
      nejrychleji: Math.min(predtim.nejrychleji || Infinity, cas),
    };
    this.uloz(data);
    return { ...data[id], novyRekord: kosti > (predtim.kosti || 0) };
  },

  // --- Síň slávy: nejrychlejší průchody na tomto zařízení ---
  MAX_REKORDU: 10,

  rekordy(id) {
    const r = (this.nacti().rekordy || {})[id] || [];
    return r.slice().sort((a, b) => a.cas - b.cas);
  },

  // pořadí, na kterém by čas skončil (1 = první), nebo 0, když se do tabulky nevejde
  poradi(id, cas) {
    const r = this.rekordy(id);
    const misto = r.filter((x) => x.cas <= cas).length + 1;
    return misto <= this.MAX_REKORDU ? misto : 0;
  },

  pridejRekord(id, jmeno, cas, kosti) {
    const data = this.nacti();
    data.rekordy = data.rekordy || {};
    const r = (data.rekordy[id] || []).concat([{ jmeno, cas, kosti, datum: new Date().toISOString().slice(0, 10) }]);
    r.sort((a, b) => a.cas - b.cas);
    data.rekordy[id] = r.slice(0, this.MAX_REKORDU);
    data.posledniJmeno = jmeno;
    this.uloz(data);
    return data.rekordy[id];
  },

  posledniJmeno() {
    return this.nacti().posledniJmeno || '';
  },
};

// 83456 ms -> "1:23.4"
function formatCas(ms) {
  const desetiny = Math.floor(ms / 100);
  const minuty = Math.floor(desetiny / 600);
  const sekundy = Math.floor((desetiny % 600) / 10);
  return `${minuty}:${String(sekundy).padStart(2, '0')}.${desetiny % 10}`;
}
