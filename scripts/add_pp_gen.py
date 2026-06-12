#!/usr/bin/env python3
"""
Populate <pp> (principal parts) for verbs and <gen> (gender) for nouns
in docs/lemmas_glosses.xml using docs/lexemes.csv and docs/forms.csv.

Creates a backup of the original XML as lemmas_glosses.xml.bak and
writes the updated file in-place.
"""
import csv
import re
import sys
from xml.etree import ElementTree as ET

BASE = 'docs'
LEXEMES = BASE + '/lexemes.csv'
FORMS = BASE + '/forms.csv'
XML = BASE + '/lemmas_glosses.xml'


def read_lexemes(path):
    lex = {}
    with open(path, newline='', encoding='utf-8') as f:
        r = csv.reader(f)
        headers = next(r)
        for row in r:
            if not row or len(row) < 3:
                continue
            lex_id, label, pos = row[0].strip(), row[1].strip(), row[2].strip()
            lex[lex_id] = {'label': label, 'pos': pos}
    return lex


def read_forms(path):
    forms = {}
    with open(path, newline='', encoding='utf-8') as f:
        r = csv.DictReader(f)
        for row in r:
            lex = row['lexeme'].strip()
            forms.setdefault(lex, []).append({
                'cell': row['cell'].strip(),
                'orth': row['orth_form'].strip(),
                'analysed': row.get('analysed_orth_form', '').strip(),
                'flexeme': row.get('flexeme', '').strip(),
            })
    return forms


def detect_gender(forms_rows):
    # prefer explicit markers in flexeme like _f_, _m_, _n_
    if not forms_rows:
        return None
    for r in forms_rows:
        flex = r.get('flexeme', '')
        for token in flex.split(';'):
            if '_f_' in token or token.endswith('_f'):
                return 'f.'
            if '_m_' in token or token.endswith('_m'):
                return 'm.'
            if '_n_' in token or token.endswith('_n'):
                return 'n.'
    # fallback: look for common noun endings in analysed or orth
    for r in forms_rows:
        orth = r.get('orth', '')
        if orth.endswith('a'):
            return 'f.'
        if orth.endswith('us') or orth.endswith('er'):
            return 'm.'
        if orth.endswith('um'):
            return 'n.'
    return None


def build_pp(lex_id, lex_label, forms_rows):
    if not forms_rows:
        return None
    # present: use lex_label
    present = lex_label
    # infinitive: look for cell containing '.inf'
    inf = None
    perf = None
    sup = None
    for r in forms_rows:
        c = r['cell']
        orth = r['orth']
        if not orth:
            continue
        if '.inf' in c and inf is None:
            inf = orth
        if c.startswith('prf.act.ind') and perf is None:
            perf = orth
        if 'prf.pass.ptcp' in c and sup is None:
            sup = orth
    parts = [p for p in (present, inf, perf, sup) if p]
    if parts:
        return ', '.join(parts)
    return None


def normalize_label(s):
    if s is None:
        return ''
    s2 = s.lower()
    # strip trailing digits and punctuation
    s2 = re.sub(r"[\d_]+$", '', s2)
    s2 = s2.strip()
    return s2


def main():
    lexemes = read_lexemes(LEXEMES)
    forms = read_forms(FORMS)

    # build reverse map from normalized label to lexeme ids (prefer exact)
    label_to_lex = {}
    for lid, info in lexemes.items():
        n = normalize_label(info['label'])
        label_to_lex.setdefault(n, []).append(lid)

    # parse XML
    tree = ET.parse(XML)
    root = tree.getroot()

    added_pp = 0
    added_gen = 0
    entries = root.findall('entry')
    for e in entries:
        lemma_el = e.find('lemma')
        if lemma_el is None:
            continue
        lemma_text = lemma_el.text or ''
        norm = normalize_label(lemma_text)

        candidates = label_to_lex.get(norm)
        if not candidates:
            # try matching by removing trailing digits from entry @n
            nattr = e.get('n', '')
            if nattr:
                if nattr.endswith(tuple('0123456789')):
                    norm2 = re.sub(r"\d+$", '', nattr).lower()
                    candidates = label_to_lex.get(norm2)
        if not candidates:
            continue
        lex_id = candidates[0]
        info = lexemes.get(lex_id)
        pos = info.get('pos')
        # fetch forms rows keyed by lexeme id used in forms.csv
        # note: nouns in forms.csv often have ids like noun-xxxx
        rows = forms.get(lex_id) or forms.get('noun-' + lex_id) or forms.get(lex_id)

        # verbs: add pp
        if pos == 'verb':
            pp_text = build_pp(lex_id, info['label'], rows)
            if pp_text and e.find('pp') is None:
                pp_el = ET.Element('pp')
                pp_el.text = pp_text
                # insert after gloss if present
                gloss = e.find('gloss')
                if gloss is not None:
                    # find index of gloss within e
                    children = list(e)
                    try:
                        idx = children.index(gloss)
                        e.insert(idx+1, pp_el)
                    except ValueError:
                        e.append(pp_el)
                else:
                    e.append(pp_el)
                added_pp += 1

        # nouns: add gen
        if pos == 'noun':
            gender = None
            # forms.csv noun ids often have prefix 'noun-'
            # try direct lookup and also 'noun-' prefixed
            noun_rows = rows or forms.get('noun-' + lex_id) or forms.get(lex_id)
            gender = detect_gender(noun_rows)
            if gender and e.find('gen') is None:
                gen_el = ET.Element('gen')
                gen_el.text = gender
                # append after pp if present, else after gloss
                pp = e.find('pp')
                gloss = e.find('gloss')
                if pp is not None:
                    children = list(e)
                    try:
                        idx = children.index(pp)
                        e.insert(idx+1, gen_el)
                    except ValueError:
                        e.append(gen_el)
                elif gloss is not None:
                    children = list(e)
                    try:
                        idx = children.index(gloss)
                        e.insert(idx+1, gen_el)
                    except ValueError:
                        e.append(gen_el)
                else:
                    e.append(gen_el)
                added_gen += 1

    # backup and write
    import shutil
    shutil.copyfile(XML, XML + '.bak')
    tree.write(XML, encoding='utf-8', xml_declaration=True)
    print(f'Added {added_pp} <pp> elements and {added_gen} <gen> elements to {XML} (backup at {XML}.bak)')


if __name__ == '__main__':
    main()
