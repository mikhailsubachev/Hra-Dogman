// Úrovně jsou obyčejný text. Každý znak je jedno políčko:
//   #  dno nebo vrak        .  voda
//   K  kost                 O  bublina kyslíku
//   R  robotická rybka      M  mechanická medúza
//   B  Bobánek              C  kontrolní bod (bójka)
//   S  start Dog Mana       E  konec úrovně (ponorka)
// V Čuňasově základně navíc:
//   ^  proud bublin (vynese nahoru)  X  mina
//   =  pohyblivá plošina, jezdí po dráze z pomlček -
//   Z  velký vypínač základny (konec úrovně)
// V potopeném vraku navíc:
//   <  >  kluzká paluba (táhne doleva / doprava)   J  svítící medúza (dobije lampu)
//   k  klíček            D  zamčené dveře          H  ztracený Bobánek (zachránit!)
const UROVNE = {};

function nactiMapu(text) {
  let radky = text.split('\n').map((r) => r.replace(/\r$/, '').replace(/\s+$/, ''));
  while (radky.length && radky[0].trim() === '') radky.shift();
  while (radky.length && radky[radky.length - 1].trim() === '') radky.pop();
  const sirka = Math.max(...radky.map((r) => r.length));
  return radky.map((r) => r.padEnd(sirka, '.').replace(/ /g, '.'));
}

// Aréna na jednu obrazovku na širším displeji: mapu roztáhne do šířky (sloupců),
// plošiny a mezery se rozšíří, postavy a předměty (jeden znak) zůstanou jednou.
function roztahniMapu(mapa, sloupcu) {
  const puvodni = mapa[0].length;
  if (sloupcu <= puvodni) return mapa;
  return mapa.map((radek) => {
    let novy = '';
    for (let c = 0; c < sloupcu; c++) {
      const s = Math.floor((c * puvodni) / sloupcu);
      const prvni = c === Math.ceil((s * sloupcu) / puvodni);
      const znak = radek[s];
      novy += znak === '#' || prvni ? znak : '.';
    }
    return novy;
  });
}
