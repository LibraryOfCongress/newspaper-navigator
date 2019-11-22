import json
import glob
import sys

with open('beyond_words_data/trainval.json') as json_file:
    data = json.load(json_file)

filenames = glob.glob('./beyond_words_data/images/*.jpg')

# total number of expected images in dataset
ct = len(data["images"])
print(ct)

train_filenames = []
train_indices = []
test_filenames = []
test_indices = []

for i in range(1, ct):
    if i < 3000:
        train_filenames.append(str(i) + ".jpg")
        train_indices.append(i)
    else:
        test_filenames.append(str(i) + ".jpg")
        test_indices.append(i)


train_images = []
for k in data["images"]:
    if k["file_name"] in train_filenames:
        train_images.append(k)

train_annotations = []
for k in data["annotations"]:
    if k["image_id"] in train_indices:
        train_annotations.append(k)

test_images = []
for k in data["images"]:
    if k["file_name"] in test_filenames:
        test_images.append(k)

test_annotations = []
for k in data["annotations"]:
    if k["image_id"] in test_indices:
        test_annotations.append(k)

data["images"] = train_images
data["annotations"] = train_annotations

print(len(train_images))
print(len(test_images))

# dumps json containing all annotation & image data in COCO format
with open('beyond_words_data/trainval_new.json', 'w') as f:
    json.dump(data, f)

data["images"] = test_images
data["annotations"] = test_annotations

# dumps json containing all annotation & image data in COCO format
with open('beyond_words_data/test_new.json', 'w') as f:
    json.dump(data, f)
