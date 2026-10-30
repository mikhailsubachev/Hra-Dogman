// Pořadí úrovní, komiksy mezi nimi a odemykání. Názvy úrovní a texty komiksů jsou v texty/*.js.
// Další úroveň se odemkne, když je předchozí dokončená (nebo s ?vse=1 v adrese).
const UROVNE_HRY = [
  { id: 'ponor1', scena: 'Ponor', data: { uroven: 'ponor1' }, komiksPred: () => t('komiks_uvod') },
  {
    id: 'chobotnice', scena: 'Chobotnice', data: {},
    komiksPred: () => t('komiks_pred_chobotnici'), komiksPo: () => t('komiks_po_chobotnici'),
  },
  {
    id: 'zakladna', scena: 'Ponor', data: { uroven: 'zakladna' },
    komiksPred: () => t('komiks_pred_zakladnou'), komiksPo: () => t('komiks_po_zakladne'),
  },
  {
    id: 'vrak', scena: 'Ponor', data: { uroven: 'vrak' },
    komiksPred: () => t('komiks_pred_vrakem'), komiksPo: () => t('komiks_po_vraku'),
  },
  {
    id: 'zralok', scena: 'Zralok', data: {},
    komiksPred: () => t('komiks_pred_zralokem'), komiksPo: () => t('komiks_po_zralokovi'),
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
