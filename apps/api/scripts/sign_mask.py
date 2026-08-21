#!/usr/bin/env python3
"""
Build an Ideogram Edit mask that isolates a road sign so only the BACKGROUND is regenerated.

Ideogram edit convention: BLACK = regenerate, WHITE = keep. So the sign is painted white (kept
exactly — its symbol never drifts) and everything else black (a fresh background is generated).

Usage: sign_mask.py <input_image> <output_mask_png>

Requires: rembg, onnxruntime, numpy, pillow (see requirements.txt). The u2net model downloads once
to ~/.u2net on first run.
"""
import sys

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: sign_mask.py <input_image> <output_mask_png>", file=sys.stderr)
        return 2

    src, mask_out = sys.argv[1], sys.argv[2]
    img = Image.open(src).convert("RGB")

    # rembg isolates the salient object (the bright sign + post) as an alpha matte.
    cut = remove(img, session=new_session("u2net"))
    alpha = np.array(cut.split()[-1])

    mask = np.where(alpha > 120, 255, 0).astype("uint8")  # white = sign (keep)
    m = Image.fromarray(mask).convert("L")
    m = m.filter(ImageFilter.MaxFilter(9))                # dilate to include the post + a small margin
    m = m.filter(ImageFilter.GaussianBlur(2))
    m = m.point(lambda p: 255 if p > 128 else 0)
    m.convert("RGB").save(mask_out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
