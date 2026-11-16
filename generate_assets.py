import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ASSETS_DIR = os.path.abspath("yandex_assets")
os.makedirs(ASSETS_DIR, exist_ok=True)

# Helper function to get fonts with fallback
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
    # Draw radial glow
    steps = 40
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
    # Points of a stylized lightning bolt
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
# 1. ICON (512 x 512 px)
# ==============================================================================
def create_icon():
    img = Image.new("RGBA", (512, 512), (7, 7, 18, 255))
    glow_layer = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)

    # Ambient radial glows
    draw_radial_gradient(glow_draw, 512, 512, 256, 256, 240, (0, 240, 255, 120), (7, 7, 18, 0))
    draw_radial_gradient(glow_draw, 512, 512, 256, 256, 170, (255, 0, 127, 140), (0, 240, 255, 0))

    # Outer decorative tech rings
    for r in [210, 190, 165]:
        glow_draw.ellipse([256 - r, 256 - r, 256 + r, 256 + r],
                          outline=(0, 240, 255, 160), width=3)
    glow_draw.ellipse([256 - 145, 256 - 145, 256 + 145, 256 + 145],
                      outline=(255, 0, 127, 200), width=4)

    # Core orb base
    core_r = 120
    glow_draw.ellipse([256 - core_r, 256 - core_r, 256 + core_r, 256 + core_r],
                      fill=(20, 15, 45, 255), outline=(0, 240, 255, 255), width=6)

    # Inner core gradient
    draw_radial_gradient(glow_draw, 512, 512, 256, 256, 100, (255, 0, 127, 220), (10, 8, 25, 255))

    # Lightning with glow blur
    lightning_glow = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    lg_draw = ImageDraw.Draw(lightning_glow)
    draw_lightning(lg_draw, 256, 256, scale=1.4, color=(0, 240, 255, 220))
    lightning_glow = lightning_glow.filter(ImageFilter.GaussianBlur(12))

    # Crisp lightning on top
    draw_lightning(glow_draw, 256, 256, scale=1.4, color=(255, 230, 0, 255))
    draw_lightning(glow_draw, 256, 256, scale=1.0, color=(255, 255, 255, 255))

    # Corner cyber accents
    c_color = (0, 240, 255, 180)
    glow_draw.line([(25, 25), (75, 25)], fill=c_color, width=4)
    glow_draw.line([(25, 25), (25, 75)], fill=c_color, width=4)
    glow_draw.line([(487, 25), (437, 25)], fill=c_color, width=4)
    glow_draw.line([(487, 25), (487, 75)], fill=c_color, width=4)
    glow_draw.line([(25, 487), (75, 487)], fill=c_color, width=4)
    glow_draw.line([(25, 487), (25, 437)], fill=c_color, width=4)
    glow_draw.line([(487, 487), (437, 487)], fill=c_color, width=4)
    glow_draw.line([(487, 487), (487, 437)], fill=c_color, width=4)

    # Combine layers
    img = Image.alpha_composite(img, lightning_glow)
    img = Image.alpha_composite(img, glow_layer)
    out_path = os.path.join(ASSETS_DIR, "icon_512x512.png")
    img.convert("RGB").save(out_path, quality=95)
    print(f"Saved: {out_path}")

