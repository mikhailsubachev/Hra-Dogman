<?php
// Server hry Dog Man: hráči (přezdívka + PIN), jejich postup a sdílená Síň slávy.
// Nahrajte tento soubor na hosting do složky dogman/. Vše se ukládá do souboru
// data/vysledky.json vedle něj, databáze není potřeba.
//
//   GET  vysledky.php?uroven=ponor1                          -> nejlepší časy úrovně
//   GET  vysledky.php?limity                                 -> nejkratší přijatý čas každé úrovně (kontrola, že běží nová verze)
//   POST {"akce":"registrace","prezdivka","pin","postup"}    -> nový hráč, vrátí token
//   POST {"akce":"prihlaseni","prezdivka","pin"}             -> token a postup hráče
//   POST {"akce":"postup","token"}                           -> postup hráče
//   POST {"akce":"uloz","token","postup"}                    -> přidá postup (bere lepší hodnoty)
//   POST {"akce":"zapis","token","uroven","cas","kosti"}     -> čas do Síně slávy
//
// Zapomenutý PIN: v data/vysledky.json u hráče smažte řádek "pin" a hráč si
// při dalším přihlášení nastaví nový (první zadaný PIN se uloží).

// odkud smí hra se serverem mluvit
const POVOLENE_ADRESY = [
    'https://mikhailsubachev.github.io',
    'http://localhost:8123',
];
// úrovně a nejkratší čas (ms), který je ještě uvěřitelný (s rezervou, šikovné děti jsou rychlé)
const UROVNE = [
    'ponor1' => 10000,
    'chobotnice' => 5000,
    'zakladna' => 10000,
    'vrak' => 10000,
    'zralok' => 8000,
];
const MAX_REKORDU = 50;          // kolik hráčů se pamatuje v tabulce úrovně
const VRACET = 10;               // kolik časů se posílá hře
const ZAPISU_ZA_MINUTU = 5;      // ochrana proti zahlcení z jedné adresy
const SPATNYCH_PINU = 5;         // po tolika špatných PINech se přezdívka na 10 minut zamkne
const REGISTRACI_ZA_HODINU = 10; // nových hráčů z jedné adresy

