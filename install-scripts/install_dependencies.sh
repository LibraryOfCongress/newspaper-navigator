# this file installs the dependencies for the pipeline to run
# it assumes an AWS Deep Learning AMI - see Deep Learning AMI (Ubuntu 16.04) Version 26.0 (ami-0e30cdd8359d89531)
# however, it should work on any machine with python 3 + anaconda + the standard deep learning libraries

# this is for the installation of detectron2:
cd ~
pip install -U torch torchvision cython
pip install opencv-python
pip install pycocotools
pip install git+https://github.com/facebookresearch/fvcore
pip install -U 'git+https://github.com/facebookresearch/fvcore.git' 'git+https://github.com/cocodataset/cocoapi.git#subdirectory=PythonAPI'
git clone https://github.com/facebookresearch/detectron2
cd detectron2
python setup.py build develop
