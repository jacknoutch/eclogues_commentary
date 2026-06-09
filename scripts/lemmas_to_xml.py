# A script to add all new lemmas to the glosses XML

import os, csv, xml
import xml.etree.ElementTree as ET

file_path = os.path.abspath(os.path.join(os.path.dirname(__file__),".."))
csv_path = file_path + "/resources/lemmas.csv"
xml_path = file_path + "/resources/glosses.xml"

words = []
csv_text = ""

with open(csv_path, newline="") as csv_file:
    reader = csv.reader(csv_file, delimiter=' ', quotechar='|')
    csv_rows = []
    for row in reader:
        csv_rows.append(row[0])

    with open(xml_path) as xml_file:
        tree = ET.parse(xml_file)
        root = tree.getroot()

        entries = root.findall(".//entry")
        
        for entry in entries:
            if entry.get("n") in csv_rows:
                csv_rows.remove(entry.get("n"))
        
        for row in csv_rows:
            new_entry = ET.Element("entry")
            new_entry.set("n", row)
            new_lemma = ET.SubElement(new_entry,"lemma")
            new_lemma.text = row
            print(new_lemma.text)

            root.append(new_entry)

        tree.write('output.xml')