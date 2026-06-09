# A script to get all unique MSD pairs from LR

import os
import xml.etree.ElementTree as ET

path = os.path.abspath(os.path.join(os.path.dirname(__file__),".."))
path += "/resources/eclogue1LR.xml"
print(path)

msdPairs = []
csv_text = ""

with open(path) as file:
    tree = ET.parse(file)
    root = tree.getroot()

    elements = root.findall(".//{http://www.tei-c.org/ns/1.0}w")

    for element in elements:
        rawMSD = element.get("msd")
        elementMSD = rawMSD.split("|")
        msdPairs.extend(elementMSD)

    msdPairs = list(dict.fromkeys(msdPairs))
    msdPairs.sort()
    print(len(msdPairs))
    print(msdPairs)