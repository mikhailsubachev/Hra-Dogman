# DogMan – plán hry

Verze 1 (víkendový prototyp). Vychází z odpovědí v [otazky-k-hre.md](otazky-k-hre.md).

## 1. Koncept v jedné větě

Webová hra v češtině, kde děti jako Dog Man v příběhových misích vyšetřují lumpárny Čuňase, přeskakují překážky po městě a v karikaturních soubojích vypínají jeho robotické příšery. Mezi scénami běží příběh jako komiks a za splněnou misi se odemkne návod „jak nakreslit“.

## 2. Co z odpovědí určuje směr

| Odpověď | Co z toho plyne |
|---|---|
| Mobil (Android) + prohlížeč, PC i Mac, online | Jedna webová stránka (HTML + JavaScript), dotykové i klávesové ovládání |
| Policejní mise + komiks + skákačka | Každá mise má tři části: vyšetřování, cesta městem, souboj |
| Zábava + logika, strategie | Hádanky ve vyšetřování, souboje s robotem řešené vzorcem, ne jen mlácením |
| Úroveň 10–15 minut, příběh s kapitolami | Mise = kapitola, prototyp má jednu kompletní misi |
| Max 3 hráči | Tři profily s vlastním uloženým postupem, střídání u jednoho zařízení |
| Žádná krev, karikaturní rvačky | Nepřátelé jsou roboti, po „porážce“ se rozsypou na šroubky a vypnou se |
| Grafika: Claude podle předlohy od dětí | Děti kreslí na papír, podle fotek vzniknou jednoduché sprity |
| Víkendovka na zkoušku | Malý rozsah, nic online kromě hostování stránky |

## 3. Příběh: Kapitola 1 „Čuňas pod mořem“

Inspirace dílem 20 tisíc blech pod mořem. Děj hry je vlastní, z knížky si bereme prostředí (moře, ponorka), Čuňase a atmosféru. Konkrétní scény, které děti z knížky milují, doplní samy (viz část 10).

1. **Úvod (komiks, 4–6 panelů)** – Z přístavu mizí lodě a na pláž vyplavují podivné šroubky. Šéf svolá tým, Ema Podmáslí hlásí, že v moři někdo viděl robotickou příšeru a u přístavu se potlouká podezřelý krokodýl (Bobánek). Dog Man dostává misi.
2. **Vyšetřování v přístavu (adventura, 4–5 min)** – Molo, maják, rybárna. Hráč mluví s Emou a Žužu, hledá stopy (mokré otisky kopýtek, kus kovové ploutve, útržek mapy s křížkem, který vypadl Bobánkovi). Logická hádanka: složit roztrhanou mapu nebo nastavit správný kurz ponorky podle nápověd (směr, hloubka, počet bublin). Výsledek: souřadnice Čuňasovy podmořské základny.
3. **Ponor (skákačka, 4–5 min)** – Hrdina vyráží v policejní ponorce, pak vystoupí v potápěčském skafandru. Dno moře, vraky lodí, korálové plošiny, bubliny, které hrdinu vynesou nahoru (místo dlouhého skoku). Sbírání kostí (body) a bublin kyslíku (nutné, aby se dalo plavat dál, jemný tlak na čas). Překážky: robotické rybky a mechanické medúzy. V půlce úrovně se objeví Bobánek na vodním skútru, chvíli hráče honí a pak narazí do vraku. Checkpointy, bez smrti: po zásahu hrdina jen odletí zpět na checkpoint a pustí komickou bublinu.
4. **Souboj s příšerou (boss, 3–4 min)** – Obří robotická chobotnice (nebo žralok, podle dětí) ovládaná Čuňasem z kabiny. Nedá se jen umlátit: hráč musí vypozorovat vzorec (chapadla udeří třikrát, pak se otevře kryt s vypínačem; nebo je potřeba napřed zacpat tři trysky) a ve správnou chvíli skočit a zmáčknout vypínač. Tři zásahy = chobotnice se rozsype na šroubky a Čuňasova kabina vyplave na hladinu.
5. **Závěr (komiks, 2–3 panely)** – Čuňas uteče v záchranném člunu a slibuje pomstu (háček na kapitolu 2). Odemkne se návod „Jak nakreslit robotickou chobotnici“.

Kapitoly 2 a 3 (později): Čuňasova podmořská základna zevnitř, zatopené město, finále na hladině nebo na ostrově.

## 4. Postavy

**Hratelný hrdina:** jen **Dog Man**. Schopnosti: skok, štěkot (dočasně omráčí malé roboty), v soubojích skok na vypínač. Pod vodou nosí potápěčský skafandr.

**Nehratelné postavy:** Šéf (zadává mise), Žužu (nápovědy), Ema Podmáslí (reportérka, stopy a rozhovory), Přemek, Péťa (pomáhá nebo překáží, podle dětí), Peťulka, Restart Mářa.

**Padouch:** Čuňas a jeho robotické mořské příšery. **Bobánek** (krokodýl) je jeho pomocník: nešikovný, ale věrný. Ve vyšetřování nechává stopy (ztracené zuby, otisky ocasu), v ponoru se objevuje jako komický nepřítel, který hráče honí, ale pořád naráží do vraků, a v souboji s chobotnicí podává Čuňasovi nářadí a občas mu to pokazí.

**Příšery:** v kapitole 1 obří chobotnice, v dalších nové typy (žralok, kraken, hejno robotických rybek).

## 5. Herní mechaniky

