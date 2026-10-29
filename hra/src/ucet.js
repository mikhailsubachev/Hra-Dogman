// Hráč: přezdívka a PIN na serveru. Zařízení si přihlášení pamatuje (token v prohlížeči),
// postup se ukládá na server ke každému hráči zvlášť. Bez přihlášení se hraje jako host.
const Ucet = {
  KLIC: 'dogman-ucet',

  nacti() {
    try {
      return JSON.parse(localStorage.getItem(this.KLIC)) || null;
    } catch (e) {
      return null;
    }
  },

  get prihlaseny() { return SdileneVysledky.zapnuto && !!this.nacti(); },
  get prezdivka() { const u = this.nacti(); return u ? u.prezdivka : ''; },

  odhlas() {
    try { localStorage.removeItem(this.KLIC); } catch (e) { /* bez úložiště není co mazat */ }
  },

  // registrace i přihlášení; vrací text chyby, nebo null když se to povedlo
  async vstup(akce, prezdivka, pin) {
    // nový hráč si vezme postup, který na tomto zařízení nahrál jako host
    const telo = { akce, prezdivka, pin };
    if (akce === 'registrace') telo.postup = Ulozeni.urovne(Ulozeni.KLIC_HOSTA);
    const o = await SdileneVysledky.dotaz('', telo);
    if (!o) return 'Server neodpovídá. Je zapnutý internet?';
    if (!o.ok) return o.data.chyba || 'Něco se nepovedlo';
    try {
      localStorage.setItem(this.KLIC, JSON.stringify({ token: o.data.token, prezdivka: o.data.prezdivka }));
    } catch (e) {
      return 'Tento prohlížeč neumí nic uložit (soukromé okno?)';
    }
    Ulozeni.spojUrovne(o.data.postup);
    return null;
  },

  // dotaz za přihlášeného hráče; když server token nezná, hráče odhlásí
  async dotaz(telo) {
    const u = this.nacti();
    if (!u) return null;
    const o = await SdileneVysledky.dotaz('', { ...telo, token: u.token });
    if (o && !o.ok && o.data.odhlasit) this.odhlas();
    return o;
  },

  // stáhne postup ze serveru (třeba z jiného zařízení); vrací true, když se něco změnilo
  async obnovPostup() {
    const o = await this.dotaz({ akce: 'postup' });
    if (!o || !o.ok) return false;
    const pred = JSON.stringify(Ulozeni.urovne());
    Ulozeni.spojUrovne(o.data.postup);
    return JSON.stringify(Ulozeni.urovne()) !== pred;
  },

  // čas do Síně slávy (a zároveň postup); vrací { rekordy, poradi, zlepseni },
  // { chyba } když server čas odmítl, nebo null když neodpověděl
  async zapis(uroven, cas, kosti, celkem) {
    const o = await this.dotaz({ akce: 'zapis', uroven, cas, kosti, celkem });
    if (o && o.ok) return o.data;
    if (o && !o.ok && o.data.chyba && !o.data.odhlasit) {
      this.dotaz({ akce: 'uloz', postup: Ulozeni.urovne() });
      return { chyba: o.data.chyba };
    }
    // čas se nezapsal (třeba moc zápisů najednou): aspoň uložit postup
    this.dotaz({ akce: 'uloz', postup: Ulozeni.urovne() });
    return null;
  },
};
