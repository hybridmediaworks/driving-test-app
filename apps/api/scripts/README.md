# Sign-mask helper (rembg)

Sign/symbol quiz images are regenerated with Ideogram **Edit** (inpaint): the sign is masked and kept
exactly while only the background is regenerated. `sign_mask.py` builds that mask (white = sign, black
= regenerate) using [rembg](https://github.com/danielgatis/rembg).

`GenerateQuizImageCandidate` calls it via `IDEOGRAM_PYTHON_BIN` (default `scripts/.venv/bin/python`).

## Setup (once per machine / deploy)

```bash
cd apps/api/scripts
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
```

The u2net model (~176 MB) downloads to `~/.u2net` on first run. `.venv/` is git-ignored.

To use a different interpreter, set `IDEOGRAM_PYTHON_BIN` in `.env` to a python that has
`requirements.txt` installed.
