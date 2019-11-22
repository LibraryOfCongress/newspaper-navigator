# beyond_words

## By Benjamin Charles Germain Lee (LOC Innovator-in-Residence, 2020)

This code uses the Beyond Words crowdsourced annotations of photographs, maps, and comics/cartoons from *Chronicling America* to train an image segmentation model.

The script "_" uses the verified Byond Words JSON file to download the newspaper scans and construct datasets according to the <a href="http://cocodataset.org/#format-data">COCO</a> format, as well as the <a href="https://dhsegment.readthedocs.io/en/latest/start/demo.html">dhSegment</a> format.

The notebook "_" uses <a href="https://github.com/facebookresearch/detectron2">Detectron2</a>'s pretrained models for image segmentation.

(This README will be udpdated as new commits are added).


