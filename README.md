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
| Zpět do menu | Esc | ☰ |

## Co hra už umí

- Menu, úvodní komiks (5 panelů), úroveň „Ponor 1: Dno přístavu“ a obrazovka „Mise splněna“.
- Úroveň 2 „Souboj s Robo-chobotnicí“: odemkne se po dokončení Ponoru 1 (tlačítko DALŠÍ nebo v menu). Chobotnice třikrát udeří chapadlem (předem varuje „!“), od 2. kola střílí inkoust (nízký přeskoč, pod vysokým stůj). Pak se unaví a otevře kryt: skoč z prostřední plošiny na červený vypínač. Po 3 zásazích je poražena. Čuňas sedí v kabině, Bobánek fandí a ve 3. kole hází klíče. Štěk zruší chapadlo a rozprskne inkoust.
- Komiksové postavy podle kreseb dětí. Dog Man chodí, skáče (krátké zmáčknutí = nízký skok) a štěká.
- Štěk stojí 5 kyslíku a jiný limit nemá. Kdo vyštěká všechen kyslík, utone a vrátí se na poslední bójku.
- Skok shora na nepřítele: rybku zničí, medúzu a Bobánka na chvíli omráčí. Se zmáčknutým skokem se Dog Man odrazí výš.
- Nepřátelé: 9 robotických rybek, 6 mechanických medúz a 2 Bobánci, kteří Dog Mana honí a naráží do vraků.
- 32 kostí, jen 2 bubliny kyslíku a 2 kontrolní bójky. Žádná smrt: po zásahu se Dog Man vrátí na poslední bójku.
- Stopky během hry a Síň slávy: po dokončení se hráč zapíše jménem a tabulka ukáže 10 nejrychlejších průchodů na tomto zařízení.
- Základní zvuky, dotykové ovládání bez tlačítek (levý palec chůze, pravý palec skok a HAF), výzva k otočení mobilu na šířku.

Síň slávy je uložená v prohlížeči. Soupeřit se dá na jednom zařízení. Společná tabulka pro víc zařízení by potřebovala server.

## Struktura projektu

```
Hra/
├── dokumentace/              plán hry a otázky s odpověďmi dětí
├── predlohy/postavy/         fotky kreseb dětí (originály)
├── nastroje/
│   └── kresba_na_sprite.py   převod fotky kresby na obrázek bez pozadí
└── hra/                      samotná hra, tahle složka se nahrává na web
    ├── index.html
    ├── levels/               úrovně jako textová mřížka (děti mohou upravovat): ponor1.js, chobotnice.js
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

Dog Man vyskočí nejvýš o 2 políčka a přeskočí díru širokou až 4 políčka. Po uložení stačí obnovit stránku. Obtížnost se dá doladit i v `hra/src/nastaveni.js` (cena štěku v kyslíku, ubývání kyslíku, výška odrazu).

## Jak přidat novou kresbu

1. Vyfoťte kresbu a uložte ji do `predlohy/postavy/` jako obrázek (.png nebo .jpg).
2. Převeďte ji (potřebuje Python s balíčky Pillow, numpy a scipy):

```bash
python3 nastroje/kresba_na_sprite.py predlohy/postavy/dogman.png hra/assets/sprites/dogman.png --vyska 64
```

3. Přidejte jméno do seznamu `KRESBY_OD_DETI` v `hra/src/scenes/ZavadeciScena.js`. Když se kresba jmenuje stejně jako dočasná grafika (`dogman`, `rybka`, `meduza`, `kost`…), automaticky ji nahradí.

Dog Man se ve hře zmenší na výšku 72 px, ať je kresba jakkoli velká. Rybka měří 48 × 34 px a medúza 40 × 50 px.
