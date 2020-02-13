cd ~
pip install -U torch torchvision cython
pip install opencv-python
pip install pycocotools
pip install git+https://github.com/facebookresearch/fvcore
pip install -U 'git+https://github.com/facebookresearch/fvcore.git' 'git+https://github.com/cocodataset/cocoapi.git#subdirectory=PythonAPI'
git clone https://github.com/facebookresearch/detectron2
cd detectron2
python setup.py build develop

