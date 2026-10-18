#!/usr/bin/env python3
"""Extract slide text + image references from a .pptx file to Markdown.

Usage:
    scripts/extract-pptx.py deck.pptx > outline.md
    scripts/extract-pptx.py deck.pptx --images out/img/ > outline.md

The .pptx is a zip of OOXML. We read slide XML directly - no python-pptx
dependency so this runs anywhere a stock python3 does.
"""
from __future__ import annotations

import argparse
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}

SLIDE_RE = re.compile(r"ppt/slides/slide(\d+)\.xml$")


def slide_text(xml: bytes) -> list[tuple[int, str]]:
    """Return (indent_level, text) pairs for each paragraph in a slide."""
    root = ET.fromstring(xml)
    out: list[tuple[int, str]] = []
    for p in root.iter(f"{{{NS['a']}}}p"):
        pPr = p.find(f"{{{NS['a']}}}pPr")
        lvl = int(pPr.get("lvl", "0")) if pPr is not None else 0
        parts = [t.text or "" for t in p.iter(f"{{{NS['a']}}}t")]
        text = "".join(parts).strip()
        if text:
            out.append((lvl, text))
    return out


def slide_image_rels(zf: zipfile.ZipFile, slide_name: str) -> list[str]:
    """Image file names referenced from a slide's .rels file."""
    base = slide_name.rsplit("/", 1)[-1]
    rels_name = f"ppt/slides/_rels/{base}.rels"
    if rels_name not in zf.namelist():
        return []
    root = ET.fromstring(zf.read(rels_name))
    images: list[str] = []
    for rel in root.iter("{http://schemas.openxmlformats.org/package/2006/relationships}Relationship"):
        target = rel.get("Target", "")
        if "image" in target.lower():
            images.append(target.replace("../", "ppt/"))
    return images


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("pptx", type=Path)
    ap.add_argument("--images", type=Path, help="Also extract images to this folder")
    args = ap.parse_args()

    if not args.pptx.is_file():
        print(f"not a file: {args.pptx}", file=sys.stderr)
        return 2

    with zipfile.ZipFile(args.pptx) as zf:
        slide_names = sorted(
            (n for n in zf.namelist() if SLIDE_RE.search(n)),
            key=lambda n: int(SLIDE_RE.search(n).group(1)),
        )
        if args.images:
            args.images.mkdir(parents=True, exist_ok=True)

        print(f"# {args.pptx.stem}\n")
        for n, name in enumerate(slide_names, 1):
            paragraphs = slide_text(zf.read(name))
            print(f"## Slide {n}\n")
            if not paragraphs:
                print("_(no text)_\n")
            else:
                title_lvl = paragraphs[0][0]
                title = paragraphs[0][1]
                print(f"**{title}**\n")
                for lvl, text in paragraphs[1:]:
                    print(f"{'  ' * lvl}- {text}")
                if len(paragraphs) > 1:
                    print()

            images = slide_image_rels(zf, name)
            for img in images:
                print(f"- image: `{img}`")
                if args.images and img in zf.namelist():
                    dest = args.images / Path(img).name
                    dest.write_bytes(zf.read(img))
            if images:
                print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
