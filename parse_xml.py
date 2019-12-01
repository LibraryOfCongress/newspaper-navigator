import xml.etree.ElementTree as ET
import sys
import glob
import json
from PIL import Image

# constant used to downsample the ChronAm images; we need to upsample for coordinates here
UPSAMPLE = 6

# given a file path and a list of bounding boxes, this function traverses the XML
# and returns the OCR within each bounding box
def retrieve_ocr(filepath, bounding_boxes):

    # creates empty nested list fo storing OCR in each box
    ocr = [ [] for i in range(len(bounding_boxes)) ]

    # sets tag prefix (everywhere)
    prefix = "{http://www.loc.gov/standards/alto/ns-v2#}"

    # sets tree and root based on filepath
    tree = ET.parse(filepath) # ET.parse('tests/test.xml')
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

            strings = text_line.findall(prefix + 'String')

            # we now iterate over every string in each line (each string is separated by whitespace)
            for string in strings:

                h1 = int(string.attrib["HPOS"])
                w1 = int(string.attrib["VPOS"])
                h2 = h1 + int(string.attrib["HEIGHT"])
                w2 = w1 + int(string.attrib["WIDTH"])

                # we now iterate over each bounding box and find whether the string lies within the box
                for i in range(0, len(bounding_boxes)):

                    bounding_box = bounding_boxes[i]

                    if h1 > bounding_box[0]*UPSAMPLE:
                        if h2 < (bounding_box[0] + bounding_box[2])*UPSAMPLE:
                            if w1 > bounding_box[1]*UPSAMPLE:
                                if w2 < (bounding_box[1] + bounding_box[3])*UPSAMPLE:

                                    ocr[i].append(string.attrib["CONTENT"])

    return ocr

# first, we grab all of the predicted bounding boxes and xml
json_filepaths = glob.glob('./tests/predictions/*.json')

# xml_filepaths = glob.glob('../chronam-get-images/data/**/*.xml', recursive=True)
# img_filepaths = glob.glob('../chronam-get-images/data/**/*.xml', recursive=True)

# we now iterate through all of the predictions JSON files
for json_file in json_filepaths:

    # we load the JSON
    with open(json_file) as f:
        predictions = json.load(f)

    # pulls off relevant data fields from the JSON
    original_img_filepath = predictions['file_name']
    boxes = predictions['boxes']
    scores = predictions['scores']
    classes = predictions['pred_classes']

    # sets the number of predicted bounding boxes
    n_pred = len(scores)

    # we now find the XML file corresponding to this file
    stem = original_img_filepath[original_img_filepath.find('FullPages'):-4]
    xml_filepath = '../chronam-get-images/data/' + stem + '.xml'
    jpg_filepath = '../chronam-get-images/data/' + stem + '.jpg'

    # crops out the predicted bounding boxes
    # here, we don't need to worry about upsampling because we are usign the downsampled image
    for i in range(0, len(boxes)):

        box = boxes[i]

        # use PIL Image crop here
        im = Image.open(jpg_filepath)
        im = im.crop( (box[0], box[1], box[2], box[3]) )
        im.save(jpg_filepath[:-4] + "_predicted_" + str(i) + ".jpg")


    # stores list of OCR
    ocr = []

    # we only try to retrieve the OCR if there is one or more predicted box
    if n_pred > 0:
        ocr = retrieve_ocr(xml_filepath, boxes)

    predictions['ocr'] = ocr

    # we save the updated JSON
    with open(xml_filepath[:-4] + '.json') as f:
        predictions = json.load(f)


    sys.exit()
