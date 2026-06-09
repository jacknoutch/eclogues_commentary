# A script to remove the gumph around the headwords in the latin-core-list

import os
import xml.etree.ElementTree as ET

path = os.path.abspath(os.path.join(os.path.dirname(__file__),".."))
path += "/resources/latin-core-list.xml"
print(path)

with open(path) as file:
    tree = ET.parse(file)
    root = tree.getroot()

    elements = root.findall(".//display_headwords")

    for element in elements:
        element.text = element.text.strip()
        start = element.text.find(">")
        end = element.text.find("<",1)
        element.text = element.text[start+1:end]

    with open("/home/jacknoutch/ecl_commentary/resources/latin-core-list2.xml", "w") as file2:
        xml_text = ET.tostring(root, encoding='unicode', method='xml')

        file2.write(xml_text)