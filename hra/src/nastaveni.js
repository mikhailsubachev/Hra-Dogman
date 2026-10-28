// Všechna čísla, se kterými si můžete hrát. Změňte, uložte a obnovte stránku.
const N = {
  SIRKA: 960,
  VYSKA: 540,
  DLAZDICE: 48,          // velikost jednoho políčka mapy v pixelech
  GRAVITACE: 650,        // pod vodou padáme pomaleji než na souši

  DOGMAN: {
    rychlost: 210,       // jak rychle chodí
    skok: 440,           // jak vysoko skáče
    maxPad: 300,         // nejvyšší rychlost padání (voda brzdí)
  },

  HAF: {
    kyslik: 5,           // kolik kyslíku stojí jeden štěk (kyslíku je max 100); štěkat jde až do utonutí
    dosah: 190,          // jak daleko štěkot omráčí roboty
    omraceni: 2500,      // na jak dlouho (v milisekundách)
    pauza: 1200,         // jak dlouho se musí čekat na další štěk
  },

  SKOK_NA_NEPRITELE: {
    odraz: 360,          // jak vysoko Dog Man odskočí od nepřítele (se zmáčknutým skokem víc)
    omraceniMeduzy: 3000,
    omraceniBobanka: 2500,
  },

  KYSLIK: {
    zapnuto: true,       // false = hra bez kyslíku
    max: 100,
    ubytekZaSekundu: 2.0,
    bublina: 40,         // kolik přidá jedna bublina
  },

  // Čuňasova základna (úroveň 3)
  PROUD: { sila: 45, max: 300 },      // proud bublin (^): jak silně a jak rychle vynáší nahoru
  PLOSINA: { rychlost: 80 },          // pohyblivá plošina (=)
  MINA: { obnova: 2500 },             // za jak dlouho se vybuchlá mina (X) vrátí

  PISMO_NADPIS: '"Bangers", "Comic Sans MS", "Chalkboard SE", cursive',
  PISMO: '"Patrick Hand", "Comic Sans MS", "Chalkboard SE", sans-serif',
};

// ?debug=1 v adrese ukáže fyzikální obdélníky, ?dotyk=1 ukáže dotyková tlačítka i na PC
const PARAMETRY = new URLSearchParams(window.location.search);
