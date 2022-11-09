import enum
import os
import xml.etree.ElementTree as ET

script_dir = os.path.dirname(__file__)
rel_path = "resources/ecl1_lascivaroma.xml"
ecl1_path = os.path.join(script_dir, rel_path)

with open(ecl1_path) as fo:
    tree = ET.parse(fo)
    root = tree.getroot()
    print(root)

    ecl1_html = ""

    for ab in root.iter("{http://www.tei-c.org/ns/1.0}ab"):
        line_num = ""
        words = []
        line_text = ""
        if ab.attrib["type"] == "line":
            line_num = ab.get("n")[45:]
            for word in ab:
                if word.attrib["pos"] == "PUNC":
                    line_text += word.text
                else:
                    line_text += " " + word.text
        ecl1_html += "<div class='l'>%s<p class='clickable'>%s </p></div>\n" % (line_num, line_text)
        print(ecl1_html)
        # if x.text:
        #     ecl1_html += x.text + " "
        #     print(x.text)
        # else:
        #     for y in x.getchildren():
        #         ecl1_html += y.text + " "
    
    new_path = os.path.join(script_dir, "resources/ecl1_lascivaroma.html")
    f = open(new_path, "w")
    f.write(ecl1_html)
    f.close()

print("Programme complete.")