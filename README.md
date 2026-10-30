# DogMan – Čuňas pod mořem

Webová hra inspirovaná Dog Manem pro děti 9–10 let. Plán a odpovědi dětí jsou ve složce `dokumentace/`.

## Hrát online

https://mikhailsubachev.github.io/Hra-Dogman/

Funguje na mobilu (Android), PC i Macu. Na mobilu otoč telefon na šířku.

## Spuštění na vlastním počítači

Hra potřebuje malý lokální server (prohlížeč jinak nenačte obrázky). V Terminálu:

```bash
cd ~/Claude/Hra && python3 nastroje/server.py
```

Server prohlížeči zakazuje ukládat soubory do mezipaměti, takže po úpravě úrovně nebo nastavení stačí obnovit stránku.

Pak otevřít http://localhost:8123 v prohlížeči. Na mobilu ve stejné Wi-Fi: http://ADRESA-POČÍTAČE:8123.

Užitečné přepínače v adrese: `?dotyk=1` zapne dotykové ovládání i na PC, `?vse=1` odemkne všechny úrovně, `?debug=1` ukáže fyzikální obdélníky.

## Ovládání

| Akce | Klávesnice | Mobil |
|---|---|---|
| Chůze | šipky nebo A / D | táhni palcem v levé půlce (čím dál, tím rychleji) |
| Skok | mezerník, šipka nahoru nebo W | ťukni kamkoli v pravé půlce, držením vyskočíš výš |
| Štěkot (omráčí roboty, stojí kyslík) | X nebo K | dvakrát rychle ťukni v pravé půlce |
| Zpět do menu | Esc | ☰ → Hlavní menu |
| Pauza (Pokračovat, Hlavní menu, zrušit celou obrazovku) | ☰ | ☰ |

## Co hra už umí

- Menu, úvodní komiks (5 panelů), úroveň „Ponor: Dno přístavu“ a obrazovka „Mise splněna“.
- Menu: HRÁT pokračuje první nedokončenou úrovní (po dohrání všech tou poslední). „☰ Vybrat úroveň“ otevře seznam úrovní: odemčené jdou spustit, u dokončených je ✓, vpravo nejrychlejší hráč úrovně. „🏆 Síň slávy“ ukáže nejlepší časy všech hráčů pro každou úroveň zvlášť, vidí ji i nepřihlášený host.
- Úroveň 2 „Souboj s Robo-chobotnicí“: odemkne se po dokončení Ponoru 1 (tlačítko DALŠÍ, HRÁT nebo výběr úrovně v menu). Chobotnice třikrát udeří chapadlem (předem varuje „!“), od 2. kola střílí inkoust (nízký přeskoč, pod vysokým stůj). Pak se unaví a otevře kryt: skoč z prostřední plošiny na červený vypínač. Dokud je kryt otevřený, počítá se každý dopad na vypínač, klidně několik po sobě. Po 3 zásazích je poražena. Na hlavě chobotnice se mimo otevřený kryt stát nedá, setřese tě. Čuňas sedí v kabině, Bobánek fandí a ve 3. kole hází klíče. Štěk zruší chapadlo a rozprskne inkoust.
- Úroveň 3 „Čuňasova základna“: zatopená kovová základna, odemkne se po souboji s chobotnicí. Proudy bublin vynesou Dog Mana nahoru na vysoké zdi, pohyblivé plošiny ho převezou přes šachty a miny po dotyku vybuchnou (Dog Man se vrátí na kontrolní bod, mina se za chvíli objeví znovu). Na konci stáhni velký vypínač, základna zhasne. Před i po úrovni je krátký komiks s Peťulkou.
- Úroveň 4 „Potopený vrak“: odemkne se po Základně. Ve vraku je tma, svítí jen lampa na helmě Dog Mana a ta se postupně vybíjí (úplná tma nikdy není). Dobije ji svítící medúza. Zamčené dveře otevře klíček (v liště se ukazuje, kolik jich Dog Man má). Na palubě porostlé řasou to klouže ve směru šipek. Na konci najdi ztraceného Bobánka; plave pak za Dog Manem a s ním se odplouvá ponorkou.
- Úroveň 5 „Souboj s Robo-žralokem“: odemkne se po Vraku. Čuňasův mechanický žralok plave po hangáru a z tlamy vypouští malé žraloky, kteří Dog Mana honí (zničí je štěk nebo skok shora). Když Dog Man stojí na jednom ze tří zelených čudlíků, stoupá z něj rovně nahoru drobný proud bublinek. Žralok dostane zásah, když nad proudem proplave: odhodí ho to nahoru a upadne mu šroubek (šroubky v liště ukazují, kolik mu jich zbývá). Proud vydrží 2,5 s, pak se čudlík vybije a za 5 s nabije, takže je potřeba běhat mezi nimi. Žralok má 12 šroubků; každé 4 zásahy zrychlí a vypouští víc malých žraloků, od 2. kola dělá výpady na Dog Mana (předem varuje „!“). Čísla jsou v `N.CUDLIK` (src/nastaveni.js) a `ZRALOK` (src/entities/Zralok.js).
- Jazyky: čeština (výchozí), angličtina a ruština. Přepínač CZ / EN / RU je v menu vpravo nahoře, volba se pamatuje v zařízení (i na mobilu). Všechny texty jsou ve složce `hra/texty/` (cs.js, en.js, ru.js, stejné klíče). `node hra/texty/export.js` je vyexportuje do tabulky `hra/texty/preklad.csv` vedle sebe pro kontrolu. Ruská písmena berou písma Oswald a Pangolin (Bangers a Patrick Hand azbuku nemají).
- Komiksové postavy podle kreseb dětí. Dog Man chodí, skáče (krátké zmáčknutí = nízký skok) a štěká.
- Štěk stojí 5 kyslíku a jiný limit nemá. Kdo vyštěká všechen kyslík, utone a vrátí se na poslední bójku.
- Skok shora na nepřítele: rybku zničí, medúzu a Bobánka na chvíli omráčí. Se zmáčknutým skokem se Dog Man odrazí výš.
- Nepřátelé: 9 robotických rybek, 6 mechanických medúz a 2 Bobánci, kteří Dog Mana honí a naráží do vraků.
- 32 kostí, jen 2 bubliny kyslíku a 2 kontrolní bójky. Žádná smrt: po zásahu se Dog Man vrátí na poslední bójku.
- Stopky během hry a Síň slávy: společná tabulka nejrychlejších hráčů na serveru (zapisují se jen přihlášení), bez serveru tabulka z tohoto zařízení.
- Hráči: v menu „👤 Přihlásit se“, nový hráč si vymyslí přezdívku a 4místný PIN. Postup se ukládá na server, takže jde pokračovat i na jiném zařízení. Bez přihlášení se hraje jako host.
- Základní zvuky, dotykové ovládání bez tlačítek (levý palec chůze, pravý palec skok a HAF), výzva k otočení mobilu na šířku.

