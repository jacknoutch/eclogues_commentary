# A script to get all the lemmas from LR

import os
import xml.etree.ElementTree as ET

path = os.path.abspath(os.path.join(os.path.dirname(__file__),".."))
path += "/resources/eclogue1LR.xml"
print(path)

words = []
csv_text = ""

with open(path) as file:
    tree = ET.parse(file)
    root = tree.getroot()

    elements = root.findall(".//{http://www.tei-c.org/ns/1.0}w")

    for element in elements:
        words.append(element.get("lemma"))

    print(len(words))    
    words = list(dict.fromkeys(words))
    words.sort()
    print(len(words))

    for word in words:
        csv_text += word + "\n"

    with open("/home/jacknoutch/ecl_commentary/resources/lemmas.csv", "w") as file2:

        file2.write(csv_text)