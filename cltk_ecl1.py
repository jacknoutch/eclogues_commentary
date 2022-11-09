import enum
import os
from string import punctuation
import xml.etree.ElementTree as ET
script_dir = os.path.dirname(__file__)
xml_rel_path = "resources/ecl1_perseus.xml"
txt_rel_path = "resources/ecl1_perseus.txt"
ecl1_xml_path = os.path.join(script_dir, xml_rel_path)
ecl1_txt_path = os.path.join(script_dir, txt_rel_path)

ecl1_xml = ""
ecl1_txt = ""

with open(ecl1_xml_path) as fo1:
    tree = ET.parse(fo1)
    ecl1_xml = tree.getroot()

with open(ecl1_txt_path) as fo2:
    ecl1_txt = fo2.read()
    ecl1_txt = ecl1_txt.lower() # Text must be lowercase for parsing

# CLTK STUFF STARTS HERE

from cltk import NLP
cltk_nlp = NLP(language="lat")
# Removing ``LatinLexiconProcess`` b/c it is slow and currently unnecessary
cltk_nlp.pipeline.processes.pop(-1)
cltk_doc = cltk_nlp.analyze(text=ecl1_txt)

filtered_tokens = cltk_doc.tokens_stops_filtered # For stops, see Notion page https://www.notion.so/demodocus/Run-CLTK-on-text-0f2b6b4a71f7489c866e277f169eeabe.
pos = cltk_doc.pos
lemmata = cltk_doc.lemmata
unique_lemmata = list(dict.fromkeys(lemmata))
unique_lemmata = [x for x in unique_lemmata if x not in punctuation]

# FOR SAVING A txt OF UNIQUE LEMMATA

# new_path = os.path.join(script_dir, "resources/unique_lemmata.txt")
# f = open(new_path, "w")
# lemmata_text = "\n".join(unique_lemmata)
# f.write(lemmata_text)
# f.close()

# FOR SAVING A csv OF ALL WORDS

words_csv_path = os.path.join(script_dir, "resources/words.csv")
g = open(words_csv_path, "w")
words_csv_txt = ""
for word in cltk_doc.words:
    word_details = ";".join([str(word.index_sentence) + "." + str(word.index_token), word.string, word.lemma, str(word.pos)])
    words_csv_txt += word_details + "\n"
g.write(words_csv_txt)
g.close()

print("Programme complete.")