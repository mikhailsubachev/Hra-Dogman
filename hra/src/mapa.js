// Úrovně jsou obyčejný text. Každý znak je jedno políčko:
//   #  dno nebo vrak        .  voda
//   K  kost                 O  bublina kyslíku
//   R  robotická rybka      M  mechanická medúza
//   B  Bobánek              C  kontrolní bod (bójka)
//   S  start Dog Mana       E  konec úrovně (ponorka)
const UROVNE = {};

function nactiMapu(text) {
  let radky = text.split('\n').map((r) => r.replace(/\r$/, '').replace(/\s+$/, ''));
  while (radky.length && radky[0].trim() === '') radky.shift();
  while (radky.length && radky[radky.length - 1].trim() === '') radky.pop();
  const sirka = Math.max(...radky.map((r) => r.length));
  return radky.map((r) => r.padEnd(sirka, '.').replace(/ /g, '.'));
}
