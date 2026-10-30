// Export všech textů do tabulky texty/preklad.csv (klíč, čeština, angličtina, ruština).
// Spuštění: node texty/export.js  (tabulka se otevře v Excelu nebo Google Sheets)
const fs = require('fs');
const path = require('path');

global.TEXTY = {};
for (const jazyk of ['cs', 'en', 'ru']) require(path.join(__dirname, `${jazyk}.js`));

const radky = [['klic', 'cs', 'en', 'ru']];
const pridej = (klic, hodnoty) => radky.push([klic, ...hodnoty]);
for (const [klic, cs] of Object.entries(TEXTY.cs)) {
  const jazyky = ['cs', 'en', 'ru'].map((j) => TEXTY[j][klic]);
  if (typeof cs === 'string') pridej(klic, jazyky);
  else if (Array.isArray(cs)) {
    cs.forEach((polozka, i) => {
      if (typeof polozka === 'string') pridej(`${klic}.${i + 1}`, jazyky.map((p) => p && p[i]));
      else for (const pole of ['text', 'vypravec']) {
        if (polozka[pole]) pridej(`${klic}.${i + 1}.${pole}`, jazyky.map((p) => p && p[i] && p[i][pole]));
      }
    });
  } else {
    // chyby ze serveru: klíčem je česká hláška
    for (const hlaska of Object.keys(TEXTY.en[klic] || {})) pridej(`${klic}: ${hlaska}`, [hlaska, TEXTY.en[klic][hlaska], TEXTY.ru[klic][hlaska]]);
  }
}
const bunka = (h) => `"${String(h === undefined ? '' : h).replace(/"/g, '""')}"`;
const csv = '﻿' + radky.map((r) => r.map(bunka).join(';')).join('\r\n') + '\r\n';
fs.writeFileSync(path.join(__dirname, 'preklad.csv'), csv);
console.log(`Hotovo: ${radky.length - 1} textů v texty/preklad.csv`);
