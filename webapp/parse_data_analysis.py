import os, pprint
import mysql.connector
import xml.etree.ElementTree as ET

script_dir = os.path.dirname(__file__)
xml_rel_path = "ecl1_lascivaroma2.xml"
ecl1_xml_path = os.path.join(script_dir, xml_rel_path)

msd_types = []

with open(ecl1_xml_path) as f1:
    tree = ET.parse(f1)
    root = tree.getroot()

for word in root.findall(".//{http://www.tei-c.org/ns/1.0}w"):
    msd_types.append(word.get("pos"))

msd_types = list(dict.fromkeys(msd_types))
msd_types.sort()

print(msd_types)

