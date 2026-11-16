import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

UPLOADS_DIR = r"C:\Users\kzvla\.gemini\antigravity\brain\5751bb8a-511b-4a97-bdca-227aa6c4265e\browser_sandbox\uploads"
ASSETS_DIR = os.path.abspath("yandex_assets")
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)

def get_font(size, bold=False):
    font_names = [
        "C:\\Windows\\Fonts\\arialbd.ttf" if bold else "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\segoeuib.ttf" if bold else "C:\\Windows\\Fonts\\segoeui.ttf",
        "C:\\Windows\\Fonts\\tahomabd.ttf" if bold else "C:\\Windows\\Fonts\\tahoma.ttf",
        "arial.ttf"
    ]
    for fn in font_names:
        if os.path.exists(fn):
            try:
                return ImageFont.truetype(fn, size)
            except Exception:
                continue
    return ImageFont.load_default()

def draw_radial_gradient(draw, width, height, center_x, center_y, max_r, color_inner, color_outer):
    steps = 35
    for i in range(steps, 0, -1):
        r = (i / steps) * max_r
        ratio = i / steps
        alpha = int(color_inner[3] * (1 - ratio) + color_outer[3] * ratio)
        r_c = int(color_inner[0] * (1 - ratio) + color_outer[0] * ratio)
        g_c = int(color_inner[1] * (1 - ratio) + color_outer[1] * ratio)
        b_c = int(color_inner[2] * (1 - ratio) + color_outer[2] * ratio)
        draw.ellipse([center_x - r, center_y - r, center_x + r, center_y + r],
                     fill=(r_c, g_c, b_c, alpha))

def draw_lightning(draw, cx, cy, scale=1.0, color=(255, 230, 0, 255)):
    pts = [
        (cx - 10 * scale, cy - 70 * scale),
        (cx + 25 * scale, cy - 70 * scale),
        (cx + 5 * scale,  cy - 10 * scale),
        (cx + 35 * scale, cy - 10 * scale),
        (cx - 30 * scale, cy + 70 * scale),
        (cx - 10 * scale, cy + 10 * scale),
        (cx - 35 * scale, cy + 10 * scale),
    ]
    draw.polygon(pts, fill=color)

