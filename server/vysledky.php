<?php
// Sdílená Síň slávy pro hru Dog Man.
// Nahrajte tento soubor na hosting (třeba do složky dogman/). Výsledky se ukládají
// do souboru data/vysledky.json vedle něj, databáze není potřeba.
//
//   GET  vysledky.php?uroven=ponor1           -> nejlepší časy úrovně
//   POST vysledky.php  {"uroven","jmeno","cas","kosti"}  -> zapíše čas a vrátí tabulku

// odkud smí hra výsledky posílat
const POVOLENE_ADRESY = [
    'https://mikhailsubachev.github.io',
    'http://localhost:8123',
];
// úrovně a nejkratší čas (ms), který je ještě uvěřitelný
const UROVNE = [
    'ponor1' => 20000,
    'chobotnice' => 15000,
    'zakladna' => 20000,
];
const MAX_REKORDU = 50;        // kolik časů se pamatuje na úroveň
const VRACET = 10;             // kolik časů se posílá hře
const ZAPISU_ZA_MINUTU = 5;    // ochrana proti zahlcení z jedné adresy

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
if (!is_array($data)) $data = ['rekordy' => [], 'zapisy' => []];

function tabulka($data, $uroven) {
    return array_slice($data['rekordy'][$uroven] ?? [], 0, VRACET);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $uroven = $_GET['uroven'] ?? '';
    if (!isset(UROVNE[$uroven])) odpoved(['chyba' => 'Neznámá úroveň'], 400);
    odpoved(['rekordy' => tabulka($data, $uroven)]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') odpoved(['chyba' => 'Nepodporovaná metoda'], 405);

$vstup = json_decode(file_get_contents('php://input'), true);
$uroven = $vstup['uroven'] ?? '';
$jmeno = trim(preg_replace('/[\x00-\x1F<>]/u', '', (string)($vstup['jmeno'] ?? '')));
$jmeno = mb_substr($jmeno, 0, 12) ?: 'Neznámý hrdina';
$cas = $vstup['cas'] ?? null;
$kosti = $vstup['kosti'] ?? 0;

if (!isset(UROVNE[$uroven])) odpoved(['chyba' => 'Neznámá úroveň'], 400);
if (!is_int($cas) || $cas < UROVNE[$uroven] || $cas > 3600000) odpoved(['chyba' => 'Nesmyslný čas'], 400);
if (!is_int($kosti) || $kosti < 0 || $kosti > 200) odpoved(['chyba' => 'Nesmyslný počet kostí'], 400);

// nejvýš pár zápisů za minutu z jedné adresy (adresa se ukládá jen jako otisk)
$ip = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . 'dogman');
$ted = time();
$data['zapisy'] = array_filter($data['zapisy'] ?? [], fn($z) => $ted - $z['t'] < 60);
$mych = count(array_filter($data['zapisy'], fn($z) => $z['ip'] === $ip));
if ($mych >= ZAPISU_ZA_MINUTU) odpoved(['chyba' => 'Moc zápisů, zkus to za chvíli'], 429);
$data['zapisy'][] = ['ip' => $ip, 't' => $ted];
$data['zapisy'] = array_values($data['zapisy']);

$novy = ['jmeno' => $jmeno, 'cas' => $cas, 'kosti' => $kosti, 'datum' => date('Y-m-d'), 'id' => bin2hex(random_bytes(4))];
$rekordy = $data['rekordy'][$uroven] ?? [];
$rekordy[] = $novy;
usort($rekordy, fn($a, $b) => $a['cas'] <=> $b['cas']);
$data['rekordy'][$uroven] = array_slice($rekordy, 0, MAX_REKORDU);

ftruncate($f, 0);
rewind($f);
fwrite($f, json_encode($data, JSON_UNESCAPED_UNICODE));
fflush($f);
flock($f, LOCK_UN);
fclose($f);

$poradi = array_search($novy['id'], array_column($data['rekordy'][$uroven], 'id'), true);
odpoved(['rekordy' => tabulka($data, $uroven), 'poradi' => $poradi === false ? -1 : $poradi]);
