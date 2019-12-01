# Re-imagining *Beyond Words* with deep learning

## By Benjamin Charles Germain Lee (LOC Innovator-in-Residence, 2020)

This code base explores using the Beyond Words crowdsourced annotations of photographs, illustrations, comics, cartoons, and maps from *Chronicling America* to finetune a pre-trained object detection model to detect visual content in historical newspaper scans. This finetuned model can then be used as the first step in a pipeline for automating the extraction of visual content from *Chronicling America*, as well as captions and corresponding textual content from the METZ/ALTO OCR of each *Chronicling America* page.

The script "\_" uses the verified Beyond Words JSON file to download the newspaper scans and construct a dataset for photograph, illustration, comic, cartoon, and map detection in historical newspaper scans.  The dataset is formatted according to the <a href="http://cocodataset.org/#format-data">COCO</a> format (there is also some commented-out, vestigial code for creating pixel masks to work with the <a href="https://dhsegment.readthedocs.io/en/latest/start/demo.html">dhSegment</a> format).  The dataset can be found here (*describe*).

The notebook "\_" finetunes different pre-trained Faster-RCNN implementations from <a href="https://github.com/facebookresearch/detectron2">Detectron2</a>'s <a href="https://github.com/facebookresearch/detectron2/blob/master/MODEL_ZOO.md">Model Zoo</a>.

The script "\_" extracts textual content within each predicted bounding box from the METZ/ALTO OCR XML file for each *Chronicling America* page.


(This README will be updated as new commits are added).
