import xml.etree.ElementTree as ET
import sys
import glob
import json
from PIL import Image, ImageDraw

# given a file path and a list of bounding boxes, this function traverses the XML
# and returns the OCR within each bounding box
def retrieve_ocr(filepath, bounding_boxes, predicted_classes, true_img_filepath, fullview_filepath):

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

    # gets page height and page width in inch1200 units
    page_height_inch = int(page.attrib['HEIGHT'])
    page_width_inch = int(page.attrib['WIDTH'])

    # opens the actual page
    im = Image.open(true_img_filepath)
    im = im.convert(mode='RGB')
    draw  = ImageDraw.Draw(im)

    # sets page height and width in pixel units
    page_width_pix, page_height_pix = im.size

    # sets conversion between pixels per inch
    CONVERSION = float(page_height_pix)/float(page_height_inch)

    # we then iterate over each text box and find each text line
    for text_box in text_boxes:

        # finds all of the text lines (atomic text units) within the text box
        text_lines = text_box.findall(prefix + 'TextLine')

        # we then iterate over the text lines in each box
        for text_line in text_lines:

            strings = text_line.findall(prefix + 'String')

            # we now iterate over every string in each line (each string is separated by whitespace)
            for string in strings:

                w1 = int(string.attrib["HPOS"])
                h1 = int(string.attrib["VPOS"])
                w2 = w1 + int(string.attrib["WIDTH"])
                h2 = h1 + int(string.attrib["HEIGHT"])

                area = ((w1*CONVERSION, h1*CONVERSION), (w2*CONVERSION, h2*CONVERSION))
                draw.rectangle(area, fill="#A9A9A9", outline="black")

                # we now iterate over each bounding box and find whether the string lies within the box
                for i in range(0, len(bounding_boxes)):

                    bounding_box = bounding_boxes[i]
                    predicted_class = predicted_classes[i]

                    name = ''
                    color = ''
                    if predicted_class == 0:
                        name = 'Photograph'
                        color = 'cyan'
                    elif predicted_class == 1:
                        name = 'Illustration'
                        color = 'green'
                    elif predicted_class == 2:
                        name = 'Map'
                        color = 'magenta'
                    elif predicted_class == 3:
                        name = 'Comics/Cartoon'
                        color = 'purple'
                    elif predicted_class == 4:
                        name = 'Editorial Cartoon'
                        color = 'brown'

                    # here, we can draw the bounding box if we'd like
                    draw.rectangle(bounding_box, outline=color, fill=None, width=14)

                    draw.text((bounding_box[0], bounding_box[1]), "   " + name, fill='black')


                    # checks if the text appears within the bounding box
                    if w1*CONVERSION > bounding_box[0]:
                        # if w2*CONVERSION < bounding_box[0] + bounding_box[2]:
                        if w2*CONVERSION < bounding_box[2]:
                            if h1*CONVERSION > bounding_box[1]:
                                # if h2*CONVERSION < bounding_box[1] + bounding_box[3]:
                                if h2*CONVERSION < bounding_box[3]:

                                    # appends text content to list
                                    ocr[i].append(string.attrib["CONTENT"])

                                    # if drawing on image, we can selectively only draw on cropped OCR
                                    area = ((w1*CONVERSION, h1*CONVERSION), (w2*CONVERSION, h2*CONVERSION))
                                    draw.rectangle(area, fill="orange", outline="black")

    im.save(fullview_filepath)

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

    # we now find the XML and JPG files corresponding to this predictions JSON
    stem = original_img_filepath[original_img_filepath.find('FullPages'):-4]
    xml_filepath = '../chronam-get-images/data/' + stem + '.xml'
    jpg_filepath = '../chronam-get-images/data/' + stem + '.jpg'

    # we also now construct destination filepaths
    cropped_filepath = 'tests/predictions/with_ocr/' + jpg_filepath.split('data')[1].replace('/', '_')[:-4]

    # saves full image in directory for reference
    im = Image.open(jpg_filepath)
    im.save(cropped_filepath + "_full.jpg")

    # crops out the predicted bounding boxes
    # here, we don't need to worry about upsampling because we are usign the downsampled image
    for i in range(0, len(boxes)):

        box = boxes[i]

        # use PIL Image crop here
        im = Image.open(jpg_filepath)
        im = im.crop( (box[0], box[1], box[2], box[3]) )
        im.save(cropped_filepath + "_predicted_" + str(i) + ".jpg")

    # stores list of OCR
    ocr = []

    # we only try to retrieve the OCR if there is one or more predicted box
    if n_pred > 0:
        ocr = retrieve_ocr(xml_filepath, boxes, classes, jpg_filepath, cropped_filepath + "_fulLview_" + str(i) + ".jpg")

    predictions['ocr'] = ocr

    # we save the updated JSON
    with open(cropped_filepath + '_predictions.json', 'w') as f:
        json.dump(predictions, f)
