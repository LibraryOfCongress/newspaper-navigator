import xml.etree.ElementTree as ET
import sys

# sets tag prefix (everywhere)
prefix = "{http://www.loc.gov/standards/alto/ns-v2#}"

# sets tree and root
tree = ET.parse('tests/test.xml')
root = tree.getroot()

# traverses to layout and then the page and then the print space
layout = root.find(prefix + 'Layout')
page = layout.find(prefix + 'Page')
print_space = page.find(prefix + 'PrintSpace')

# finds all of the text boxes on the page
text_boxes = print_space.findall(prefix + 'TextBlock')

# we then iterate over each text box and find each text line
for text_box in text_boxes:

    # finds all of the text lines (atomic text units) within the text box
    text_lines = text_box.findall(prefix + 'TextLine')

    # we then iterate over the text lines in each box
    for text_line in text_lines:
        print(text_line.attrib)
