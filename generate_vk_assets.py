import os
from PIL import Image

ASSETS_DIR = os.path.abspath("yandex_assets")

# 1. VK Icon 256x256 from 512x512
src_icon = os.path.join(ASSETS_DIR, "icon_512x512.png")
if os.path.exists(src_icon):
    im = Image.open(src_icon)
    im_256 = im.resize((256, 256), Image.Resampling.LANCZOS)
    im_256.save(os.path.join(ASSETS_DIR, "vk_icon_256x256.png"), quality=95)
    print("Saved vk_icon_256x256.png")

# 2. VK Banner 1120x630 from 1920x1080 (16:9)
src_banner = os.path.join(ASSETS_DIR, "banner_1920x1080.png")
if os.path.exists(src_banner):
    im = Image.open(src_banner)
    im_1120 = im.resize((1120, 630), Image.Resampling.LANCZOS)
    im_1120.save(os.path.join(ASSETS_DIR, "vk_banner_1120x630.png"), quality=95)
    print("Saved vk_banner_1120x630.png")
