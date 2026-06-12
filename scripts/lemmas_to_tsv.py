#!/usr/bin/env python3
"""
Create a TSV of lemmas from docs/lemmas.csv with their glosses from docs/shortdefs.txt.
Writes output to docs/lemmas_glosses.tsv (overwrites if exists).

Behavior:
- Loads `docs/shortdefs.txt` as a tab-separated key -> definition file. Keys are normalized to lower-case.
- Reads `docs/lemmas.csv` as a single-column CSV (one lemma per line). Keeps original order.
- Matches case-insensitively and writes `lemma\tgloss` rows. If no gloss is found, the gloss cell is left empty.

Usage:
    python scripts/lemmas_to_tsv.py

"""
from pathlib import Path
import csv
import sys

ROOT = Path(__file__).resolve().parents[1]
LEMMA_CSV = ROOT / 'docs' / 'lemmas.csv'
SHORTDEFS = ROOT / 'docs' / 'shortdefs.txt'
OUT_XML = ROOT / 'docs' / 'lemmas_glosses.xml'


def load_shortdefs(path: Path):
    mapping = {}
    if not path.exists():
        raise FileNotFoundError(f"shortdefs file not found: {path}")
    with path.open('r', encoding='utf-8') as fh:
        for raw in fh:
            line = raw.rstrip('\n')
            if not line.strip():
                continue
            # split on first tab; if no tab, try split on two or more spaces
            if '\t' in line:
                key, gloss = line.split('\t', 1)
            else:
                parts = line.split(None, 1)
                if len(parts) == 2:
                    key, gloss = parts
                else:
                    key = parts[0]
                    gloss = ''
            k = key.strip().lower()
            if k and k not in mapping:
                mapping[k] = gloss.strip()
    return mapping


def load_lemmas(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"lemmas file not found: {path}")
    lemmas = []
    # read as simple text lines; some entries may contain commas (but file is one column)
    with path.open('r', encoding='utf-8') as fh:
        for raw in fh:
            line = raw.strip()
            if not line:
                continue
            # If it's a CSV row that contains commas, csv.reader would split; here we assume single column per line
            # But also allow lines like 'word,other' -> take the first field
            if ',' in line:
                first = line.split(',', 1)[0].strip()
            else:
                first = line
            if first:
                lemmas.append(first)
    return lemmas


def main():
    try:
        defs = load_shortdefs(SHORTDEFS)
    except Exception as e:
        print(f"Error loading shortdefs: {e}", file=sys.stderr)
        sys.exit(2)
    try:
        lemmas = load_lemmas(LEMMA_CSV)
    except Exception as e:
        print(f"Error loading lemmas: {e}", file=sys.stderr)
        sys.exit(2)

    # Build XML similar to docs/glosses.xml: <body><entry n="..."><lemma>...</lemma><gloss>...</gloss></entry>...</body>
    import xml.etree.ElementTree as ET

    body = ET.Element('body')
    found = 0
    for lemma in lemmas:
        key = lemma.strip().lower()
        gloss = defs.get(key, '')
        if gloss:
            found += 1

        entry = ET.SubElement(body, 'entry')
        # set attribute n to the lemma as in glosses.xml (preserve original case)
        entry.set('n', lemma)

        lemma_el = ET.SubElement(entry, 'lemma')
        lemma_el.text = lemma

        # write gloss element; keep empty element if no gloss
        gloss_el = ET.SubElement(entry, 'gloss')
        if gloss:
            gloss_el.text = gloss

    # pretty print indent
    def indent(elem, level=0):
        i = "\n" + level * "    "
        if len(elem):
            if not elem.text or not elem.text.strip():
                elem.text = i + "    "
            for child in elem:
                indent(child, level + 1)
            if not child.tail or not child.tail.strip():
                child.tail = i
        else:
            if level and (not elem.tail or not elem.tail.strip()):
                elem.tail = i

    indent(body)

    tree = ET.ElementTree(body)
    tree.write(OUT_XML, encoding='utf-8', xml_declaration=True)

    print(f"Wrote {OUT_XML} ({len(lemmas)} lemmas, {found} glosses found)")


if __name__ == '__main__':
    main()
