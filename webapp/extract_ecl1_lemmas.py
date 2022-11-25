# import enum
import os
# from string import punctuation
import xml.etree.ElementTree as ET

script_dir = os.path.dirname(__file__)
xml_rel_path = "ecl1_lascivaroma2.xml"
txt_rel_path = "ecl1_lemmata.txt"
ecl1_xml_path = os.path.join(script_dir, xml_rel_path)

ecl1_xml = ""

with open(ecl1_xml_path) as fo1:
    tree = ET.parse(fo1)
    ecl1_xml = tree.getroot()

lemmata = {}

for word in ecl1_xml.findall('.//{http://www.tei-c.org/ns/1.0}w'):
    if word.attrib["lemma"] in lemmata:
        lemmata[word.attrib["lemma"]].append(word.attrib["n"])
    else:
        lemmata[word.attrib["lemma"]] = [word.attrib["n"]]

print(lemmata.items())
lemmata_list = [str((k, v)) for k, v in lemmata.items()]
lemmata_list.sort()

# # FOR SAVING A csv OF ALL WORDS

lemmata_csv_path = os.path.join(script_dir, "lemmata.csv")
g = open(lemmata_csv_path, "w")

lemmata_csv_txt = "\n".join(lemmata_list)

g.write(lemmata_csv_txt)
g.close()

print("Programme complete.")