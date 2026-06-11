#!/usr/bin/env python3
"""
Merge data from docs/glosses.xml into docs/lemmas_glosses.xml.

Rules:
- Do not overwrite existing <gloss> text in lemmas_glosses.xml if it already contains non-empty text.
- For entries missing in lemmas_glosses.xml, add the full entry (lemma, gloss, pp, gen if present in source).
- For existing entries, add missing <pp> and <gen> elements if present in source and absent in target.
- Do not alter existing elements other than adding missing pp/gen/gloss (when target gloss empty).

Creates a backup of the target file at docs/lemmas_glosses.xml.bak before writing.

Usage:
    python3 scripts/merge_glosses.py
"""
from pathlib import Path
import xml.etree.ElementTree as ET
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
GLOSSES = ROOT / 'docs' / 'glosses.xml'
TARGET = ROOT / 'docs' / 'lemmas_glosses.xml'
BACKUP = TARGET.with_suffix('.xml.bak')


def parse_xml_loose(path: Path):
    text = path.read_text(encoding='utf-8')
    try:
        return ET.fromstring(text)
    except ET.ParseError:
        # Fallback: extract all <entry>...</entry> blocks and construct a <body>
        import re
        entries = re.findall(r"<entry[^>]*>.*?</entry>", text, flags=re.DOTALL)
        if not entries:
            # As a last resort, try to extract the body contents
            start = text.find('<body')
            if start == -1:
                raise
            open_tag_end = text.find('>', start)
            if open_tag_end == -1:
                raise
            end = text.rfind('</body>')
            if end == -1:
                raise
            inner = text[open_tag_end+1:end]
            entries = re.findall(r"<entry[^>]*>.*?</entry>", inner, flags=re.DOTALL)
            if not entries:
                raise

        body = ET.Element('body')
        for ent_text in entries:
            try:
                ent = ET.fromstring(ent_text)
            except ET.ParseError:
                # skip malformed entry
                continue
            body.append(ent)
        return body


def find_child(elem, tag):
    for ch in elem:
        if ch.tag == tag:
            return ch
    return None


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


def main():
    if not GLOSSES.exists():
        print(f"Source file not found: {GLOSSES}")
        sys.exit(2)
    if not TARGET.exists():
        print(f"Target file not found: {TARGET}")
        sys.exit(2)

    src_root = parse_xml_loose(GLOSSES)
    tgt_root = parse_xml_loose(TARGET)

    # Build mapping of target entries by attribute n
    tgt_map = {}
    for entry in tgt_root.findall('entry'):
        n = entry.get('n')
        if n and n not in tgt_map:
            tgt_map[n] = entry

    added = 0
    pp_added = 0
    gen_added = 0
    gloss_added = 0

    for src_entry in src_root.findall('entry'):
        n = src_entry.get('n')
        # fallback to <lemma> text if no n attribute
        if not n:
            lemma_ch = find_child(src_entry, 'lemma')
            n = lemma_ch.text if lemma_ch is not None else None
        if not n:
            continue

        tgt_entry = tgt_map.get(n)
        if tgt_entry is None:
            # create a new entry and copy relevant children: lemma, pp, gen, gloss
            new_entry = ET.Element('entry', {'n': n})
            # lemma
            lemma_ch = find_child(src_entry, 'lemma')
            if lemma_ch is not None and (lemma_ch.text is not None):
                l = ET.SubElement(new_entry, 'lemma')
                l.text = lemma_ch.text
            else:
                l = ET.SubElement(new_entry, 'lemma')
                l.text = n
            # pp
            pp_ch = find_child(src_entry, 'pp')
            if pp_ch is not None and pp_ch.text and pp_ch.text.strip():
                pp = ET.SubElement(new_entry, 'pp')
                pp.text = pp_ch.text
            # gen
            gen_ch = find_child(src_entry, 'gen')
            if gen_ch is not None and gen_ch.text and gen_ch.text.strip():
                gen = ET.SubElement(new_entry, 'gen')
                gen.text = gen_ch.text
            # gloss
            gloss_ch = find_child(src_entry, 'gloss')
            g = ET.SubElement(new_entry, 'gloss')
            if gloss_ch is not None and gloss_ch.text and gloss_ch.text.strip():
                g.text = gloss_ch.text
                gloss_added += 1

            tgt_root.append(new_entry)
            tgt_map[n] = new_entry
            added += 1
        else:
            # existing entry: add pp and gen if absent
            # pp
            if find_child(tgt_entry, 'pp') is None:
                pp_ch = find_child(src_entry, 'pp')
                if pp_ch is not None and pp_ch.text and pp_ch.text.strip():
                    pp = ET.SubElement(tgt_entry, 'pp')
                    pp.text = pp_ch.text
                    pp_added += 1
            # gen
            if find_child(tgt_entry, 'gen') is None:
                gen_ch = find_child(src_entry, 'gen')
                if gen_ch is not None and gen_ch.text and gen_ch.text.strip():
                    gen = ET.SubElement(tgt_entry, 'gen')
                    gen.text = gen_ch.text
                    gen_added += 1
            # gloss: only add if target gloss missing or empty
            tgt_gloss = find_child(tgt_entry, 'gloss')
            src_gloss = find_child(src_entry, 'gloss')
            tgt_has_text = (tgt_gloss is not None and tgt_gloss.text and tgt_gloss.text.strip())
            if not tgt_has_text:
                if src_gloss is not None and src_gloss.text and src_gloss.text.strip():
                    if tgt_gloss is None:
                        tgt_gloss = ET.SubElement(tgt_entry, 'gloss')
                    tgt_gloss.text = src_gloss.text
                    gloss_added += 1

    # backup
    shutil.copy2(TARGET, BACKUP)

    indent(tgt_root)
    tree = ET.ElementTree(tgt_root)
    tree.write(TARGET, encoding='utf-8', xml_declaration=True)

    print(f"Merged from {GLOSSES} into {TARGET}: added {added} entries, pp+={pp_added}, gen+={gen_added}, gloss+={gloss_added} (backup at {BACKUP})")


if __name__ == '__main__':
    main()
