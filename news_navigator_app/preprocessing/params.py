# this file contains parameters used in the pre-processing scripts
# tl;dr: to use the pre-computed metadata over all 1.56 million photos,
# set USE_PRECOMPUTED_METADATA & USE_PRECOMPUTED_TFIDF to True.
# To set a custom range, instead set those parameters to False,
# then adjust USE_SAMPLE_PACKS, START_YEAR, and END_YEAR accordingly.

# this controls whether to pull down pre-computed metadata
# for all 1.56 million photos or to run the metadata
# pre-processing script on custom date range
USE_PRECOMPUTED_METADATA = False

# if running the pre-processing, this controls whether to use the
# sample packs (1000 photos from a given year) or grab all images
USE_SAMPLE_PACKS = True

# if runnning the pre-processing, this controls the date range for
# the photos to include in the application
START_YEAR = 1910
END_YEAR = 1911
