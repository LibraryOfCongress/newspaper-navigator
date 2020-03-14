# *Newspaper Navigator*

## By Benjamin Charles Germain Lee (2020 Library of Congress Innovator-in-Residence)

## Introduction

The goal of *Newspaper Navigator* is to re-imagine searching over [*Chronicling America*](https://chroniclingamerica.loc.gov/about/). The first stage of *Newspaper Navigator* is to extract content such as photographs, illustrations, cartoons, and news topics from the Chronicling America newspaper scans and corresponding OCR using emerging machine learning techniques. The second stage is to reimagine an exploratory search interface over the collection in order to enable new ways for the American public to navigate the collection.

**This project is currently under development, and updates to the documentation will be made as the project unfolds throughout the year.**


## What's Implemented So Far
This code base explores using the [*Beyond Words*](http://beyondwords.labs.loc.gov/#/) crowdsourced annotations of photographs, illustrations, comics, cartoons, and maps from [*Chronicling America*](https://chroniclingamerica.loc.gov/about/) to finetune a pre-trained object detection model to detect visual content in historical newspaper scans. This finetuned model is incorporated into a pipeline for extracting content from millions of newspaper pages in the *Chronicling America*.  This includes not only visual content but also captions and corresponding textual content from the METS/ALTO OCR of each *Chronicling America* page. This code base also contains a script for visualizing the extracted photographs, illustrations, comics, cartoons, and maps from *Chronicling America* using ResNet-18 embeddings and T-SNE.

## Whitepaper

If you'd like to read about this work in depth, you can find a whitepaper describing the progress made so far in [whitepaper](https://github.com/bcglee/beyond_words/tree/master/whitepaper). The paper contains a more detailed description of the code, benchmarks, and related work (*as with the rest of this repo, the paper is still a work-in-progress and will be updated regularly*).

## Training Dataset for Visual Content Recognition in Historic Newspapers

The [*Beyond Words*](http://beyondwords.labs.loc.gov/#/) dataset consists of crowdsourced locations of
photographs, illustrations, comics, cartoons, and maps in World War I era newspapers, as well as corresponding textual content (titles, captions, artists, etc.). In order to utilize this dataset for visual content detection in historical newspaper scans,  a copy of the dataset can be found in this repo (in [beyond_words_data](https://github.com/bcglee/beyond_words/tree/master/beyond_words_data)) formatted according to the [COCO](http://cocodataset.org/#format-data) standard for object detection. The images are stored in [/beyond_words_data/images/](https://github.com/bcglee/beyond_words/tree/master/beyond_words_data/images), and the JSON can be found in [/beyond_words_data/trainval.json](https://github.com/bcglee/beyond_words/blob/master/beyond_words_data/trainval.json).

The dataset contains 3,437 images with 6,732 verified annotations, as of 12/01/2019.  Here is a breakdown of categories:

* Photographs: 4,193
* Illustrations: 1,028
* Maps: 79
* Comics/Cartoons: 1,139
* Editorial Cartoons: 293

In addition, annotations of headlines and advertisements were added to the dataset. These annotations were all done by one person (myself) and thus are unverified.  The breakdown is as follows:

* Headlines: 21,692
* Advertisements: 10,732

If you would like to use only the verified *Beyond Words* data, just disregard the annotations with the labels "Headline" and "Advertisement" when processing.

For an 80\%-20\% split of the dataset, see [/beyond_words_data/train_80_percent.json](https://github.com/bcglee/beyond_words/blob/master/beyond_words_data/train_80_percent.json) and [/beyond_words_data/val_20_percent.json](https://github.com/bcglee/beyond_words/blob/master/beyond_words_data/val_20_percent.json).  Lastly, the original verified annotations from the *Beyond Words* site can be found at [beyond_words_data/beyond_words.txt](https://github.com/bcglee/beyond_words/blob/master/beyond_words_data/beyond_words.txt).

To construct the dataset using updated annotations, first update the annotations file from the Beyond Words website, then run the script [process_beyond_words_images_COCO.py](https://github.com/bcglee/beyond_words/blob/master/process_beyond_words_images_COCO.py).  To split perform a train-test split, run [test_train_split.py](https://github.com/bcglee/beyond_words/blob/master/test_train_split.py) with the training fraction specified within the script.

## Detecting and Extracting Visual Content from Historic Newspaper Scans

With this dataset fully constructed, it is possilbe to train a deep learning model to identify visual content and classify it according to the *Beyond Words* taxonomy (photograph, illustration, comics/cartoon, editorial cartoon, and map).  The approach that I've taken is to finetune a pre-trained Faster-RCNN impelementation in [Detectron2's](https://github.com/facebookresearch/detectron2) [Model Zoo](https://github.com/facebookresearch/detectron2/blob/master/MODEL_ZOO.md) in PyTorch.  

I have included scripts and notebooks designed to run out-of-the-box on an *AWS EC2 instance* with a *Deep Learning Ubuntu AMI*. Here are the steps to get running on any deep learning environment with Python 3, PyTorch, and the standard scientific computing packages shipped with Anaconda.

1. Clone this repo.
2. Next, run [install_detectron_2.sh](https://github.com/bcglee/beyond_words/blob/master/install-scripts/install_detectron_2.sh) in order to install Detectron2, as well as all of its dependencies (including [img2vec](https://github.com/christiansafka/img2vec)). Due to some deprecated code in pycocotools, it is worth changing "unicode" to "bytes" in line 308 of `~/anaconda3/lib/python3.6/site-packages/pycocotools/coco.py` in order to enable the test evaluation in Detectron2 to work correctly. If the above installation package fails, I recommend following the steps on the [Detectron2 repo](https://github.com/facebookresearch/detectron2/blob/master/INSTALL.md) for installation.
3. Next, run the command `jupyter notebook` and navigate to the notebook [train_model.ipynb](https://github.com/bcglee/beyond_words/blob/master/notebooks/train_model.ipynb), which contains code for finetuning Faster-RCNN implementations from [Detectron2's](https://github.com/facebookresearch/detectron2) [Model Zoo](https://github.com/facebookresearch/detectron2/blob/master/MODEL_ZOO.md). If everything is installed correctly, the notebook should run without any additional steps.

Included in this repo are the model weights for a finetuned Faster-RCNN implementation (the R50-FPN backbone from Detectron2's Model Zoo). The model weights are used in the full pipeline for the construction of the Newspaper Navigator dataset. The R50-FPN backbone was selected because it has the fastest inference times of the Faster-RCNN backbones, and inference time is the bottleneck in the pipeline (approximately 0.1 seconds per image per NVIDIA T4 GPU).  Though the X101-FPN backbone reports a slightly higher box average precision (43 \% vs. 37.9 \%), inference time is approximately 2.5 times slower, which would drastically increase the pipeline runtime.

Here are performance metrics on finetuning the Faster-RCNN R50-FPN backbone from Detectron2's Model Zoo (all training was done on an AWS g4dn.2xlarge instance with a single NVIDIA T4 GPU):

| Category | Average Precision |
| ----- | ----------------- |
| Combined | \% |
| Headline | \% |
| Photograph | \% |
| Illustration | \% |
| Map | \% |
| Comic/Cartoon | \% |
| Editorial Cartoon | \% |
| Headline | \% |
| Advertisement | \% |

For a slideshow showing the performance of faster\_rcnn\_R\_50\_FPN\_3x on 50 sample pages from the *Beyond Words* test set, please see [slideshow.mp4](https://github.com/bcglee/beyond_words/blob/master/demos/slideshow.mp4).

*Note*: you can use the model weights to run inference over your own dataset of historic newspapers!  To do so, you can import the model weights in PyTorch, as well as set the following commands:

-  `cfg = get_cfg()``
-  `cfg.merge_from_file("/detectron2/configs/COCO-Detection/faster_rcnn_R_50_FPN_3x.yaml")` #note that you may need to change the filepath to navigate to detectron2 correctly
-  `cfg.MODEL.ROI_HEADS.NUM_CLASSES = 7`

To see more on how to run inference, take a look at the pipeline code.

## Extracting Captions and Textual Content using METS/ALTO OCR

Now that we have a finetuned model for extracting visual content from newspaper scans in *Chronicling America*, we can leverage the OCR of each scan to weakly supervise captions and corresponding textual content. Because *Beyond Words* volunteers were instructed to draw bounding boxes over corresponding textual content, the finetuned model has learned how to do this as well.  Thus, it is possible to utilize the predicted bounding boxes in JSON format to extract textual content within each predicted bounding box from the METS/ALTO OCR XML file for each *Chronicling America* page. Note that this is precisely what happens in *Beyond Words* during the "Transcribe" step, where volunteers correct the OCR within each bounding box.

## A Pipeline for Running at Scale

Currently under development is the notebook [process_chronam_pages.ipynb](https://github.com/bcglee/beyond_words/blob/master/notebooks/process_chronam_pages.ipynb), with the goal of being able to run the visual content recognition and caption extraction over millions of *Chronicling America* pages. This code relies on the repo [chronam-get-images](https://github.com/bcglee/chronam-get-images) to produce a manifest of Chronicling America files. These manifest files can be found in this repo; they serve as a convenient way of navigating the Newspaper Navigator dataset stored in an S3 bucket (coming soon...).

This notebook then uses this manifest to:

1. iterate over images in *Chronicling America*
2. perform inference on the images using the finetuned visual content detection model
3. crop and save the visual content (minus headlines)
4. extract textual content within the predicted bounding boxes using the METS/ALTO XML files containing the OCR for each page
5. generate embeddings for each cropped image using [img2vec](https://github.com/christiansafka/img2vec) for fast similarity computations
6. save the results for each page as a JSON file in a file tree that mirrors the *Chronicling America* file tree.  If you navigate to *link to be added*, you will find a .zip file corresponding to each folder at:  https://chroniclingamerica.loc.gov/data/batches/ (each folder contains the data for a digitized newspaper batch, described [here](https://chroniclingamerica.loc.gov/batches/)).  If you unzip the file, you will find a JSON file corresponding to each page in the full batch.  The JSON file contains the following keys:

* `filepath [str]`: the path to the image, assuming a starting point of https://chroniclingamerica.loc.gov/batches/
* `pub_date [str]`: the publication date of the page, in the format `YYYY-MM-DD`
* `boxes [list:list]`: a list containing the coordinates of predicted boxes in YOLO format
* `scores [list:float]`: a list containing the confidence score associated with each box
* `pred_classes [list:int]`: a list containing the predicted class for each box; the classes are:
  1. Photograph
  2. Illustration
  3. Map
  4. Comics/Cartoon
  5. Editorial Cartoon
  6. Headline
  7. Advertisement
* `ocr [list:str]`: a list containing the OCR within each box
* `embeddings [list:list]`: a list containing the embedding for each image (except headlines, for which embeddings aren't generated)
* `img_filepaths [list:str]`: a list containing the filepath for each cropped image (except headlines, which were not cropped and saved)

*Once this code is finalized, this section will be updated, and the resulting dataset will be released.*

## Visualizing a Day in Newspaper History

Using the [chronam-get-images repo](https://github.com/bcglee/chronam-get-images), we can pull down all of the *Chronicling America* content for a specific day in history (or, a larger date range if you're interested - the world is your oyster!).  Running the above scripts, it's possible to go from a set of scans and OCR XML files to extracted visual content. How do we then visualize this content?

One answer is to use image embeddings and T-SNE to cluster the images in 2D.  To accomplish this, I've used [img2vec](https://github.com/christiansafka/img2vec). Here, I've chosen to use the 512-dimensional embeddings from ResNet-18 produced by feeding in an image and grabbing the weights in the last hidden layer.  Using sklearn's implementation of T-SNE, it's easy to perform dimensionality reduction down to 2D, perfect for a visualization. We can then visualize a day in history!

For a sample visualization of June 7th, 1944 (the day after D-Day), please see [visualizing_6_7_1944.png](https://github.com/bcglee/beyond_words/blob/master/demos/visualizing_6_7_1944.png) (*NOTE: the image is 20 MB, enabling high resolution of images even when zooming in*).  If you search around in this visualization, you will find clusters of maps showing the Western Front, photographs of military action, and photographs of people.  Currently, the aspect ratio of the extracted visual content is not preserved, but this is to be added in future iterations.

The script [generate_visualization.py](https://github.com/bcglee/beyond_words/blob/master/generate_visualization.py) contains my code for generating the sample visualization, though it is not currently in a state of supporting out-of-the-box functionality.

(*This README will be updated as new commits are added*).