**Ovládání:** šipky nebo WASD + mezerník na PC, na mobilu virtuální tlačítka vlevo/vpravo/skok/akce. Vše velké, aby to šlo prstem.

**Vyšetřování:** pohled z boku stejně jako skákačka (jedna technologie pro obě části), ale bez nepřátel. Hráč chodí, klikne na věc nebo postavu, zobrazí se komiksová bublina. Stopy se ukládají do „zápisníku“. Hádanka se otevře jako samostatné okno.

**Skákačka pod vodou:** klasika v duchu Super Maria, ale s pomalejším pádem (voda) a bublinami, které hrdinu vynesou nahoru. Sbírání kostí a bublin kyslíku. Zásah nepřítele = odhození na checkpoint, žádné životy, žádná smrt. Když dojde kyslík, hrdina se jen vrátí k poslednímu checkpointu.

**Souboj:** boss s pozorovatelným vzorcem. Logika místo reflexů. Nápověda od Žužu, pokud hráč třikrát selže.

**Komiks:** příběh mezi částmi jako panely s bublinami, hráč klepe pro další panel. Flip-O-Rama: dva panely rychle střídané jako mini animace (klepnutí přepíná), jednoduché a vtipné.

**Odměny:** kosti jako body, návody na kreslení po misi, galerie odemčených postav.

**Uložení postupu:** tři profily (jména zadají děti), uloženo v prohlížeči daného zařízení. Cloudové uložení až později, pokud bude hra bavit.

**Zvuky:** štěkot, skok, cinknutí kosti, bublání, bzučení robota, rozsypání, sonar ponorky. Vygenerované jednoduché zvuky, žádná hudba v první verzi.

## 6. Technologie

- **Phaser 3** (herní knihovna pro prohlížeč): zvládá skákačku, scény, dotyk i klávesnici, ukládání. Jediný soubor HTML + složka s obrázky a úrovněmi.
- **Úrovně jako textová mřížka**: každá úroveň je soubor, kde znaky znamenají dlaždice (`#` dno nebo vrak, `K` kost, `O` bublina kyslíku, `R` robotická rybka, `M` medúza, `C` checkpoint). Děti mohou úrovně samy psát a měnit, podobně jako stavějí v Minecraftu.
- **Hostování**: GitHub Pages nebo Netlify, zdarma, stačí poslat odkaz kamarádům.
- **Grafika**: SVG nebo pixelové sprity 32×32. Vznikají z dětských kreseb (viz níže).

## 7. Jak vzniká grafika

1. Děti nakreslí každou postavu na papír, jen jednou, jak stojí zepředu nebo z boku. Jeden obrázek na postavu stačí.
2. Vyfotit a vložit do složky `predlohy/`.
3. Claude podle předloh vytvoří jednoduché sprity (barvy, tvar, proporce). Animace vznikne v kódu z jednoho obrázku: pohupování při chůzi, naklonění při skoku, otočení podle směru, zrcadlení. Vypadá to komiksově a šetří práci.
4. Děti schválí nebo řeknou, co opravit.

Volitelně: děti mohou kreslit přímo v prohlížeči v pixelovém editoru (například Piskel, zdarma) a výsledek se použije rovnou.

## 8. Víkendový plán

**Pátek večer – příprava (děti hlavní role)**
- Nakreslit (každou postavu jen jednou) Dog Mana ve skafandru, Čuňase, Bobánka, robotickou chobotnici, robotickou rybku, Šéfa, Žužu, Emu, ponorku.
- Vymyslet 3 stopy v přístavu a jednu hádanku do vyšetřování.
- Vymyslet vzorec bosse (co chobotnice dělá a kdy je zranitelná).
- Napsat úvodní komiks (kdo co říká).

**Sobota – jádro hry**
- Dopoledne: kostra hry, výběr profilu, pohyb a skok Dog Mana, ovládání na mobilu.
- Odpoledne: první podmořská úroveň z textové mřížky, kosti, bubliny, robotické rybky, checkpointy. Děti navrhují úroveň a testují.
- Večer: komiksové panely a Flip-O-Rama.

**Neděle – mise a dokončení**
- Dopoledne: vyšetřovací scéna, rozhovory, stopy, hádanka.
- Odpoledne: souboj s bossem, zvuky, uložení postupu, návod na kreslení jako odměna.
- Večer: nahrát na web, zahrát si na mobilu i PC, sepsat co opravit a co chtějí děti do kapitoly 2.

## 9. Rozsah: co ano a co ne

**V prototypu:** 1 kapitola, 1 hrdina (Dog Man), 1 skákací úroveň, 1 vyšetřování s 1 hádankou, 1 boss, úvodní a závěrečný komiks, 3 profily, základní zvuky, 1 návod na kreslení.

**Až později:** další kapitoly, další hratelné postavy, hra dvou hráčů na jedné klávesnici, hudba, cloudové uložení, editor úrovní v prohlížeči, vlastní komiksová dílna.

## 10. Co ještě upřesnit s dětmi

- Které scény nebo vtipy z „20 tisíc blech pod mořem“ mají děti nejradši a chtějí je ve hře?
- Boss: chobotnice, žralok, nebo něco jiného? Co dělá a jak se dá vypnout?
- Jaké jsou tři stopy v přístavu a jaká hádanka ve vyšetřování?
- Má být kyslík jako tlak na čas, nebo děti raději bez něj (jen bubliny k vynesení nahoru)?
- Jména tří profilů hráčů.
- „Max 3 hráči“ = střídání u jednoho zařízení, nebo každý na svém? Pro prototyp počítám se střídáním a profily.
