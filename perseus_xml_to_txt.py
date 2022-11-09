import enum
import os
import xml.etree.ElementTree as ET
script_dir = os.path.dirname(__file__)
rel_path = "resources/ecl1_perseus.xml"
ecl1_path = os.path.join(script_dir, rel_path)

with open(ecl1_path) as fo:
    tree = ET.parse(fo)
    root = tree.getroot()
    print(root)

    ecl1_text = ""

    for x in root.iter("l"):
        # Most <l> elements have the text stored directly in them, but some are stored within child tags, such as <del>
        if x.text:
            ecl1_text += x.text + " "
            print(x.text)
        else:
            for y in x.getchildren():
                ecl1_text += y.text + " "
    
    new_path = os.path.join(script_dir, "resources/ecl1_perseus.txt")
    f = open(new_path, "w")
    f.write(ecl1_text)
    f.close()

print("Programme complete.")