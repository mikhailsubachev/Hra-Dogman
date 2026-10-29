# Server hry: hráči a sdílená Síň slávy (Endora)

Skript `vysledky.php` běží na https://www.subachev.com/dogman/vysledky.php a ukládá vše
do souboru `data/vysledky.json` (databáze není potřeba):

- **hráče:** přezdívka + 4místný PIN (PIN je uložený jen jako otisk, ne čitelně),
- **postup každého hráče:** dokončené úrovně, kosti, nejrychlejší časy,
- **Síň slávy:** každý hráč má v tabulce úrovně svůj nejlepší čas. Zapisovat můžou jen přihlášení.

Když server nejde, hra jede dál s postupem a tabulkou z daného zařízení.

## Nahrání nové verze na Endoru

1. Přes **Souborový manažer** nebo FTP otevřete složku `dogman` na webu.
2. Nahrajte nový `vysledky.php` (přepište starý). Složku `data` nechte, jsou v ní výsledky a hráči.
3. Kontrola: `https://www.subachev.com/dogman/vysledky.php?uroven=ponor1` ukáže `{"rekordy":[...]}`.

První nahrání: u domény zapnout **SSL certifikát (Let's Encrypt)**, vytvořit složku `dogman`,
nahrát skript a adresu zapsat do `hra/src/nastaveni.js` (`SIN_SLAVY_ADRESA`).

## Správa

- **Zapomenutý PIN:** v `data/vysledky.json` najděte hráče (`"hraci"` → přezdívka malými písmeny)
  a smažte jeho hodnotu `"pin"` (nechte `"pin": ""`). Při dalším přihlášení se uloží PIN, který hráč zadá.
- **Zamčená přezdívka** po 5 špatných PINech se sama odemkne za 10 minut.
- **Smazat hráče:** odstraňte ho z `"hraci"` (jeho časy v `"rekordy"` smažte zvlášť).
- **Smazat výsledky:** v `"rekordy"` vymažte řádky, nebo smažte celý soubor (zmizí i hráči).
- Nahoře ve skriptu je seznam úrovní s nejkratším uvěřitelným časem a seznam adres, odkud smí hra se serverem mluvit.
- Nová úroveň ve hře = přidat její `id` do `UROVNE` ve skriptu.
