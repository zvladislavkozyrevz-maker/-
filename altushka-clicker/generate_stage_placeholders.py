"""
Generates stylized visual assets for Levels 2, 4, 5 of Altushka Clicker
Matching the 16:9 dark gothic / anime color palette.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import os

W, H = 1280, 720

stages = [
    {
        "id": 2,
        "filename": "pack1_level2.jpg",
        "title": "УРОВЕНЬ 2: НАЧИНАЮЩАЯ",
        "subtitle": "Первые стрелки, тоник в волосах и баночка энергетика",
        "gradient": [(25, 20, 45), (60, 30, 90), (15, 10, 25)],
        "accent": (216, 70, 239),
        "tag": "⚡ ФАЗА ПОЗЕРШИ",
        "desc": "«Я не позерша! Просто мне нравится этот вайб»"
    },
    {
        "id": 4,
        "filename": "pack1_level4.jpg",
        "title": "УРОВЕНЬ 4: ДРЕЙН-ИКОНА",
        "subtitle": "Китай-город, оверсайз зипка, септум и треки 9mice",
        "gradient": [(18, 12, 35), (45, 15, 75), (10, 5, 20)],
        "accent": (168, 85, 247),
        "tag": "🖤 VIPERR DRAIN",
        "desc": "«Слушаю 9mice на повторе и плачу на скамейке в Яме»"
    },
    {
        "id": 5,
        "filename": "pack1_level5.jpg",
        "title": "УРОВЕНЬ 5: УЛЬТРА-АЛЬТУШКА",
        "subtitle": "160 см, 140 кг, абсолютная сексуальная королева рейва",
        "gradient": [(30, 8, 45), (85, 15, 110), (20, 5, 30)],
        "accent": (244, 63, 94),
        "tag": "👑 АБСОЛЮТНОЕ ВЕЛИЧИЕ",
        "desc": "«160 сантиметров чистого хайпа и 140 кг чистой любви»"
    }
]

out_dir = "altushka-clicker/assets/images"
os.makedirs(out_dir, exist_ok=True)

for stage in stages:
    img = Image.new("RGB", (W, H), color=(15, 12, 25))
    draw = ImageDraw.Draw(img)

    # Background gradient
    g_start, g_mid, g_end = stage["gradient"]
    for y in range(H):
        t = y / H
        if t < 0.5:
            st = t * 2
            r = int(g_start[0] * (1 - st) + g_mid[0] * st)
            g = int(g_start[1] * (1 - st) + g_mid[1] * st)
            b = int(g_start[2] * (1 - st) + g_mid[2] * st)
        else:
            st = (t - 0.5) * 2
            r = int(g_mid[0] * (1 - st) + g_end[0] * st)
            g = int(g_mid[1] * (1 - st) + g_end[1] * st)
            b = int(g_mid[2] * (1 - st) + g_end[2] * st)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    # Grid / Cyber lines
    for x in range(0, W, 80):
        draw.line([(x, 0), (x, H)], fill=(255, 255, 255, 15), width=1)
    for y in range(0, H, 80):
        draw.line([(0, y), (W, y)], fill=(255, 255, 255, 15), width=1)

    # Stylized glowing center frame
    accent = stage["accent"]
    draw.rectangle([120, 80, W - 120, H - 80], outline=accent, width=3)
    draw.rectangle([130, 90, W - 130, H - 90], outline=(accent[0]//2, accent[1]//2, accent[2]//2), width=1)

    # Corners decor
    cw = 40
    for cx, cy in [(120, 80), (W-120, 80), (120, H-80), (W-120, H-80)]:
        draw.rectangle([cx - 8, cy - 8, cx + 8, cy + 8], fill=accent)

    # Center silhouette / icon representation
    center_y = H // 2 - 20
    # Center circle badge
    draw.ellipse([W//2 - 120, center_y - 120, W//2 + 120, center_y + 120], outline=accent, width=4)

    # Try font or default
    try:
        font_big = ImageFont.truetype("arial.ttf", 46)
        font_mid = ImageFont.truetype("arial.ttf", 26)
        font_tag = ImageFont.truetype("arial.ttf", 20)
        font_quote = ImageFont.truetype("arial.ttf", 22)
    except:
        font_big = font_mid = font_tag = font_quote = ImageFont.load_default()

    # Draw Tag
    draw.text((W//2, 140), stage["tag"], fill=accent, font=font_tag, anchor="mm")

    # Center text
    draw.text((W//2, center_y - 30), f"LVL {stage['id']}", fill=(255, 255, 255), font=font_big, anchor="mm")
    draw.text((W//2, center_y + 20), stage["title"], fill=accent, font=font_mid, anchor="mm")

    # Subtitle
    draw.text((W//2, center_y + 160), stage["subtitle"], fill=(220, 220, 235), font=font_mid, anchor="mm")
    draw.text((W//2, center_y + 210), stage["desc"], fill=(180, 160, 200), font=font_quote, anchor="mm")

    out_path = os.path.join(out_dir, stage["filename"])
    img.save(out_path, quality=92)
    print(f"Generated {out_path}")
