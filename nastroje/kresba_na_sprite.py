"""Převede vyfocenou kresbu na sprite s průhledným pozadím.

Použití:
    python kresba_na_sprite.py vstup.png vystup.png --vyska 160
    python kresba_na_sprite.py vstup.png vystup.png --sirka 480 --kontrast 1.6

Postup: odhadne barvu papíru (i se stíny), najde tužkové čáry a vybarvené
plochy, uzavře mezery v obrysu a vyplní vnitřek postavy. Bílá místa uvnitř
obrysu (oči, zuby) tak zůstanou. Potřebuje Pillow, numpy a scipy.
"""
import argparse

import numpy as np
from PIL import Image, ImageEnhance
from scipy import ndimage


def odhad_papiru(lum):
    """Jas papíru v každém bodě (velký mediánový filtr ignoruje tenké čáry)."""
    f = 4
    male = lum[::f, ::f]
    papir = ndimage.median_filter(male, size=31)
    papir = ndimage.maximum_filter(papir, size=9)
    papir = np.kron(papir, np.ones((f, f)))[: lum.shape[0], : lum.shape[1]]
    return papir


def maska_kresby(rgb, rozdil_jasu, sytost_min, uzavreni):
    rgb = rgb.astype(float)
    lum = rgb.mean(axis=2)
    sytost = rgb.max(axis=2) - rgb.min(axis=2)
    papir = odhad_papiru(lum)
    cary = (papir - lum > rozdil_jasu) | (sytost > sytost_min)
    cary = ndimage.binary_opening(cary, iterations=1)  # pryč s šumem papíru
    return cary


def preved(vstup, vystup, vyska=None, sirka=None, kontrast=1.3, barvy=1.5, jas=1.0,
           rozdil_jasu=28, sytost_min=38, uzavreni=6, otoceni=0.0, oriznuti=None, smaz=None,
           odstran_tenke=0):
    img = Image.open(vstup).convert("RGB")
    if oriznuti:
        img = img.crop(oriznuti)
    if otoceni:
        img = img.rotate(otoceni, resample=Image.BICUBIC, expand=True, fillcolor=(240, 236, 228))
    rgb = np.array(img)
    cary = maska_kresby(rgb, rozdil_jasu, sytost_min, uzavreni)
    if smaz is not None:
        cary &= ~smaz(rgb)
    # uzavřít mezery v obrysu, vyplnit vnitřek, vrátit okraj zpět
    tvar = ndimage.binary_closing(np.pad(cary, uzavreni + 2), iterations=uzavreni)
    tvar = ndimage.binary_fill_holes(tvar)[uzavreni + 2: -(uzavreni + 2), uzavreni + 2: -(uzavreni + 2)]
    tvar = ndimage.binary_erosion(tvar, iterations=1)
    if odstran_tenke:  # pryč s tenkými čarami, které nepatří k postavě
        tvar = ndimage.binary_opening(tvar, iterations=odstran_tenke)
    # nechat jen podstatné kusy
    stitky, pocet = ndimage.label(tvar)
    if pocet:
        velikosti = ndimage.sum(tvar, stitky, range(1, pocet + 1))
        nejvetsi = velikosti.max()
        ponechat = [i + 1 for i, v in enumerate(velikosti) if v >= nejvetsi * 0.02]
        tvar = np.isin(stitky, ponechat)
    alfa = ndimage.gaussian_filter(tvar.astype(float), 0.8)

    img = ImageEnhance.Contrast(img).enhance(kontrast)
    img = ImageEnhance.Color(img).enhance(barvy)
    img = ImageEnhance.Brightness(img).enhance(jas)
    rgba = np.dstack([np.array(img), (alfa * 255).clip(0, 255).astype(np.uint8)])
    out = Image.fromarray(rgba, "RGBA")
    out = out.crop(out.getbbox())
    if vyska:
        out = out.resize((round(out.width * vyska / out.height), vyska), Image.LANCZOS)
    elif sirka:
        out = out.resize((sirka, round(out.height * sirka / out.width)), Image.LANCZOS)
    out.save(vystup)
    print(f"{vystup}: {out.width}x{out.height}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("vstup")
    p.add_argument("vystup")
    p.add_argument("--vyska", type=int)
    p.add_argument("--sirka", type=int)
    p.add_argument("--kontrast", type=float, default=1.3)
    p.add_argument("--barvy", type=float, default=1.5)
    p.add_argument("--jas", type=float, default=1.0)
    p.add_argument("--uzavreni", type=int, default=6, help="jak velké mezery v obrysu se mají uzavřít")
    a = p.parse_args()
    preved(a.vstup, a.vystup, a.vyska, a.sirka, a.kontrast, a.barvy, a.jas, uzavreni=a.uzavreni)
