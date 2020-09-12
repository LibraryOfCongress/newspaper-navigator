
# *Newspaper Navigator*

## By Benjamin Charles Germain Lee (2020 Library of Congress Innovator in Residence)

## Introduction

The goal of *Newspaper Navigator* is to re-imagine searching over the visual content in [*Chronicling America*](https://chroniclingamerica.loc.gov/about/). The project consists of two stages:
- Creating the [*Newspaper Navigator* dataset](https://news-navigator.labs.loc.gov/) by extracting headlines, photographs, illustrations, maps, comics, cartoons, and advertisements from 16.3 million historic newspaper pages in Chronicling America using emerging machine learning techniques.  In addition to the visual content, the dataset includes captions and other relevant text derived from the METS/ALTO OCR, as well as image embeddings for fast similarity querying.
- Creating an [exploratory search application](https://news-navigator.labs.loc.gov/search) for the *Newspaper Navigator* dataset in order to enable new ways for the American public to navigate Chronicling America.

This repo contains the code for both steps of the project, as well as a list of *Newspaper Navigator* resources.

## Updates

**Update (09/10/2020):**

- The development of the *Newspaper Navigator* search application is complete! You can find the search application at: [https://news-navigator.labs.loc.gov/search](https://news-navigator.labs.loc.gov/search).

- The *Newspaper Navigator* data archaeology is now available at: [http://dx.doi.org/10.17613/k9gt-6685](http://dx.doi.org/10.17613/k9gt-6685). The data archaeology examines the ways in which a *Chronicling America* newspaper page is transmuted and decontextualized during its journey from a physical artifact to a series of probabilistic photographs, illustrations, maps, comics, cartoons, headlines, and advertisements in the *Newspaper Navigator dataset*. You can also find the PDF of the paper in the repo [here](https://github.com/LibraryOfCongress/newspaper-navigator/tree/master/whitepapers).

**Update (05/05/2020):**

- The pipeline has finished processing 16,368,041 *Chronicling America* pages, and the *Newspaper Navigator* dataset is available to the public! You can find the *Newspaper Navigator* dataset website here: [https://news-navigator.labs.loc.gov/](https://news-navigator.labs.loc.gov).
- Learn more about the dataset and its construction in a paper available here: [https://arxiv.org/abs/2005.01583](https://arxiv.org/abs/2005.01583). You can also find the PDF of the paper in the repo [here](https://github.com/LibraryOfCongress/newspaper-navigator/tree/master/whitepapers).


## The *Newspaper Navigator* Dataset Pipeline

The sections below describe the different components of building the *Newspaper Navigator* pipeline. Here is a diagram of the pipeline workflow:

![Alt text](demos/pipeline.png?raw=true "Title")


## Training Dataset for Visual Content Recognition in Historic Newspapers

The first step in the pipeline is creating a training dataset for visual content recognition. The [*Beyond Words*](hhttps://labs.loc.gov/work/experiments/beyond-words/) dataset consists of crowdsourced locations of photographs, illustrations, comics, cartoons, and maps in World War I era newspapers, as well as corresponding textual content (titles, captions, artists, etc.). In order to utilize this dataset to train a visual content recognition model for historical newspaper scans, a copy of the dataset can be found in this repo (in [/beyond_words_data/](https://github.com/LibraryOfCongress/newspaper-navigator/tree/master/beyond_words_data)) formatted according to the [COCO](http://cocodataset.org/#format-data) standard for object detection. The images are stored in [/beyond_words_data/images/](https://github.com/LibraryOfCongress/newspaper-navigator/tree/master/beyond_words_data/images), and the JSON can be found in [/beyond_words_data/trainval.json](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/beyond_words_data/trainval.json). The JSON also includes annotations of headlines and advertisements, as well as annotations for additional pages with maps to boost the number of maps in the dataset. These annotations were all done by one person (myself) and thus are unverified. The breakdown is as follows:

The dataset contains 3,437 images with 6,732 verified annotations (downloaded from the *Beyond Words* site on 12/01/2019), plus an additional 32,424 unverified annotations.  Here is a breakdown of categories:

| Category | # in Full Dataset |
| ----- | ----------------- |
| Photograph | 4,254 |
| Illustration | 1,048 |
| Map | 215 |
| Comics/Cartoon | 1,150 |
| Editorial Cartoon | 293 |
| Headline | 27,868 |
| Advertisement | 13,581 |
| Total | 48,409 |

If you would like to use only the verified *Beyond Words* data, just disregard the headline and advertisement annotations, as well as the annotations for any image added after 12/1/2019.

For an 80\%-20\% split of the dataset, see [/beyond_words_data/train_80_percent.json](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/beyond_words_data/train_80_percent.json) and [/beyond_words_data/val_20_percent.json](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/beyond_words_data/val_20_percent.json).  Lastly, the original verified annotations from the *Beyond Words* site can be found at [beyond_words_data/beyond_words.txt](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/beyond_words_data/beyond_words.txt).

To construct the dataset using the *Beyond Words* annotations added since 12/01/2019, first update the annotations file from the Beyond Words website, then run the script [process_beyond_words_dataset.py](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/process_beyond_words_dataset.py).  To add the additional headline and advertisement annotations, you can retrieve them from [/beyond_words_data/trainval.json](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/beyond_words_data/trainval.json) and add them to your dataset.

## Detecting and Extracting Visual Content from Historic Newspaper Scans

With this dataset fully constructed, it is possible to train a deep learning model to identify visual content and classify the content according to 7 classes (photograph, illustration, map, comic, editorial cartoon, headline, advertisement).  The approach utilized here is to finetune a pre-trained Faster-RCNN implementation in [Detectron2's](https://github.com/facebookresearch/detectron2) [Model Zoo](https://github.com/facebookresearch/detectron2/blob/master/MODEL_ZOO.md) in PyTorch.  

I have included scripts and notebooks designed to run out-of-the-box on most deep learning environments (tested on an AWS EC2 instance with a Deep Learning Ubuntu AMI). Below are the steps to get running on any deep learning environment with Python 3, PyTorch, and the standard scientific computing packages shipped with Anaconda:

1. Clone this repo.
2. Next, run [/install-scripts/install_detectron_2.sh](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/install-scripts/install_dependencies.sh) in order to install Detectron2, as well as all of its dependencies. Due to some deprecated code in pycocotools, you may need to change "unicode" to "bytes" in line 308 of `~/anaconda3/lib/python3.6/site-packages/pycocotools/coco.py` in order to enable the test evaluation in Detectron2 to work correctly. If the above installation package fails, I recommend following the steps on the [Detectron2 repo](https://github.com/facebookresearch/detectron2/blob/master/INSTALL.md) for installation.
3. For the pipeline code, you'll need to clone a forked version of [img2vec](https://github.com/bcglee/img2vec) that I modified to include ResNet-50 embedding functionality. Then `cd img2vec` and run `python setup.py install`.  
4. For the pipeline code, you'll also need to install graphicsmagick for converting JPEG-2000 images to JPEG images.  Run `sudo apt-get install graphicsmagick` to install it.

To experiment with training your own visual content recognition model, run the command `jupyter notebook` and navigate to the notebook [/notebooks/train_model.ipynb](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/notebooks/train_model.ipynb), which contains code for finetuning Faster-RCNN implementations from [Detectron2's](https://github.com/facebookresearch/detectron2) [Model Zoo](https://github.com/facebookresearch/detectron2/blob/master/MODEL_ZOO.md) - the notebook is pre-populated with the output from training the model for 10 epochs (scroll down to the bottom to see some sample predictions). If everything is installed correctly, the notebook should run without any additional steps!


## Processing Your Own Newspaper Pages

The model weights file for the finetuned visual content recognition model is available [here](https://news-navigator.labs.loc.gov/model_weights/model_final.pth) (the file is approximately 300 MB in size).

The visual content recognition model is a finetuned Faster-RCNN implementation (the R50-FPN backbone from Detectron2's Model Zoo). The model weights are used in the *Newspaper Navigator* pipeline for the construction of the *Newspaper Navigator* dataset. The R50-FPN backbone was selected because it has the fastest inference time of the Faster-RCNN backbones, and inference time is the bottleneck in the *Newspaper Navigator* pipeline (approximately 0.1 seconds per image on an NVIDIA T4 GPU).  Though the X101-FPN backbone reports a slightly higher box average precision (43 \% vs. 37.9 \%), inference time is approximately 2.5 times slower, which would drastically increase the pipeline runtime.

Here are performance metrics on the model available for use; the model consists of the Faster-RCNN R50-FPN backbone from Detectron2's Model Zoo (all training was done on an AWS g4dn.2xlarge instance with a single NVIDIA T4 GPU) finetuned on the training set described above:

| Category | Average Precision | # in Validation Set |
| ----- | ----------------- | ----------------- |
| Photograph | 61.6\% | 879 |
| Illustration | 30.9\% | 206 |
| Map | 69.5\% | 34 |
| Comic/Cartoon | 65.6\% | 211 |
| Editorial Cartoon | 63.0\% | 54 |
| Headline | 74.3\% | 5,689 |
| Advertisement | 78.7\% | 2,858 |
| Combined | 63.4\% | 9,931 |


For slideshows showing the performance of this model on 50 sample pages from the *Beyond Words* test set, please see [/demos/slideshow_predictions_filtered.mp4](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/demos/slideshow_predictions_filtered.mp4) (for the predictions filtered with a threshold cut of 0.5 on confidence score) and [/demos/slideshow_predictions_unfiltered.mp4](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/demos/slideshow_predictions_unfiltered.mp4) (for the predictions with a very low, default threshold cut of 0.05 on confidence score).

*Note*: To use the model weights, import the model weights in PyTorch as usual, and add following lines:

-  `cfg.merge_from_file("/detectron2/configs/COCO-Detection/faster_rcnn_R_50_FPN_3x.yaml")` (note that you may need to change the filepath to navigate to detectron2 correctly)
-  `cfg.MODEL.ROI_HEADS.NUM_CLASSES = 7`

To see more on how to run inference using this model, take a look at the pipeline code.

## Extracting Captions and Textual Content using METS/ALTO OCR

Now that we have a finetuned model for extracting visual content from newspaper scans in *Chronicling America*, we can leverage the OCR of each scan to weakly supervise captions and corresponding textual content. Because *Beyond Words* volunteers were instructed to draw bounding boxes over corresponding textual content (such as titles and captions), the finetuned model has learned how to do this as well.  Thus, it is possible to utilize the predicted bounding boxes to extract textual content within each predicted bounding box from the METS/ALTO OCR XML file for each *Chronicling America* page. Note that this is precisely what happens in *Beyond Words* during the "Transcribe" step, where volunteers correct the OCR within each bounding box. The code for extracting textual content from the METS/ALTO OCR is included in the pipeline and is described below.

## Generating Image Embeddings

In order to generate search and recommendation results over similar visual content, it is useful to have pre-computed image embeddings for fast querying.  In the pipeline, I have included code for generating image embeddings using a forked version of [img2vec](https://github.com/bcglee/img2vec).

## A Pipeline for Running at Scale

The pipeline code for processing 16.3 million *Chronicling America* pages can be found in [/notebooks/process_chronam_pages.ipynb](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/notebooks/process_chronam_pages.ipynb). This code relies on the repo [chronam-get-images](https://github.com/bcglee/chronam-get-images) to produce manifests of each newspaper [batch](https://chroniclingamerica.loc.gov/batches/) in Chronicling America. A .zip file containing the manifests can be found in this repo in [manifests.zip](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/manifests.zip). When unzipped, the manifests are separated into two folders: `processed` (containing the 16,368,041 pages that were successfully processed) and `failed` (containing the 383 pages that failed during processing).

This notebook then:

1. downloads the image and corresponding OCR for each newspaper page in each *Chronicling America* batch directly from the corresponding S3 buckets (*note*: you can alternatively download Chronicling America pages using [chronam-get-images](https://github.com/bcglee/chronam-get-images))
2. performs inference on the images using the finetuned visual content detection model
3. crops and saves the identified visual content (minus headlines)
4. extracts textual content within the predicted bounding boxes using the METS/ALTO XML files containing the OCR for each page
5. generates ResNet-18 and ResNet-50 embeddings for each cropped image using a forked version of [img2vec](https://github.com/bcglee/img2vec) for fast similarity querying
6. saves the results for each page as a JSON file in a file tree that mirrors the *Chronicling America* file tree  

**Note**: to run the pipeline, you must convert the notebook to a Python script, which can be done with the command:  `jupyter nbconvert --to script process_chronam_pages.ipynb`. This is necessary because the code is heavily parallelized using multiprocessing, and the cell execution in Jupyter notebooks presents conflicts.

## Visualizing a Day in Newspaper History

Using the [chronam-get-images repo](https://github.com/bcglee/chronam-get-images), we can pull down all of the *Chronicling America* content for a specific day in history (or, a larger date range if you're interested - the world is your oyster!).  Running the above scripts, it's possible to go from a set of scans and OCR XML files to extracted visual content. How do we then visualize this content?

One answer is to use image embeddings and T-SNE to cluster the images in 2D.  To accomplish this, I've used [img2vec](https://github.com/bcglee/img2vec). Here, I've chosen to use the image embeddings.  Using sklearn's implementation of T-SNE, it's easy to perform dimensionality reduction down to 2D, perfect for a visualization. We can then visualize a day in history!

For a sample visualization of June 7th, 1944 (the day after D-Day), please see [/demos/visualizing_6_7_1944.png](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/demos/visualizing_6_7_1944.png) (*NOTE: the image is 20 MB, enabling high resolution of images even when zooming in*).  If you search around in this visualization, you will find clusters of maps showing the Western Front, photographs of military action, and photographs of people.  Currently, the aspect ratio of the extracted visual content is not preserved, but this is to be added in future iterations.

The script [/demos/generate_visualization.py](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/generate_visualization.py) contains my code for generating the sample visualization, though it is not currently in a state of supporting out-of-the-box functionality.

## The *Newspaper Navigator* Search Application

The *Newspaper Navigator* search application is available at: [https://news-navigator.labs.loc.gov/search](https://news-navigator.labs.loc.gov/search). With the application, you can explore 1.56 million photos from the *Newspaper Navigator* dataset. In addition to searching by keyword over the photos' captions (extracted from the OCR of each newspaper page as part of the *Newspaper Navigator* pipeline), you can search by visual similarity using machine learning. In particular, by selecting photos that you are interested in, you can train an "AI navigator" on the fly to retrieve photos for you according to visual similarity (for example: baseball players, sailboats, etc.). An AI navigator can train and predict on all 1.56 million photos in just a couple of seconds, thus facilitating re-training and tuning. To learn more about this application, please see the demo video on the [landing page](https://news-navigator.labs.loc.gov/search) or read more on the ['About'](https://news-navigator.labs.loc.gov/search/about) page.

You can find all of the code for the app in [/news_navigator_app](https://github.com/LibraryOfCongress/newspaper-navigator/blob/master/news_navigator_app/) in this repo. The app is fully containerized in Docker and was written in Python, Flask, HTML, CSS, and vanilla Javascript (scikit-learn was utilized for the machine learning component).

To launch the Docker container, follow these steps:
1. Clone the repo
2. Navigate to /news_navigator_app
3. Run: `docker-compose up --build`
4. Go to http://0.0.0.0:5000/search (or the appropriate port; just be sure to go to /search, which is the landing page)

The Redis usage in flaskapp.py is modeled after [https://docs.docker.com/compose/gettingstarted/]https://docs.docker.com/compose/gettingstarted/.

Currently, when the Dockerfile is executed, the script `download_photos_and_metadata.py` in `/news_navigator_app/preprocessing` is run before the app launches. Parameters for the pre-processing script can be found in the same directory in `/news_navigator_app/params.py`. The parameters in the script allow you to control the number of photos consumed by the app. Setting `USE_PRECOMPUTED_METADATA` to `True` tells the pre-processing script to pull down the pre-computed metadata for all 1.56 million photos, which amounts to ~6GB of data. I recommend not doing this, as the memory consumption of the app is quite large. Alternatively, setting `USE_PRECOMPUTED_METADATA` to `False` tells the pre-processing script to pull down metadata from [https://news-navigator.labs.loc.gov](https://news-navigator.labs.loc.gov) and compute the metadata on the fly. When launching the app for all 1.56 million photos, this is much slower than downloading the precomputed metadata; however, it enables you to run the app over a much smaller number of photos, which is advantageous when there are memory constraints, such as on a local machine (the app requires ~15GB of RAM to run with all of the photos). To use a much smaller set of photos, you can use the default settings of `USE_SAMPLE_PACKS` as `True`, `START_YEAR` as `1910` and `END_YEAR` as `1911` (along with `USE_PRECOMPUTED_METADATA` as `False`). The `USE_SAMPLE_PACKS` flag tells the pre-processing script to pull down only 1000 photos from each year in the date range. Using a few thousand photos is best for testing.

All requests are handled via query strings, and there is no back-end database.

In order to replace the photos in the *Newspaper Navigator* dataset, you'll need to pre-compute image embeddings for all of your photos and generate the appropriate metadata. You'll also need to modify `download_metadata.py`.

## *Newspaper Navigator* Resources

- Dataset: [https://news-navigator.labs.loc.gov](https://news-navigator.labs.loc.gov)
- Search application [https://news-navigator.labs.loc.gov/search](https://news-navigator.labs.loc.gov/search)
- Dataset Paper: [https://arxiv.org/abs/2005.01583](https://arxiv.org/abs/2005.01583)
- Data Archaeology: [http://dx.doi.org/10.17613/k9gt-6685](http://dx.doi.org/10.17613/k9gt-6685)
- Recording of the *Newspaper Navigator* Data Jam: [https://www.loc.gov/item/webcast-9253](https://www.loc.gov/item/webcast-9253)

## Related Resources
- *Chronicling America*: [https://chroniclingamerica.loc.gov](https://chroniclingamerica.loc.gov)
- LC Labs: [https://labs.loc.gov](https://labs.loc.gov)
- National Digital Newspaper Program: [https://loc.gov/ndnp](https://loc.gov/ndnp)