Hráči a Síň slávy jsou na serveru (viz `server/README.md`). Bez serveru se postup i tabulka ukládají jen v prohlížeči.

## Struktura projektu

```
Hra/
├── dokumentace/              plán hry a otázky s odpověďmi dětí
├── predlohy/postavy/         fotky kreseb dětí (originály)
├── nastroje/
│   └── kresba_na_sprite.py   převod fotky kresby na obrázek bez pozadí
├── server/                   hráči, postup a Síň slávy: vysledky.php pro webhosting (návod v server/README.md)
└── hra/                      samotná hra, tahle složka se nahrává na web
    ├── index.html
    ├── levels/               úrovně jako textová mřížka (děti mohou upravovat): ponor1.js, chobotnice.js, zakladna.js
    ├── assets/sprites/       kresby dětí převedené pro hru
    └── src/
        ├── nastaveni.js      rychlost, výška skoku, kyslík… (dá se ladit)
        ├── textury.js        dočasná grafika, dokud nejsou kresby
        ├── zvuky.js          zvuky vyrobené kódem
        ├── postup.js         pořadí úrovní, komiksy mezi nimi, odemykání
        ├── entities/         Dog Man, nepřátelé a Robo-chobotnice
        ├── ui/               dotyková tlačítka a horní lišta
        └── scenes/           menu, komiks, ponor, souboj s chobotnicí, konec mise
```

## Jak upravit úroveň

Otevřete `hra/levels/ponor1.js`. Každý znak je jedno políčko:

| Znak | Význam |
|---|---|
| `#` | dno nebo vrak |
| `.` | voda |
| `K` | kost |
| `O` | bublina kyslíku |
| `R` | robotická rybka |
| `M` | mechanická medúza |
| `B` | Bobánek |
| `C` | kontrolní bod (bójka) |
| `S` | start Dog Mana |
| `E` | konec úrovně (ponorka) |
| `^` | proud bublin, vynese nahoru (hlavně v základně) |
| `X` | mina |
| `=` | pohyblivá plošina, jezdí po dráze z pomlček `-` ve stejném řádku |
| `Z` | velký vypínač základny (konec úrovně) |

Dog Man vyskočí nejvýš o 2 políčka a přeskočí díru širokou až 4 políčka. Po uložení stačí obnovit stránku. Obtížnost se dá doladit i v `hra/src/nastaveni.js` (cena štěku v kyslíku, ubývání kyslíku, výška odrazu).

## Jak přidat novou kresbu

1. Vyfoťte kresbu a uložte ji do `predlohy/postavy/` jako obrázek (.png nebo .jpg).
2. Převeďte ji (potřebuje Python s balíčky Pillow, numpy a scipy):

```bash
python3 nastroje/kresba_na_sprite.py predlohy/postavy/dogman.png hra/assets/sprites/dogman.png --vyska 64
```

3. Přidejte jméno do seznamu `KRESBY_OD_DETI` v `hra/src/scenes/ZavadeciScena.js`. Když se kresba jmenuje stejně jako dočasná grafika (`dogman`, `rybka`, `meduza`, `kost`…), automaticky ji nahradí.

Dog Man se ve hře zmenší na výšku 72 px, ať je kresba jakkoli velká. Rybka měří 48 × 34 px a medúza 40 × 50 px.
