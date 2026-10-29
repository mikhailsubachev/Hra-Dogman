// Pořadí úrovní, komiksy mezi nimi a odemykání.
// Další úroveň se odemkne, když je předchozí dokončená (nebo s ?vse=1 v adrese).
const KOMIKS_PRED_CHOBOTNICI = [
  { postava: 'ponorka', vypravec: 'Dog Man doplul až k Čuňasově podmořské základně…' },
  { postava: 'chobotnice', mluvi: 'Čuňas', text: 'Chi chi! Seznam se s mou Robo-chobotnicí!' },
  { postava: 'bobanek', mluvi: 'Bobánek', text: 'Šéfe, a kde má ta chobotnice vypínač?' },
  { postava: 'cunas', mluvi: 'Čuňas', text: 'Pšt! Ten je schovaný pod krytem na hlavě!' },
  { postava: 'dogman', mluvi: 'Dog Man', text: 'HAF!', vypravec: 'Uhýbej chapadlům. Až se chobotnice unaví, skoč jí na vypínač!' },
];

const KOMIKS_PO_CHOBOTNICI = [
  { postava: 'cunas', mluvi: 'Čuňas', text: 'Moje chobotnice! To ti nedaruju, pejsku!', vypravec: 'Kabina s Čuňasem vystřelila k hladině…' },
  { postava: 'bobanek', mluvi: 'Bobánek', text: 'Šéfe, počkej na mě! Já neumím plavat tak rychle!' },
  { postava: 'dogman', mluvi: 'Dog Man', text: 'HAF HAF!', vypravec: 'Přístav je zase v bezpečí. Ale na jak dlouho?' },
];

const KOMIKS_PRED_ZAKLADNOU = [
  { postava: 'ponorka', vypravec: 'Stopa šroubků vede k Čuňasově tajné základně na dně moře…' },
  { postava: 'petulka', mluvi: 'Peťulka', text: 'Dog Mane! Uvnitř je velký vypínač. Když ho stáhneš, základna zhasne!' },
  { postava: 'cunas', mluvi: 'Čuňas', text: 'Bobánku! Zapni miny a pusť bublinové proudy!' },
  { postava: 'bobanek', mluvi: 'Bobánek', text: 'Kterým čudlíkem, šéfe? Tím červeným, nebo tím červeným?' },
  { postava: 'dogman', mluvi: 'Dog Man', text: 'HAF!', vypravec: 'Proud bublin tě vynese nahoru. Na miny nesahej!' },
];

const KOMIKS_PO_ZAKLADNE = [
  { postava: 'cunas', mluvi: 'Čuňas', text: 'Tma! Kdo mi zhasnul?! To zase ten pes!' },
  { postava: 'bobanek', mluvi: 'Bobánek', text: 'Šéfe, já se ve tmě bojím…' },
  { postava: 'petulka', mluvi: 'Peťulka', text: 'Hurá, Dog Mane! Teď už Čuňas žádné příšery nevyrobí.', vypravec: 'Aspoň na chvíli…' },
];

const UROVNE_HRY = [
  { id: 'ponor1', scena: 'Ponor', data: { uroven: 'ponor1' }, nazev: 'Ponor', komiksPred: () => UVODNI_KOMIKS },
  {
    id: 'chobotnice', scena: 'Chobotnice', data: {}, nazev: 'Chobotnice', menu: 'Souboj s Robo-chobotnicí',
    komiksPred: () => KOMIKS_PRED_CHOBOTNICI, komiksPo: () => KOMIKS_PO_CHOBOTNICI,
  },
  {
    id: 'zakladna', scena: 'Ponor', data: { uroven: 'zakladna' }, nazev: 'Základna', menu: 'Čuňasova základna',
    komiksPred: () => KOMIKS_PRED_ZAKLADNOU, komiksPo: () => KOMIKS_PO_ZAKLADNE,
  },
];

const Postup = {
  najdi(id) { return UROVNE_HRY.find((u) => u.id === id); },

  dalsi(id) {
    const i = UROVNE_HRY.findIndex((u) => u.id === id);
    return i >= 0 ? UROVNE_HRY[i + 1] : undefined;
  },

  jeOdemcena(id) {
    const i = UROVNE_HRY.findIndex((u) => u.id === id);
    if (i <= 0 || PARAMETRY.get('vse') === '1') return true;
    const predchozi = Ulozeni.nacti()[UROVNE_HRY[i - 1].id];
    return !!(predchozi && predchozi.hotovo);
  },

  // kam pokračuje HRÁT: první odemčená a nedokončená úroveň, po dohrání všech ta poslední
  aktualni() {
    const postup = Ulozeni.nacti();
    const odemcene = UROVNE_HRY.filter((u) => this.jeOdemcena(u.id));
    return odemcene.find((u) => !(postup[u.id] && postup[u.id].hotovo)) || odemcene[odemcene.length - 1];
  },

  // spustí úroveň, s komiksem předem (nebo bez, při opakování)
  spust(scene, id, sKomiksem = true) {
    const u = this.najdi(id);
    if (!u) return scene.scene.start('Menu');
    if (sKomiksem && u.komiksPred) {
      scene.scene.start('Komiks', { panely: u.komiksPred(), dalsi: { scena: u.scena, data: u.data } });
    } else {
      scene.scene.start(u.scena, u.data);
    }
  },
};
