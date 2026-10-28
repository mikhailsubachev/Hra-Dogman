// Dočasná grafika nakreslená kódem. Až děti dodají kresby, nahradí se obrázky
// ve složce assets/sprites (stačí soubor se stejným jménem, viz ZavadeciScena).
const Textury = {
  vytvor(scene) {
    const kresli = (klic, sirka, vyska, fn) => {
      if (scene.textures.exists(klic)) return; // kresba od dětí má přednost
      const g = scene.add.graphics();
      fn(g);
      g.generateTexture(klic, sirka, vyska);
      g.destroy();
    };

    // Dog Man ve skafandru: psí hlava, policejní uniforma, skleněná helma
    const dogman = (g) => {
      g.fillStyle(0x1b2a4a); g.fillRect(15, 52, 7, 9); g.fillRect(26, 52, 7, 9);
      g.fillStyle(0x222222); g.fillRoundedRect(12, 58, 11, 6, 2); g.fillRoundedRect(25, 58, 11, 6, 2);
      g.fillStyle(0x2a4d8f); g.fillRoundedRect(11, 33, 26, 22, 6);
      g.fillRoundedRect(5, 35, 7, 15, 3); g.fillRoundedRect(36, 35, 7, 15, 3);
      g.fillStyle(0xf5e6c8); g.fillCircle(8, 51, 3.5); g.fillCircle(40, 51, 3.5);
      g.fillStyle(0x111111); g.fillRect(11, 48, 26, 3);
      g.fillStyle(0xf2c94c); g.fillCircle(30, 40, 3);
      g.fillStyle(0xf5e6c8); g.fillCircle(24, 21, 13);
      g.fillStyle(0x8b5a2b); g.fillEllipse(10, 22, 8, 17); g.fillEllipse(38, 22, 8, 17);
      g.fillCircle(29, 16, 4);
      g.fillStyle(0x111111); g.fillCircle(19, 20, 2); g.fillCircle(29, 20, 2); g.fillCircle(24, 26, 3);
      g.lineStyle(1.5, 0x111111); g.beginPath(); g.arc(24, 27, 4, 0.3, Math.PI - 0.3); g.strokePath();
      g.fillStyle(0x1b2a4a); g.fillRect(14, 6, 20, 6); g.fillRect(12, 11, 24, 3);
      g.fillStyle(0xf2c94c); g.fillCircle(24, 9, 2);
      g.fillStyle(0xbfe9ff, 0.22); g.fillCircle(24, 21, 19);
      g.lineStyle(2.5, 0xe8f7ff, 0.9); g.strokeCircle(24, 21, 19);
      g.fillStyle(0xffffff, 0.75); g.fillEllipse(15, 11, 7, 3);
    };
    kresli('dogman', 48, 64, dogman);

    // robotická rybka (dívá se doleva)
    kresli('rybka', 48, 34, (g) => {
      g.fillStyle(0x6b7b90); g.fillTriangle(36, 17, 48, 5, 48, 29);
      g.fillStyle(0x8a9bb0); g.fillEllipse(21, 18, 38, 24);
      g.lineStyle(2, 0x3d4757); g.strokeEllipse(21, 18, 38, 24);
      g.lineBetween(28, 8, 28, 28);
      g.fillStyle(0x3d4757); g.fillCircle(22, 11, 1.6); g.fillCircle(32, 22, 1.6); g.fillCircle(18, 24, 1.6);
      g.fillStyle(0xff3b3b); g.fillCircle(10, 15, 4.5);
      g.fillStyle(0xffffff); g.fillCircle(9, 14, 1.6);
      g.fillTriangle(3, 20, 7, 20, 5, 24); g.fillTriangle(8, 21, 12, 21, 10, 25);
      g.lineStyle(2, 0x3d4757); g.lineBetween(20, 6, 17, 1);
      g.fillStyle(0xff3b3b); g.fillCircle(17, 2, 2);
    });

    // mechanická medúza
    kresli('meduza', 40, 50, (g) => {
      g.lineStyle(3, 0x8e44ad);
      for (let i = 0; i < 4; i++) {
        const x = 8 + i * 8;
        g.beginPath(); g.moveTo(x, 22); g.lineTo(x - 3, 31); g.lineTo(x + 2, 39); g.lineTo(x - 2, 48); g.strokePath();
      }
      g.fillStyle(0xb46cd9); g.slice(20, 22, 18, Math.PI, 0, false); g.fillPath();
      g.fillStyle(0x7d3c98); g.fillRect(2, 21, 36, 4);
      g.fillStyle(0xffe066); g.fillCircle(14, 14, 3.5); g.fillCircle(26, 14, 3.5);
      g.fillStyle(0x222222); g.fillCircle(14, 14, 1.5); g.fillCircle(26, 14, 1.5);
      g.fillStyle(0xffffff, 0.6); g.fillEllipse(12, 7, 8, 3);
    });

    // kost
    kresli('kost', 34, 18, (g) => {
      g.fillStyle(0xb89a6a);
      g.fillRect(7, 5, 20, 8); g.fillCircle(7, 5, 5); g.fillCircle(7, 13, 5); g.fillCircle(27, 5, 5); g.fillCircle(27, 13, 5);
      g.fillStyle(0xffffff);
      g.fillRect(7, 6, 20, 6); g.fillCircle(7, 5, 3.8); g.fillCircle(7, 13, 3.8); g.fillCircle(27, 5, 3.8); g.fillCircle(27, 13, 3.8);
    });

    // bublina kyslíku
    kresli('kyslik', 34, 34, (g) => {
      g.fillStyle(0x9be7ff, 0.35); g.fillCircle(17, 17, 15);
      g.lineStyle(2.5, 0xffffff, 0.9); g.strokeCircle(17, 17, 15);
      g.fillStyle(0xffffff, 0.9); g.fillEllipse(11, 10, 7, 4);
      g.lineStyle(2, 0x1d6fa5, 0.9); g.strokeCircle(14, 19, 4); // "O"
      g.lineBetween(20, 21, 23, 21); g.lineBetween(23, 21, 20, 25); g.lineBetween(20, 25, 23, 25); // "2"
    });

    // malá bublinka do pozadí
    kresli('bublinka', 12, 12, (g) => {
      g.lineStyle(1.5, 0xffffff, 0.8); g.strokeCircle(6, 6, 4.5);
      g.fillStyle(0xffffff, 0.8); g.fillCircle(4.5, 4.5, 1.2);
    });

    // písek nahoře a kámen uvnitř
    kresli('dno', 48, 48, (g) => {
      g.fillStyle(0xcfa86a); g.fillRect(0, 0, 48, 48);
      g.fillStyle(0xead08f); g.fillRect(0, 0, 48, 9);
      g.fillStyle(0xf6e2ad); g.fillRect(0, 0, 48, 3);
      g.fillStyle(0xa8834c);
      [[8, 18], [30, 24], [18, 36], [40, 40], [4, 42], [26, 14]].forEach(([x, y]) => g.fillCircle(x, y, 2));
    });
    kresli('skala', 48, 48, (g) => {
      g.fillStyle(0x8a6a45); g.fillRect(0, 0, 48, 48);
      g.fillStyle(0x6f5235);
      [[10, 10], [34, 8], [22, 26], [6, 36], [40, 34], [28, 44]].forEach(([x, y]) => g.fillCircle(x, y, 3));
      g.fillStyle(0x9c7a52); g.fillCircle(16, 18, 2); g.fillCircle(38, 22, 2);
    });

    // mořská řasa (ozdoba)
    kresli('rasa', 24, 48, (g) => {
      g.lineStyle(4, 0x2f9e44);
      g.beginPath(); g.moveTo(8, 48); g.lineTo(4, 36); g.lineTo(10, 24); g.lineTo(5, 12); g.lineTo(9, 2); g.strokePath();
      g.lineStyle(3, 0x40c057);
      g.beginPath(); g.moveTo(16, 48); g.lineTo(20, 38); g.lineTo(14, 28); g.lineTo(19, 18); g.strokePath();
    });

    // kontrolní bod: bójka s vlajkou (červená = ještě ne, zelená = uloženo)
    const bojka = (barva) => (g) => {
      g.fillStyle(0x6b4f2a); g.fillRect(14, 4, 4, 46);
      g.fillStyle(barva); g.fillTriangle(18, 4, 34, 11, 18, 19);
      g.fillStyle(0xffffff); g.fillCircle(16, 4, 3);
      g.fillStyle(0xe03131); g.fillEllipse(16, 50, 26, 12);
      g.fillStyle(0xffffff); g.fillRect(4, 48, 24, 3);
    };
    kresli('bojka', 34, 58, bojka(0xe03131));
    kresli('bojka_ok', 34, 58, bojka(0x37b24d));

    // --- souboj s Robo-chobotnicí ---
    kresli('inkoust', 40, 40, (g) => {
      g.fillStyle(0x1b1622); g.fillCircle(20, 20, 17);
      g.fillCircle(6, 12, 5); g.fillCircle(34, 30, 5); g.fillCircle(30, 6, 4);
      g.fillStyle(0x5f3dc4, 0.8); g.fillCircle(17, 16, 7);
      g.fillStyle(0xffffff, 0.8); g.fillCircle(14, 13, 3);
    });
    kresli('vypinac', 56, 36, (g) => {
      g.fillStyle(0x1b1622); g.fillRoundedRect(0, 18, 56, 18, 6);
      g.fillStyle(0xffd43b); g.fillRoundedRect(4, 21, 48, 12, 4);
      g.fillStyle(0x1b1622); g.fillEllipse(28, 18, 44, 30);
      g.fillStyle(0xe03131); g.fillEllipse(28, 17, 36, 24);
      g.fillStyle(0xffffff, 0.7); g.fillEllipse(21, 11, 12, 6);
    });
    kresli('kryt', 76, 18, (g) => {
      g.fillStyle(0x1b1622); g.fillRoundedRect(0, 0, 76, 18, 6);
      g.fillStyle(0xadb5bd); g.fillRoundedRect(3, 3, 70, 12, 4);
      g.fillStyle(0x495057); g.fillCircle(10, 9, 3); g.fillCircle(66, 9, 3);
      g.lineStyle(2, 0xffd43b); g.lineBetween(20, 5, 28, 13); g.lineBetween(30, 5, 38, 13); g.lineBetween(40, 5, 48, 13);
    });
    kresli('klic', 40, 16, (g) => {
      g.fillStyle(0x1b1622); g.fillRoundedRect(8, 4, 26, 8, 3); g.fillCircle(8, 8, 8); g.fillCircle(34, 8, 7);
      g.fillStyle(0xced4da); g.fillRoundedRect(10, 6, 22, 4, 2); g.fillCircle(8, 8, 5.5); g.fillCircle(34, 8, 4.5);
      g.fillStyle(0x1b1622); g.fillRect(2, 6, 6, 4); g.fillCircle(36, 8, 2);
    });
    kresli('pruduch', 64, 16, (g) => {
      g.fillStyle(0x1b1622); g.fillRoundedRect(0, 0, 64, 16, 5);
      g.fillStyle(0x868e96); g.fillRoundedRect(3, 3, 58, 10, 3);
      g.fillStyle(0x343a40); [12, 24, 36, 48].forEach((x) => g.fillRect(x, 4, 5, 8));
    });

    // sada dlaždic pro mapu: 0 = písek nahoře, 1 = kámen uvnitř
    if (!scene.textures.exists('sada_dna')) {
      const sada = scene.textures.createCanvas('sada_dna', 96, 48);
      sada.draw(0, 0, scene.textures.get('dno').getSourceImage());
      sada.draw(48, 0, scene.textures.get('skala').getSourceImage());
      sada.refresh();
    }
  },

  // modrá voda s paprsky světla, přes celou obrazovku
  voda(scene) {
    const g = scene.add.graphics().setScrollFactor(0).setDepth(-20);
    g.fillGradientStyle(0x2b8fd6, 0x2b8fd6, 0x0b2a55, 0x0b2a55, 1);
    g.fillRect(0, 0, 1400, N.VYSKA); // širší než nejširší obrazovka
    const paprsky = scene.add.graphics().setScrollFactor(0.15, 0).setDepth(-19);
    paprsky.fillStyle(0xffffff, 0.05);
    for (let i = 0; i < 12; i++) {
      const x = i * 260 - 100;
      paprsky.fillTriangle(x, 0, x + 90, 0, x + 260, N.VYSKA);
    }
    return g;
  },

  // bublinky stoupající v pozadí
  bublinky(scene) {
    scene.time.addEvent({
      delay: 350,
      loop: true,
      callback: () => {
        const b = scene.add.image(Phaser.Math.Between(0, N.SIRKA), N.VYSKA + 10, 'bublinka')
          .setScrollFactor(0).setDepth(-10).setScale(Phaser.Math.FloatBetween(0.5, 1.4)).setAlpha(0.7);
        scene.tweens.add({
          targets: b,
          y: -20,
          x: b.x + Phaser.Math.Between(-40, 40),
          duration: Phaser.Math.Between(4000, 8000),
          onComplete: () => b.destroy(),
        });
      },
    });
  },
};
