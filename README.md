# *Newspaper Navigator*

## By Benjamin Charles Germain Lee (2020 Library of Congress Innovator-in-Residence)

## Introduction

The goal of *Newspaper Navigator* is to re-imagine searching over [*Chronicling America*](https://chroniclingamerica.loc.gov/about/). The project consists of two stages:
- Creating the *Newspaper Navigator* dataset by extracting headlines, photographs, illustrations, maps, comics, cartoons, and advertisements from millions of Chronicling America pages using emerging machine learning techniques.  In addition to the visual content, the dataset will include captions and other relevant text derived from the METS/ALTO OCR, as well as image embeddings for fast similarity querying. The dataset will be released shortly.
- Reimagining an exploratory search interface over the collection in order to enable new ways for the American public to navigate the collection.

**This project is currently under development, and updates to the documentation will be made as the project unfolds throughout the year.**


## What's Implemented So Far
This code base explores using the [*Beyond Words*](http://beyondwords.labs.loc.gov/#/) crowdsourced bounding box annotations of photographs, illustrations, comics, cartoons, and maps, as well as additional annotations of headlines and advertisements, to finetune a pre-trained object detection model to detect visual content in historical newspaper scans. This finetuned model is incorporated into a pipeline for extracting content from millions of newspaper pages in the *Chronicling America*.  This includes not only visual content but also captions and corresponding textual content from the METS/ALTO OCR of each *Chronicling America* page. In addition, the pipeline produces image embeddings for fast similarity querying over the extracted visual content.  Here is a diagram of the pipeline workflow:

![Alt text](demos/pipeline.png?raw=true "Title")

## Whitepaper

If you'd like to read about this work in depth, you can find a whitepaper describing the progress made so far in [whitepaper](https://github.com/LibraryOfCongress/newspaper-navigator/tree/master/whitepaper). The paper contains a more detailed description of the code, benchmarks, and related work (*this whitepaper will be updated within soon, when the Newspaper Navigator dataset is released*).

## Training Dataset for Visual Content Recognition in Historic Newspapers

The [*Beyond Words*](http://beyondwords.labs.loc.gov/#/) dataset consists of crowdsourced locations of
photographs, illustrations, comics, cartoons, and maps in World War I era newspapers, as well as corresponding textual content (titles, captions, artists, etc.). In order to utilize this dataset to train a visual content recognition model for historical newspaper scans, a copy of the dataset can be found in this repo (in [/beyond_words_data/](https://github.com/LibraryOfCongress/newspaper-navigator/tree/master/beyond_words_data)) formatted according to the [COCO](http://cocodataset.org/#format-data) standard for object detection. The images are stored in [/beyond_words_data/images/](https://github.com/LibraryOfCongress/newspaper-navigator/tree/master/beyond_words_data/images), and the JSON can be found in [/beyond_words_data/trainval.json](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/beyond_words_data/trainval.json). The JSON also includes annotations of headlines and advertisements. These annotations were all done by one person (myself) and thus are unverified. The breakdown is as follows:

The dataset contains 3,437 images with 6,732 verified annotations (downloaded from the *Beyond Words* site on 12/01/2019), plus an additional 32,424 unverified annotations.  Here is a breakdown of categories:

| Category | # in Full Dataset |
| ----- | ----------------- |
| Photograph | 4,193 |
| Illustration | 1,028 |
| Map | 79 |
| Comics/Cartoon | 1,139 |
| Editorial Cartoon | 293 |
| Headline | 21,692 |
| Advertisement | 10,732 |

If you would like to use only the verified *Beyond Words* data, just disregard the annotations with the labels "Headline" and "Advertisement" when processing.

For an 80\%-20\% split of the dataset, see [/beyond_words_data/train_80_percent.json](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/beyond_words_data/train_80_percent.json) and [/beyond_words_data/val_20_percent.json](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/beyond_words_data/val_20_percent.json).  Lastly, the original verified annotations from the *Beyond Words* site can be found at [beyond_words_data/beyond_words.txt](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/beyond_words_data/beyond_words.txt).

To construct the dataset using the *Beyond Words* annotations added since 12/01/2019, first update the annotations file from the Beyond Words website, then run the script [process_beyond_words_dataset.py](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/process_beyond_words_dataset.py).  To add the additional headline and advertisement annotations, you can retrieve them from [/beyond_words_data/trainval.json](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/beyond_words_data/trainval.json) and add them to your dataset.

## Detecting and Extracting Visual Content from Historic Newspaper Scans

With this dataset fully constructed, it is possible to train a deep learning model to identify visual content and classify the content according to 7 classes (photograph, illustration, map, comic, editorial cartoon, headline, advertisement).  The approach utilized here is to finetune a pre-trained Faster-RCNN impelementation in [Detectron2's](https://github.com/facebookresearch/detectron2) [Model Zoo](https://github.com/facebookresearch/detectron2/blob/master/MODEL_ZOO.md) in PyTorch.  

I have included scripts and notebooks designed to run out-of-the-box on most deep learning environments (tested on an *AWS EC2 instance* with a *Deep Learning Ubuntu AMI*). Below are the steps to get running on any deep learning environment with Python 3, PyTorch, and the standard scientific computing packages shipped with Anaconda:

1. Clone this repo.
2. Next, run [/install-scripts/install_detectron_2.sh](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/install-scripts/install_dependencies.sh) in order to install Detectron2, as well as all of its dependencies (including a forked version of [img2vec](https://github.com/bcglee/img2vec)) that I modifyed to include ResNet-50 embedding capabilities). Due to some deprecated code in pycocotools, you may need to change "unicode" to "bytes" in line 308 of `~/anaconda3/lib/python3.6/site-packages/pycocotools/coco.py` in order to enable the test evaluation in Detectron2 to work correctly. If the above installation package fails, I recommend following the steps on the [Detectron2 repo](https://github.com/facebookresearch/detectron2/blob/master/INSTALL.md) for installation.
3. Next, `cd img2vec` and run `python setup.py install`.

To experiment with training your own visual content recognition model, run the command `jupyter notebook` and navigate to the notebook [/notebooks/train_model.ipynb](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/notebooks/train_model.ipynb), which contains code for finetuning Faster-RCNN implementations from [Detectron2's](https://github.com/facebookresearch/detectron2) [Model Zoo](https://github.com/facebookresearch/detectron2/blob/master/MODEL_ZOO.md) - the notebook is pre-populated with the output from training the model for 10 epochs (scroll down to the bottom to see some sample predictions). If everything is installed correctly, the notebook should run without any additional steps!


## Processing Your Own Newspaper Pages

Included in this repo are the model weights for a finetuned Faster-RCNN implementation (the R50-FPN backbone from Detectron2's Model Zoo). The model weights are used in the *Newspaper Navigator* pipeline for the construction of the Newspaper Navigator dataset. The R50-FPN backbone was selected because it has the fastest inference time of the Faster-RCNN backbones, and inference time is the bottleneck in *Newspaper Navigator* pipeline (approximately 0.1 seconds per image on an NVIDIA T4 GPU).  Though the X101-FPN backbone reports a slightly higher box average precision (43 \% vs. 37.9 \%), inference time is approximately 2.5 times slower, which would drastically increase the pipeline runtime.

Here are performance metrics on the model available for use; the model consists of the Faster-RCNN R50-FPN backbone from Detectron2's Model Zoo (all training was done on an AWS g4dn.2xlarge instance with a single NVIDIA T4 GPU) finetuned on the training set described above:

| Category | Average Precision | # in Validation Set |
| ----- | ----------------- | ----------------- |
| Combined | 56.4\% | 9,632 |
| Photograph | 56.5\% | 774 |
| Illustration | 24.9\% | 200 |
| Map | 58.7\% | 13 |
| Comic/Cartoon | 58.8\% | 224 |
| Editorial Cartoon | 48.7\% | 56 |
| Headline | 71.5\% | 5,773 |
| Advertisement | 75.6\% | 2,592 |

For a slideshow showing the performance of this model on 50 sample pages from the *Beyond Words* test set, please see [/demos/slideshow.mp4](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/demos/slideshow.mp4).

*Note*: To use the model weights, import the model weights in PyTorch as usual, and set add following lines:

-  `cfg.merge_from_file("/detectron2/configs/COCO-Detection/faster_rcnn_R_50_FPN_3x.yaml")` #note that you may need to change the filepath to navigate to detectron2 correctly
-  `cfg.MODEL.ROI_HEADS.NUM_CLASSES = 7`

To see more on how to run inference using this model, take a look at the pipeline code.

## Extracting Captions and Textual Content using METS/ALTO OCR

Now that we have a finetuned model for extracting visual content from newspaper scans in *Chronicling America*, we can leverage the OCR of each scan to weakly supervise captions and corresponding textual content. Because *Beyond Words* volunteers were instructed to draw bounding boxes over corresponding textual content (such as titles and captions), the finetuned model has learned how to do this as well.  Thus, it is possible to utilize the predicted bounding boxes to extract textual content within each predicted bounding box from the METS/ALTO OCR XML file for each *Chronicling America* page. Note that this is precisely what happens in *Beyond Words* during the "Transcribe" step, where volunteers correct the OCR within each bounding box. The code for extracting textual content from the METS/ALTO OCR is included in the pipeline and is described below.

## Generating Image Embeddings

In order to generate search and recommendation results over similar visual content, it is useful to have pre-computed image embeddings for fast querying.  In the pipeline, I have included code for generating image embeddings using a forked version of [img2vec](https://github.com/bcglee/img2vec).

## A Pipeline for Running at Scale

Currently under development is the notebook [/notebooks/process_chronam_pages.ipynb](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/notebooks/process_chronam_pages.ipynb), with the goal of being able to run the pipeline over millions of *Chronicling America* pages. This code relies on the repo [chronam-get-images](https://github.com/bcglee/chronam-get-images) to produce manifests of each newspaper in Chronicling America. Two .zip files containing the manifests can be found in this repo in [/manifests/](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/manifests/); they serve as a convenient way of navigating the Newspaper Navigator dataset stored in an S3 bucket (*coming soon...*).

This notebook then uses this manifest to:

1. iterate over images in each *Chronicling America* manifest
2. perform inference on the images using the finetuned visual content detection model
3. crop and save the identified visual content (minus headlines)
4. extract textual content within the predicted bounding boxes using the METS/ALTO XML files containing the OCR for each page
5. generate ResNet-18 & ResNet-50 embeddings for each cropped image using a forked version of [img2vec](https://github.com/bcglee/img2vec) for fast similarity querying
6. save the results for each page as a JSON file in a file tree that mirrors the *Chronicling America* file tree.  If you navigate to *link coming soon*, you will find a .zip file corresponding to each folder at:  https://chroniclingamerica.loc.gov/data/batches/ (each folder contains the data for a digitized newspaper batch, described [here](https://chroniclingamerica.loc.gov/batches/)).  If you unzip the file, you will find two JSON file corresponding to each page in the full batch.  The first JSON file (without "embeddings" in the name) contains the following keys:

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
* `visual_content_filepaths [list:str]`: a list containing the filepath for each cropped image (except headlines, which were not cropped and saved)

The second JSON file (with "embeddings" in the name) contains the following keys:
* `filepath [str]`: the path to the image, assuming a starting point of https://chroniclingamerica.loc.gov/batches/
* `resnet_50_embeddings [list:list]`: a list containing the 2,048-dimensional ResNet-50 embedding for each image (except headlines, for which embeddings aren't generated)
* `resnet_18_embeddings [list:list]`: a list containing the 512-dimensional ResNet-50 embedding for each image (except headlines, for which embeddings aren't generated)
* `visual_content_filepaths [list:str]`: a list containing the filepath for each cropped image (except headlines, which were not cropped and saved)

*Once this code is finalized, this section will be updated, and the resulting Newspaper Navigator dataset will be released.*

## Visualizing a Day in Newspaper History

Using the [chronam-get-images repo](https://github.com/bcglee/chronam-get-images), we can pull down all of the *Chronicling America* content for a specific day in history (or, a larger date range if you're interested - the world is your oyster!).  Running the above scripts, it's possible to go from a set of scans and OCR XML files to extracted visual content. How do we then visualize this content?

One answer is to use image embeddings and T-SNE to cluster the images in 2D.  To accomplish this, I've used [img2vec](https://github.com/bcglee/img2vec). Here, I've chosen to use the image embeddings.  Using sklearn's implementation of T-SNE, it's easy to perform dimensionality reduction down to 2D, perfect for a visualization. We can then visualize a day in history!

For a sample visualization of June 7th, 1944 (the day after D-Day), please see [visualizing_6_7_1944.png](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/demos/visualizing_6_7_1944.png) (*NOTE: the image is 20 MB, enabling high resolution of images even when zooming in*).  If you search around in this visualization, you will find clusters of maps showing the Western Front, photographs of military action, and photographs of people.  Currently, the aspect ratio of the extracted visual content is not preserved, but this is to be added in future iterations.

The script [/demos/generate_visualization.py](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/generate_visualization.py) contains my code for generating the sample visualization, though it is not currently in a state of supporting out-of-the-box functionality.

(*This README will be updated as new commits are added*).
