"""Doladí vyfocenou dětskou kresbu do čisté herní podoby.

Kresba zůstává základem, jen se uklidí:
  1. najde čáry a barvy proti papíru (i se stíny na fotce),
  2. uzavře mezery v obrysu a vyplní celou postavu, takže nemá díry,
  3. malé bílé mezery mezi tahy pastelky vyplní okolní barvou,
     velké bílé plochy (oči, zuby, kost) nechá a vybělí,
  4. vyhladí tahy pastelky do souvislé barvy a čáry ztmaví na "fix",
  5. kolem postavy přidá tmavý obrys, aby byla vidět na modré vodě.

Použití:
    python doladit_kresbu.py vstup.png vystup.png --vyska 300
"""
import argparse

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from scipy import ndimage

INKOUST = np.array([28, 24, 30], float)


def odhad_papiru(lum):
    f = 4
    male = lum[::f, ::f]
    papir = ndimage.median_filter(male, size=31)
    papir = ndimage.maximum_filter(papir, size=9)
    return np.kron(papir, np.ones((f, f)))[: lum.shape[0], : lum.shape[1]]


def doladit(vstup, vystup, vyska=None, sirka=None, oriznuti=None, otoceni=0.0, smaz=None, pridej=None,
            uzavreni=14, rozdil_jasu=22, sytost_min=34, mala_mezera=0.004, cara=95, obrys=5,
            sytost=1.45, jas=1.0, vyhlazeni=7):
    img = Image.open(vstup).convert("RGB")
    if oriznuti:
        img = img.crop(oriznuti)
    if otoceni:
        img = img.rotate(otoceni, resample=Image.BICUBIC, expand=True, fillcolor=(240, 236, 228))
    rgb = np.array(img).astype(float)
    lum = rgb.mean(axis=2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    papir_jas = odhad_papiru(lum)

    kresba = (papir_jas - lum > rozdil_jasu) | (sat > sytost_min)
    kresba = ndimage.binary_opening(kresba, iterations=1)
    if smaz is not None:
        kresba &= ~smaz(rgb)

    # 1) silueta bez děr a s hladkým okrajem
    p = uzavreni + 4
    tvar = ndimage.binary_closing(np.pad(kresba, p), iterations=uzavreni)
    tvar = ndimage.binary_fill_holes(tvar)[p:-p, p:-p]
    if pridej is not None:
        tvar |= pridej(tvar.shape)
        tvar = ndimage.binary_fill_holes(tvar)
    stitky, n = ndimage.label(tvar)
    if n:
        vel = ndimage.sum(tvar, stitky, range(1, n + 1))
        tvar = np.isin(stitky, [i + 1 for i, v in enumerate(vel) if v >= vel.max() * 0.03])
    tvar = ndimage.gaussian_filter(tvar.astype(float), 2.5) > 0.5

    # 2) co je čára (tmavá), co barva, co papír uvnitř postavy
    tmave = (papir_jas - lum) > cara
    barva = tvar & kresba & ~tmave
    papir_uvnitr = tvar & ~kresba

    # 3) malé díry mezi tahy vyplnit nejbližší barvou, velké bílé plochy vybělit
    stitky, n = ndimage.label(papir_uvnitr)
    plocha = tvar.sum()
    vel = ndimage.sum(papir_uvnitr, stitky, range(1, n + 1)) if n else []
    male_id = [i + 1 for i, v in enumerate(vel) if v < plocha * mala_mezera]
    male = np.isin(stitky, male_id)
    velke = papir_uvnitr & ~male
    zdroj = barva.copy()
    if zdroj.any():
        _, (iy, ix) = ndimage.distance_transform_edt(~zdroj, return_indices=True)
        vyplnene = rgb[iy, ix]
    else:
        vyplnene = rgb

    vysledek = rgb.copy()
    # vyhlazení pastelky: medián přes barevné plochy
    hladke = np.array(Image.fromarray(rgb.astype(np.uint8)).filter(ImageFilter.MedianFilter(vyhlazeni))).astype(float)
    vysledek[barva] = hladke[barva]
    vysledek[male] = np.array(Image.fromarray(vyplnene.astype(np.uint8)).filter(ImageFilter.MedianFilter(vyhlazeni))).astype(float)[male]
    vysledek[velke] = 252
    # čáry jako fix: tmavé a trochu tlustší
    cary = ndimage.binary_dilation(tmave & tvar, iterations=1) & tvar
    vysledek[cary] = vysledek[cary] * 0.25 + INKOUST * 0.75

    # 4) barvy živější
    out = Image.fromarray(vysledek.clip(0, 255).astype(np.uint8))
    out = ImageEnhance.Color(out).enhance(sytost)
    out = ImageEnhance.Brightness(out).enhance(jas)
    vysledek = np.array(out).astype(float)

    # 5) tmavý obrys kolem celé postavy
    okraj = ndimage.binary_dilation(tvar, iterations=obrys) & ~tvar
    alfa = tvar | okraj
    vysledek[okraj] = INKOUST
    alfa = ndimage.gaussian_filter(alfa.astype(float), 0.7)
    rgba = np.dstack([vysledek, (alfa * 255).clip(0, 255)]).astype(np.uint8)
    obr = Image.fromarray(rgba, "RGBA")
    obr = obr.crop(obr.getbbox())
    if vyska:
        obr = obr.resize((round(obr.width * vyska / obr.height), vyska), Image.LANCZOS)
    elif sirka:
        obr = obr.resize((sirka, round(obr.height * sirka / obr.width)), Image.LANCZOS)
    obr.save(vystup)
    print(f"{vystup}: {obr.width}x{obr.height}")
    return obr


if __name__ == "__main__":
    a = argparse.ArgumentParser()
    a.add_argument("vstup"); a.add_argument("vystup")
    a.add_argument("--vyska", type=int); a.add_argument("--sirka", type=int)
    a.add_argument("--uzavreni", type=int, default=14)
    a.add_argument("--obrys", type=int, default=5)
    x = a.parse_args()
    doladit(x.vstup, x.vystup, x.vyska, x.sirka, uzavreni=x.uzavreni, obrys=x.obrys)
