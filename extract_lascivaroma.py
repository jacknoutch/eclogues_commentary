import os, pprint
import mysql.connector
import xml.etree.ElementTree as ET

script_dir = os.path.dirname(__file__)
xml_rel_path = "resources/ecl1_lascivaroma.xml"
ecl1_xml_path = os.path.join(script_dir, xml_rel_path)

with open(ecl1_xml_path) as f1:
    tree = ET.parse(f1)
    root = tree.getroot()

words = []
w_dict = []

class Word:
    def __init__(self, position, pos, msd, lemma, wordform) -> None:
        self.n = position
        self.pos = pos
        self.msd = msd
        self.lemma = lemma
        self.wordform = wordform

    def __str__(self):
        return f"{self.wordform}, {self.n}"

for word in root.findall(".//*[@n='urn:cts:latinLit:phi0690.phi001.perseus-lat2:1']//{http://www.tei-c.org/ns/1.0}w"):
    w = word.items()
    new_word = Word(w[1][1],w[2][1],w[3][1],w[4][1],word.text)
    words.append(new_word)

lemmata = []

for word in words:
    if word.lemma not in lemmata:
        lemmata.append(word.lemma)

print(lemmata)
print(len(lemmata))

for i, lemma in enumerate(lemmata):
    lemmata[i] = (lemma,)

mydb = mysql.connector.connect(
    host = "localhost",
    user = "root",
    password = "44BCettubrute!",
    database= "lexicon"
)

mycursor = mydb.cursor()

sql = "INSERT INTO lemmata (lemma) VALUES (%s)"
mycursor.executemany(sql,lemmata)

mydb.commit()

print(mycursor.rowcount, "record/s inserted. ID: ", mycursor.lastrowid)