$puvod = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($puvod, POVOLENE_ADRESY, true)) {
    header('Access-Control-Allow-Origin: ' . $puvod);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function odpoved($data, $kod = 200) {
    http_response_code($kod);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') odpoved(['ok' => true]);

$slozka = __DIR__ . '/data';
if (!is_dir($slozka)) {
    mkdir($slozka, 0755, true);
    file_put_contents("$slozka/.htaccess", "Require all denied\nDeny from all\n");
}
$soubor = "$slozka/vysledky.json";

// otevře soubor se zámkem, ať se dva zápisy najednou nepřepíšou
$f = fopen($soubor, 'c+');
if (!$f) odpoved(['chyba' => 'Nejde otevřít úložiště'], 500);
flock($f, $_SERVER['REQUEST_METHOD'] === 'POST' ? LOCK_EX : LOCK_SH);
$obsah = stream_get_contents($f);
$data = $obsah ? json_decode($obsah, true) : null;
if (!is_array($data)) $data = [];
$data += ['rekordy' => [], 'zapisy' => [], 'hraci' => [], 'pokusy' => []];

function tabulka($data, $uroven) {
    $vystup = [];
    foreach (array_slice($data['rekordy'][$uroven] ?? [], 0, VRACET) as $r) {
        $vystup[] = ['jmeno' => $r['jmeno'], 'cas' => $r['cas'], 'kosti' => $r['kosti'], 'datum' => $r['datum']];
    }
    return $vystup;
}

function uloz($f, $data) {
    ftruncate($f, 0);
    rewind($f);
    fwrite($f, json_encode($data, JSON_UNESCAPED_UNICODE));
    fflush($f);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['limity'])) odpoved(['limity' => UROVNE]);
    $uroven = $_GET['uroven'] ?? '';
    if (!isset(UROVNE[$uroven])) odpoved(['chyba' => 'Neznámá úroveň'], 400);
    odpoved(['rekordy' => tabulka($data, $uroven)]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') odpoved(['chyba' => 'Nepodporovaná metoda'], 405);

$vstup = json_decode(file_get_contents('php://input'), true);
if (!is_array($vstup)) odpoved(['chyba' => 'Špatná data'], 400);
$akce = $vstup['akce'] ?? '';
$ted = time();
$ip = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . 'dogman'); // adresa jen jako otisk

// --- pomocníci ---

function klicPrezdivky($prezdivka) { return mb_strtolower($prezdivka); }

// postup: u každé úrovně hotovo, nejvíc kostí, celkem kostí a nejrychlejší čas
function spojPostup($a, $b) {
    $a = is_array($a) ? $a : [];
    if (!is_array($b)) return $a;
    foreach ($b as $id => $u) {
        if (!isset(UROVNE[$id]) || !is_array($u)) continue;
        $p = $a[$id] ?? [];
        $casy = array_filter([$p['nejrychleji'] ?? null, $u['nejrychleji'] ?? null], fn($c) => is_int($c) && $c > 0);
        $a[$id] = [
            'hotovo' => !empty($p['hotovo']) || !empty($u['hotovo']),
            'kosti' => max((int)($p['kosti'] ?? 0), min(200, (int)($u['kosti'] ?? 0))),
            'celkem' => isset($u['celkem']) && is_int($u['celkem']) ? $u['celkem'] : ($p['celkem'] ?? null),
            'nejrychleji' => $casy ? min($casy) : null,
        ];
    }
    return $a;
}

function novyToken(&$hrac) {
    $token = bin2hex(random_bytes(16));
    $hrac['tokeny'] = array_slice(array_merge($hrac['tokeny'] ?? [], [hash('sha256', $token)]), -8); // nejvýš 8 zařízení
    return $token;
}

function hracPodleTokenu(&$data, $token) {
    if (!is_string($token) || strlen($token) !== 32) return null;
    $otisk = hash('sha256', $token);
    foreach ($data['hraci'] as $klic => $hrac) {
        if (in_array($otisk, $hrac['tokeny'] ?? [], true)) return $klic;
    }
    return null;
}

function prihlasen(&$data, $vstup) {
    $klic = hracPodleTokenu($data, $vstup['token'] ?? '');
    if ($klic === null) odpoved(['chyba' => 'Nejsi přihlášený, přihlas se znovu', 'odhlasit' => true], 401);
    return $klic;
}

// --- akce ---

if ($akce === 'registrace' || $akce === 'prihlaseni') {
    $prezdivka = trim(preg_replace('/\s+/u', ' ', (string)($vstup['prezdivka'] ?? '')));
    $pin = (string)($vstup['pin'] ?? '');
    if (!preg_match('/^[\p{L}\p{N} _-]{2,12}$/u', $prezdivka)) {
        odpoved(['chyba' => 'Přezdívka musí mít 2 až 12 písmen nebo číslic'], 400);
    }
    if (!preg_match('/^\d{4}$/', $pin)) odpoved(['chyba' => 'PIN musí mít 4 číslice'], 400);
    $klic = klicPrezdivky($prezdivka);

    // pokusy: špatné PINy na přezdívku a registrace z jedné adresy
    $data['pokusy'] = array_filter($data['pokusy'], fn($p) => $ted - $p['t'] < 3600);
    $spatne = count(array_filter($data['pokusy'], fn($p) => $p['co'] === "pin:$klic" && $ted - $p['t'] < 600));
    if ($spatne >= SPATNYCH_PINU) odpoved(['chyba' => 'Moc špatných PINů, zkus to za 10 minut'], 429);

    if ($akce === 'registrace') {
        if (isset($data['hraci'][$klic])) odpoved(['chyba' => 'Tahle přezdívka už existuje, vyber jinou'], 409);
        $registraci = count(array_filter($data['pokusy'], fn($p) => $p['co'] === "reg:$ip"));
        if ($registraci >= REGISTRACI_ZA_HODINU) odpoved(['chyba' => 'Moc nových hráčů, zkus to později'], 429);
        $data['pokusy'][] = ['co' => "reg:$ip", 't' => $ted];
        $data['hraci'][$klic] = [
            'prezdivka' => $prezdivka,
            'pin' => password_hash($pin, PASSWORD_DEFAULT),
            'postup' => spojPostup([], $vstup['postup'] ?? []),
            'od' => date('Y-m-d'),
        ];
    } else {
        if (!isset($data['hraci'][$klic])) odpoved(['chyba' => 'Takového hráče neznám. Nejsi nový hráč?'], 404);
        $hrac = $data['hraci'][$klic];
        if (empty($hrac['pin'])) {
            $data['hraci'][$klic]['pin'] = password_hash($pin, PASSWORD_DEFAULT); // rodič PIN smazal: nastaví se nový
        } elseif (!password_verify($pin, $hrac['pin'])) {
            $data['pokusy'][] = ['co' => "pin:$klic", 't' => $ted];
            $data['pokusy'] = array_values($data['pokusy']);
            uloz($f, $data);
            odpoved(['chyba' => 'Špatný PIN'], 403);
        }
    }
    $token = novyToken($data['hraci'][$klic]);
    $data['pokusy'] = array_values($data['pokusy']);
    uloz($f, $data);
    $hrac = $data['hraci'][$klic];
    odpoved(['token' => $token, 'prezdivka' => $hrac['prezdivka'], 'postup' => (object)$hrac['postup']]);
}

if ($akce === 'postup') {
    $klic = prihlasen($data, $vstup);
    odpoved(['prezdivka' => $data['hraci'][$klic]['prezdivka'], 'postup' => (object)$data['hraci'][$klic]['postup']]);
}

if ($akce === 'uloz') {
    $klic = prihlasen($data, $vstup);
    $data['hraci'][$klic]['postup'] = spojPostup($data['hraci'][$klic]['postup'], $vstup['postup'] ?? []);
    uloz($f, $data);
    odpoved(['postup' => (object)$data['hraci'][$klic]['postup']]);
}

if ($akce === 'zapis') {
    $klic = prihlasen($data, $vstup);
    $uroven = $vstup['uroven'] ?? '';
    $cas = $vstup['cas'] ?? null;
    $kosti = $vstup['kosti'] ?? 0;
    if (!isset(UROVNE[$uroven])) odpoved(['chyba' => 'Neznámá úroveň'], 400);
    if (!is_int($cas) || $cas < UROVNE[$uroven] || $cas > 3600000) odpoved(['chyba' => 'Nesmyslný čas'], 400);
    if (!is_int($kosti) || $kosti < 0 || $kosti > 200) odpoved(['chyba' => 'Nesmyslný počet kostí'], 400);

    // nejvýš pár zápisů za minutu z jedné adresy
    $data['zapisy'] = array_values(array_filter($data['zapisy'], fn($z) => $ted - $z['t'] < 60));
    $mych = count(array_filter($data['zapisy'], fn($z) => $z['ip'] === $ip));
    if ($mych >= ZAPISU_ZA_MINUTU) odpoved(['chyba' => 'Moc zápisů, zkus to za chvíli'], 429);
    $data['zapisy'][] = ['ip' => $ip, 't' => $ted];

    // v tabulce má každý hráč jen svůj nejlepší čas
    $hrac = $data['hraci'][$klic];
    $rekordy = $data['rekordy'][$uroven] ?? [];
    $muj = null;
    foreach ($rekordy as $i => $r) if (($r['hrac'] ?? null) === $klic) $muj = $i;
    $zlepseni = $muj === null || $cas < $rekordy[$muj]['cas'];
    if ($zlepseni) {
        if ($muj !== null) array_splice($rekordy, $muj, 1);
        $rekordy[] = ['jmeno' => $hrac['prezdivka'], 'hrac' => $klic, 'cas' => $cas, 'kosti' => $kosti, 'datum' => date('Y-m-d')];
        usort($rekordy, fn($a, $b) => $a['cas'] <=> $b['cas']);
        $data['rekordy'][$uroven] = array_slice($rekordy, 0, MAX_REKORDU);
    }
    $data['hraci'][$klic]['postup'] = spojPostup($hrac['postup'],
        [$uroven => ['hotovo' => true, 'kosti' => $kosti, 'nejrychleji' => $cas, 'celkem' => $vstup['celkem'] ?? null]]);
    uloz($f, $data);

    $poradi = -1;
    foreach ($data['rekordy'][$uroven] ?? [] as $i => $r) if (($r['hrac'] ?? null) === $klic) $poradi = $i;
    odpoved(['rekordy' => tabulka($data, $uroven), 'poradi' => $poradi, 'zlepseni' => $zlepseni]);
}

odpoved(['chyba' => 'Neznámá akce'], 400);
