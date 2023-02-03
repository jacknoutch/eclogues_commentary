# A script to get all the lines from Perseus and write it as a text file

import os
import xml.etree.ElementTree as ET

path = os.path.abspath(os.path.join(os.path.dirname(__file__),".."))
path += "/resources/eclogues_perseus.xml"
print(path)

lines = []
text_file = ""

with open(path) as file:
    tree = ET.parse(file)
    root = tree.getroot()

    line_elements = root.findall(".//l")
    for element in line_elements:
        lines.append("<div class='l clickable' n='%s'>%s</div>" % (str(len(lines)+1), element.text))

    for line in lines:
        text_file += line + "\n"

    with open("/home/jacknoutch/ecl_commentary/resources/lines.txt", "w") as file2:

        file2.write(str(text_file))