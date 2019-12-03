from img2vec_pytorch import Img2Vec
from PIL import Image
import glob
import matplotlib.pyplot as plt
from matplotlib.image import BboxImage
from matplotlib.transforms import Bbox, TransformedBbox
from sklearn.manifold import TSNE
import sys

# we load in the files that we'd like to visualize
img_filepaths = glob.glob('../chronam-get-images/predicted/**/*.jpg', recursive=True)

# we use img2vec (https://github.com/christiansafka/img2vec)
img2vec = Img2Vec(cuda=False, model='alexnet')

# a list to store the embeddings
img_vectors = []

# iterates through image and uses img2vec to generate vector from image (img2vec -> https://github.com/christiansafka/img2vec)
for filepath in img_filepaths:

    # we need to convert to RGB to have appropriate number of channels (specifically, 3 for RGB)
    img = Image.open(filepath).convert('RGB')
    vec = img2vec.get_vec(img, tensor=False)
    img_vectors.append(vec)

# we next compute T-SNE dimensionality reduction
embedded = TSNE(n_components=2, perplexity=20, init='random', random_state=10).fit_transform(img_vectors)

# plots T-SNE embeddings as a scatter plot (for reference)
plt.clf()
plt.scatter(embedded[:,0], embedded[:,1], marker='.', color='blue')
plt.savefig("tests/tsne_test.png")
plt.clf()

# generates 2d T-SNE visualization of image embeddings
plt.clf()
fig = plt.figure(figsize=(25,25))
plt.xlim([-20,20])
plt.ylim([-20,20])
ax = fig.add_subplot(111)
plt.axis('off')

# adapted from https://stackoverflow.com/questions/25329583/matplotlib-using-image-for-points-on-plot
for i in range(0, len(img_filepaths)):
    bb = Bbox.from_bounds(embedded[i][0],embedded[i][1],1.0,1.0)
    bb2 = TransformedBbox(bb,ax.transData)
    bbox_image = BboxImage(bb2, norm=None, origin=None, clip_on=False, cmap='gray')
    im = plt.imread(img_filepaths[i])
    bbox_image.set_data(im)
    ax.add_artist(bbox_image)

# saves figure
plt.savefig("tests/testfig.png", dpi=500, bbox_inches='tight')
plt.clf()