# ==============================================================================
# 2. COVER (800 x 600 px)
# ==============================================================================
def create_cover():
    width, height = 800, 600
    img = Image.new("RGBA", (width, height), (8, 9, 20, 255))
    draw = ImageDraw.Draw(img)

    # Cyber perspective grid at bottom
    horizon_y = 380
    for x in range(-200, width + 400, 45):
        draw.line([(width // 2, horizon_y), (x, height)], fill=(0, 240, 255, 45), width=2)
    for y_step in [400, 435, 480, 535, 600]:
        draw.line([(0, y_step), (width, y_step)], fill=(255, 0, 127, 40), width=2)

    # Ambient neon glows
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    draw_radial_gradient(glow_draw, width, height, width // 2, 230, 260, (0, 240, 255, 110), (0, 0, 0, 0))
    draw_radial_gradient(glow_draw, width, height, width // 2, 230, 180, (255, 0, 127, 130), (0, 0, 0, 0))
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    # Central Core Orb
    cx, cy = width // 2, 220
    draw.ellipse([cx - 100, cy - 100, cx + 100, cy + 100], fill=(22, 18, 48, 255), outline=(0, 240, 255, 255), width=5)
    draw.ellipse([cx - 80, cy - 80, cx + 80, cy + 80], outline=(255, 0, 127, 220), width=3)
    draw_lightning(draw, cx, cy, scale=1.1, color=(255, 230, 0, 255))
    draw_lightning(draw, cx, cy, scale=0.8, color=(255, 255, 255, 255))

    # Titles
    font_title = get_font(52, bold=True)
    font_sub = get_font(20, bold=True)
    font_badge = get_font(15, bold=True)

    # Shadow + Title text
    title_text = "VIBE CLICKER"
    bbox = draw.textbbox((0, 0), title_text, font=font_title)
    tw = bbox[2] - bbox[0]
    tx = (width - tw) // 2
    ty = 360

    # Glow shadow
    for off in [-3, -2, 2, 3]:
        draw.text((tx + off, ty), title_text, font=font_title, fill=(0, 240, 255, 120))
        draw.text((tx, ty + off), title_text, font=font_title, fill=(255, 0, 127, 120))
    draw.text((tx, ty), title_text, font=font_title, fill=(255, 255, 255, 255))

    # Subtitle
    sub_text = "⚡ НЕОНОВЫЙ КЛИКЕР • ЭРА НЕЙРОСЕТЕЙ ⚡"
    bbox_s = draw.textbbox((0, 0), sub_text, font=font_sub)
    sw = bbox_s[2] - bbox_s[0]
    draw.text(((width - sw) // 2, 435), sub_text, font=font_sub, fill=(0, 240, 255, 255))

    # AI Feature Badges
    badges = ["DeepSeek", "Qwen", "Gemini", "ChatGPT", "Claude"]
    total_w = len(badges) * 125
    start_bx = (width - total_w) // 2
    for idx, bname in enumerate(badges):
        bx = start_bx + idx * 125
        by = 500
        draw.rounded_rectangle([bx, by, bx + 115, by + 34], radius=8,
                               fill=(20, 24, 46, 220), outline=(0, 240, 255, 150), width=1)
        bb = draw.textbbox((0, 0), bname, font=font_badge)
        bw = bb[2] - bb[0]
        draw.text((bx + (115 - bw) // 2, by + 8), bname, font=font_badge, fill=(240, 244, 255, 255))

    out_path = os.path.join(ASSETS_DIR, "cover_800x600.png")
    img.convert("RGB").save(out_path, quality=95)
    print(f"Saved: {out_path}")

# ==============================================================================
# 3. PROMO BANNER (1920 x 1080 px)
# ==============================================================================
def create_banner():
    width, height = 1920, 1080
    img = Image.new("RGBA", (width, height), (7, 8, 18, 255))
    draw = ImageDraw.Draw(img)

    # Horizon perspective grid
    horizon_y = 680
    for x in range(-500, width + 1000, 75):
        draw.line([(width // 2, horizon_y), (x, height)], fill=(0, 240, 255, 50), width=2)
    for y in [700, 740, 795, 870, 965, 1080]:
        draw.line([(0, y), (width, y)], fill=(255, 0, 127, 45), width=2)

    # Giant ambient glow
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow)
    draw_radial_gradient(g_draw, width, height, width // 2, 420, 500, (0, 240, 255, 130), (0, 0, 0, 0))
    draw_radial_gradient(g_draw, width, height, width // 2, 420, 360, (255, 0, 127, 140), (0, 0, 0, 0))
    draw_radial_gradient(g_draw, width, height, width // 2, 420, 220, (255, 230, 0, 110), (0, 0, 0, 0))
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    # Hero Orb
    cx, cy = width // 2, 400
    for r in [210, 190, 170]:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(0, 240, 255, 180), width=4)
    draw.ellipse([cx - 145, cy - 145, cx + 145, cy + 145], fill=(22, 17, 50, 255), outline=(255, 0, 127, 240), width=7)

    draw_lightning(draw, cx, cy, scale=1.8, color=(255, 230, 0, 255))
    draw_lightning(draw, cx, cy, scale=1.3, color=(255, 255, 255, 255))

    # Main Big Typography
    font_giant = get_font(108, bold=True)
    font_sub = get_font(38, bold=True)
    font_pill = get_font(26, bold=True)

    title = "VIBE CLICKER"
    bbox = draw.textbbox((0, 0), title, font=font_giant)
    tw = bbox[2] - bbox[0]
    tx = (width - tw) // 2
    ty = 650

    # Glow shadow
    for off in [-6, -4, 4, 6]:
        draw.text((tx + off, ty), title, font=font_giant, fill=(0, 240, 255, 140))
        draw.text((tx, ty + off), title, font=font_giant, fill=(255, 0, 127, 140))
    draw.text((tx, ty), title, font=font_giant, fill=(255, 255, 255, 255))

    # Tagline
    tagline = "⚡ НЕОНОВЫЙ КЛИКЕР НОВОГО ПОКОЛЕНИЯ • ЭРА НЕЙРОСЕТЕЙ ⚡"
    bbox_t = draw.textbbox((0, 0), tagline, font=font_sub)
    draw.text(((width - (bbox_t[2] - bbox_t[0])) // 2, 790), tagline, font=font_sub, fill=(0, 240, 255, 255))

    # Bottom Highlights
    highlights = ["🚀 ГИПЕР-ВАЙБ x3.5", "🧠 5 ЭР НЕЙРОСЕТЕЙ", "🌌 ПЕРЕРОЖДЕНИЕ", "💎 ЛЕТАЮЩИЕ БОНУСЫ"]
    hw_total = len(highlights) * 360
    start_hx = (width - hw_total) // 2
    for i, h in enumerate(highlights):
        hx = start_hx + i * 360
        hy = 890
        draw.rounded_rectangle([hx, hy, hx + 330, hy + 65], radius=14,
                               fill=(16, 20, 42, 220), outline=(0, 240, 255, 180), width=2)
        hb = draw.textbbox((0, 0), h, font=font_pill)
        draw.text((hx + (330 - (hb[2] - hb[0])) // 2, hy + 17), h, font=font_pill, fill=(255, 255, 255, 255))

    out_path = os.path.join(ASSETS_DIR, "banner_1920x1080.png")
    img.convert("RGB").save(out_path, quality=95)
    print(f"Saved: {out_path}")

if __name__ == "__main__":
    create_icon()
    create_cover()
    create_banner()
    print("All core promotional assets successfully generated!")
