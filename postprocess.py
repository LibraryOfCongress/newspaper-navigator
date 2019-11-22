import json
import glob
import sys

with open('beyond_words_data/trainval.json') as json_file:
    data = json.load(json_file)

filenames = glob.glob('./beyond_words_data/images/*.jpg')

# total number of expected images in dataset
ct = len(data["images"])
print(ct)

stale_filenames = []
stale_indices = []

for i in range(1, ct):
    if ("./beyond_words_data/images/" + str(i) + ".jpg") not in filenames:
        stale_filenames.append(str(i) + ".jpg")
        print(i)
        stale_indices.append(i)

updated_images = []
for k in data["images"]:
    if k["file_name"] in stale_filenames:
        continue
    else:
        updated_images.append(k)

updated_annotations = []
for k in data["annotations"]:
    if k["image_id"] in stale_indices:
        continue
    else:
        updated_annotations.append(k)

data["images"] = updated_images
data["annotations"] = updated_annotations

# dumps json containing all annotation & image data in COCO format
with open('beyond_words_data/trainval_corrected.json', 'w') as f:
    json.dump(data, f)
