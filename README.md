# Re-imagining *Beyond Words* with Deep Learning

## By Benjamin Charles Germain Lee (LOC Innovator-in-Residence, 2020)


## Introduction

This code base explores using the <a href="http://beyondwords.labs.loc.gov/#/">*Beyond Words*</a> crowdsourced annotations of photographs, illustrations, comics, cartoons, and maps from <a href="https://chroniclingamerica.loc.gov/">*Chronicling America*</a> to finetune a pre-trained object detection model to detect visual content in historical newspaper scans. This finetuned model can then be used as the first step in a pipeline for automating the extraction of visual content from *Chronicling America*, as well as captions and corresponding textual content from the METZ/ALTO OCR of each *Chronicling America* page.


## Dataset

The *Beyond Words* dataset for photograph, illustration, comic, cartoon, and map detection in historical newspaper scans, is formatted according to the <a href="http://cocodataset.org/#format-data">COCO</a> standard for object detection and can be found in <a href="https://github.com/bcglee/beyond_words/tree/master/beyond_words_data">/beyond_words_data/</a>. The images are stored in <a href="https://github.com/bcglee/beyond_words/tree/master/beyond_words_data/images">/beyond_words_data/images/</a>, and the JSON can be found in <a href="https://github.com/bcglee/beyond_words/blob/master/beyond_words_data/trainval.json">/beyond_words_data/trainval.json</a>.   The dataset contains 3,437 images with 6,732 verified annotations.  Here is a breakdown of categories:

* Photographs: 4,193
* Illustrations: 1,028
* Maps: 79
* Comics/Cartoons: 1,139
* Editorial Cartoons: 293


For an 80\%-20\% split, see <a href="https://github.com/bcglee/beyond_words/blob/master/beyond_words_data/trainval_80_percent.json">/beyond_words_data/trainval_80_percent.json</a> and <a href="https://github.com/bcglee/beyond_words/blob/master/beyond_words_data/test_80_percent.json">/beyond_words_data/test_80_percent.json</a>.  Lastly, the original annotations from the *Beyond Words* site can be found at <a href="https://github.com/bcglee/beyond_words/blob/master/beyond_words_data/beyond_words.txt">/beyond_words_data/beyond_words.txt</a>.

To construct the dataset using updated annotations, first update the annotations file, then run the script <a href="https://github.com/bcglee/beyond_words/blob/master/process_beyond_words_images_COCO.py">process_beyond_words_images_COCO.py</a>.  This file also contains some commented-out, vestigial code for creating pixel masks to work with the <a href="https://dhsegment.readthedocs.io/en/latest/start/demo.html">dhSegment</a> format.

<!---
The script "\_" uses the verified Beyond Words JSON file to download the newspaper scans and construct a dataset for photograph, illustration, comic, cartoon, and map detection in historical newspaper scans.  The dataset is formatted according to the <a href="http://cocodataset.org/#format-data">COCO</a> format (there is also some commented-out, vestigial code for creating pixel masks to work with the <a href="https://dhsegment.readthedocs.io/en/latest/start/demo.html">dhSegment</a> format).  The dataset can be found here (*describe*).
-->

## Detecting and Extracting Visual Content from Historic Newspaper Scans

The notebook "\_" finetunes different pre-trained Faster-RCNN implementations from <a href="https://github.com/facebookresearch/detectron2">Detectron2</a>'s <a href="https://github.com/facebookresearch/detectron2/blob/master/MODEL_ZOO.md">Model Zoo</a>.

## Extracting Captions and Textual Content using METZ/ALTO OCR

The script "\_" extracts textual content within each predicted bounding box from the METZ/ALTO OCR XML file for each *Chronicling America* page.

## Visualizing a Day in Newspaper History

The script "\_" uses embeddings and T-SNE to ...


(This README will be updated as new commits are added).