# ==============================================================================
# 1. COVER (EXACT 800 x 470 px)
# ==============================================================================
def create_cover_800x470():
    width, height = 800, 470
    img = Image.new("RGBA", (width, height), (8, 9, 20, 255))
    draw = ImageDraw.Draw(img)

    # Perspective cyber grid
    horizon_y = 300
    for x in range(-200, width + 400, 45):
        draw.line([(width // 2, horizon_y), (x, height)], fill=(0, 240, 255, 45), width=2)
    for y_step in [315, 345, 385, 430, 470]:
        draw.line([(0, y_step), (width, y_step)], fill=(255, 0, 127, 40), width=2)

    # Glow layer
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    draw_radial_gradient(glow_draw, width, height, width // 2, 170, 220, (0, 240, 255, 120), (0, 0, 0, 0))
    draw_radial_gradient(glow_draw, width, height, width // 2, 170, 150, (255, 0, 127, 140), (0, 0, 0, 0))
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    # Central Core Orb
    cx, cy = width // 2, 160
    draw.ellipse([cx - 85, cy - 85, cx + 85, cy + 85], fill=(22, 18, 48, 255), outline=(0, 240, 255, 255), width=4)
    draw.ellipse([cx - 70, cy - 70, cx + 70, cy + 70], outline=(255, 0, 127, 220), width=3)
    draw_lightning(draw, cx, cy, scale=0.95, color=(255, 230, 0, 255))
    draw_lightning(draw, cx, cy, scale=0.7, color=(255, 255, 255, 255))

    font_title = get_font(46, bold=True)
    font_sub = get_font(18, bold=True)
    font_badge = get_font(14, bold=True)

    # Title
    title_text = "VIBE CLICKER"
    bbox = draw.textbbox((0, 0), title_text, font=font_title)
    tw = bbox[2] - bbox[0]
    tx = (width - tw) // 2
    ty = 275

    for off in [-3, -2, 2, 3]:
        draw.text((tx + off, ty), title_text, font=font_title, fill=(0, 240, 255, 120))
        draw.text((tx, ty + off), title_text, font=font_title, fill=(255, 0, 127, 120))
    draw.text((tx, ty), title_text, font=font_title, fill=(255, 255, 255, 255))

    # Subtitle
    sub_text = "⚡ НЕОНОВЫЙ КЛИКЕР • ЭРА НЕЙРОСЕТЕЙ ⚡"
    bbox_s = draw.textbbox((0, 0), sub_text, font=font_sub)
    draw.text(((width - (bbox_s[2] - bbox_s[0])) // 2, 340), sub_text, font=font_sub, fill=(0, 240, 255, 255))

    # Badges
    badges = ["DeepSeek", "Qwen", "Gemini", "ChatGPT", "Claude"]
    total_w = len(badges) * 120
    start_bx = (width - total_w) // 2
    for idx, bname in enumerate(badges):
        bx = start_bx + idx * 120
        by = 390
        draw.rounded_rectangle([bx, by, bx + 110, by + 32], radius=6,
                               fill=(18, 22, 44, 230), outline=(0, 240, 255, 160), width=1)
        bb = draw.textbbox((0, 0), bname, font=font_badge)
        draw.text((bx + (110 - (bb[2] - bb[0])) // 2, by + 7), bname, font=font_badge, fill=(240, 244, 255, 255))

    for p in [os.path.join(ASSETS_DIR, "cover_800x470.png"), os.path.join(UPLOADS_DIR, "cover_800x470.png")]:
        img.convert("RGB").save(p, quality=95)
        print(f"Saved: {p}")

# ==============================================================================
# 2. SCREENSHOTS (1920 x 1080 px - EXACT 16:9 RATIO)
# ==============================================================================
def create_16x9_screenshots():
    # 1. Desktop gameplay screenshot (pad/scale to exact 1920x1080 16:9)
    src_desktop = os.path.join(ASSETS_DIR, "screenshot_desktop_gameplay.png")
    if os.path.exists(src_desktop):
        im = Image.open(src_desktop)
        # 1440x900 is 16:10. To make it exact 1920x1080 (16:9):
        # We resize maintaining aspect ratio and place on cyberpunk dark background
        target = Image.new("RGB", (1920, 1080), (7, 7, 18))
        im_resized = im.resize((1728, 1080), Image.Resampling.LANCZOS)
        x_off = (1920 - 1728) // 2
        target.paste(im_resized, (x_off, 0))

        p1 = os.path.join(UPLOADS_DIR, "screenshot_1_1920x1080.png")
        p1_a = os.path.join(ASSETS_DIR, "screenshot_1_1920x1080.png")
        target.save(p1, quality=95)
        target.save(p1_a, quality=95)
        print(f"Saved: {p1}")

    # 2. Rebirth modal screenshot (place nicely on 1920x1080 16:9 canvas)
    src_rebirth = os.path.join(ASSETS_DIR, "screenshot_2_rebirth_modal.png")
    if os.path.exists(src_rebirth):
        im = Image.open(src_rebirth)
        target = Image.new("RGB", (1920, 1080), (6, 7, 16))
        # Add subtle cyber grid background
        draw = ImageDraw.Draw(target)
        for x in range(0, 1920, 60):
            draw.line([(x, 0), (x, 1080)], fill=(0, 240, 255, 15), width=1)
        for y in range(0, 1080, 60):
            draw.line([(0, y), (1920, y)], fill=(255, 0, 127, 15), width=1)

        im_scaled = im.resize((int(im.width * (1040 / im.height)), 1040), Image.Resampling.LANCZOS)
        x_off = (1920 - im_scaled.width) // 2
        target.paste(im_scaled, (x_off, 20))

        p2 = os.path.join(UPLOADS_DIR, "screenshot_2_1920x1080.png")
        p2_a = os.path.join(ASSETS_DIR, "screenshot_2_1920x1080.png")
        target.save(p2, quality=95)
        target.save(p2_a, quality=95)
        print(f"Saved: {p2}")

    # 3. Fever overdrive screenshot (on 1920x1080 16:9 canvas)
    src_fever = os.path.join(ASSETS_DIR, "screenshot_3_fever_overdrive.png")
    if os.path.exists(src_fever):
        im = Image.open(src_fever)
        target = Image.new("RGB", (1920, 1080), (8, 6, 20))
        draw = ImageDraw.Draw(target)
        for x in range(0, 1920, 60):
            draw.line([(x, 0), (x, 1080)], fill=(255, 0, 127, 15), width=1)
        for y in range(0, 1080, 60):
            draw.line([(0, y), (1920, y)], fill=(255, 230, 0, 15), width=1)

        im_scaled = im.resize((int(im.width * (1040 / im.height)), 1040), Image.Resampling.LANCZOS)
        x_off = (1920 - im_scaled.width) // 2
        target.paste(im_scaled, (x_off, 20))

        p3 = os.path.join(UPLOADS_DIR, "screenshot_3_1920x1080.png")
        p3_a = os.path.join(ASSETS_DIR, "screenshot_3_1920x1080.png")
        target.save(p3, quality=95)
        target.save(p3_a, quality=95)
        print(f"Saved: {p3}")

if __name__ == "__main__":
    create_cover_800x470()
    create_16x9_screenshots()
    print("Exact dimension assets ready!")
