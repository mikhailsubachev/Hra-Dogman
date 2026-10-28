# Sdílená Síň slávy (Endora)

Skript `vysledky.php` ukládá nejlepší časy všech hráčů do souboru `data/vysledky.json`.
Hra (na GitHub Pages) mu po zadání jména pošle čas a zobrazí společnou tabulku.
Když server nejde, hra ukáže tabulku jen z daného zařízení.

## Nahrání na Endoru

1. V administraci Endory si u domény zapněte **SSL certifikát (Let's Encrypt)**. Bez HTTPS prohlížeč zápis ze hry zablokuje.
2. Přes **Souborový manažer** nebo FTP vytvořte na webu složku `dogman` a nahrajte do ní `vysledky.php`.
3. V prohlížeči otevřete `https://VASE-DOMENA/dogman/vysledky.php?uroven=ponor1`.
   Má se ukázat `{"rekordy":[]}`. Složka `data` se vytvoří sama.
4. Pošlete adresu Claudovi, nebo ji sami zapište do `hra/src/nastaveni.js`:
   `SIN_SLAVY_ADRESA: 'https://VASE-DOMENA/dogman/vysledky.php',`

## Úpravy

- Nahoře ve skriptu je seznam úrovní s nejkratším uvěřitelným časem (kratší se odmítne)
  a seznam adres, odkud smí hra zapisovat.
- Smazat výsledky: smažte soubor `data/vysledky.json`, nebo v něm ručně upravte řádky.
- Nová úroveň ve hře = přidat její `id` do `UROVNE` ve skriptu.
