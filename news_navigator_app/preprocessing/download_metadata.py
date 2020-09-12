# generic imports
from multiprocessing import Pool, get_context, Process, set_start_method
from os import listdir, rmdir
from os.path import join
from shutil import move
import numpy as np
import datetime
import requests
import zipfile
import glob
import math
import json
import time
import sys
import os

import pandas as pd

# pickle import
try:
    import cPickle as pickle
except ModuleNotFoundError:
    import pickle

# import parameters from params.py
import params


# some flags for pre-processing
global USE_PRECOMPUTED_METADATA
USE_PRECOMPUTED_METADATA = params.USE_PRECOMPUTED_METADATA
global USE_SAMPLE_PACKS
USE_SAMPLE_PACKS = params.USE_SAMPLE_PACKS

global START_YEAR
global END_YEAR
START_YEAR = params.START_YEAR
END_YEAR = params.START_YEAR


# function that splits a list into n chunks for multiprocessing
def chunk(file_list, n_chunks):

    # make chunks of files to be distributed across processes
    chunks = []
    chunk_size = math.ceil(float(len(file_list))/n_chunks)
    for i in range(0, n_chunks-1):
        chunks.append(file_list[i*chunk_size:(i+1)*chunk_size])
    chunks.append(file_list[(n_chunks-1)*chunk_size:])

    return chunks

# from requests documentation
def download_url(url, save_path, chunk_size=128):
    r = requests.get(url, stream=True)
    with open(save_path, 'wb') as fd:
        for chunk in r.iter_content(chunk_size=chunk_size):
            fd.write(chunk)

# this function links the metadata & embeddings for a given list of years
def process_years(year_list):

    filepaths_ = []
    embeddings_list_ = []
    csv_data_ = []

    # iterates over each year in the list of years
    for year in year_list:

        if USE_SAMPLE_PACKS:
            metadata_filepath = str(year) + "_photos_sample.csv"
            embeddings_filepath = str(year) + "_photos_sample_embeddings.json"

        else:
            metadata_filepath = str(year) + "_photos.csv"
            embeddings_filepath = str(year) + "_photos_embeddings.json"

        # downloads the relevant files
        download_url("https://news-navigator.labs.loc.gov/prepackaged/" + metadata_filepath, "temp/" + metadata_filepath)
        download_url("https://news-navigator.labs.loc.gov/prepackaged/" + embeddings_filepath, "temp/" + embeddings_filepath)

        print("Finished downloading: " + str(year))

        # stores the matches in dictionary form
        matched = {}

        # opens the embeddings
        json_embeddings = []
        with open('temp/' + embeddings_filepath, 'r') as jsonfile:
            json_embeddings += json.load(jsonfile)

        for json_embedding in json_embeddings:
            fp = json_embedding['filepath']
            matched[fp] = {}
            matched[fp]['resnet_18_embedding'] = np.array(json_embedding['resnet_18_embedding'])

        print("DONE EMBEDDINGS: " + str(year))

        # we now open the metadata from the CSV
        csv_fps = []
        csv_fps.append("temp/" + metadata_filepath)

        # load CSV data into pandas dataframe
        df = pd.concat(pd.read_csv(fp) for fp in csv_fps)

        # convert filepaths to a list
        csv_filepaths = df["filepath"].to_list()

        # we now link the CSV metadata based on filepaths
        for i in range(0, len(json_embeddings)):
            for j in range(0, len(csv_filepaths)):
                embedding_filepath = json_embeddings[i]['filepath']
                df_filepath = csv_filepaths[j]

                if df_filepath == embedding_filepath:
                    row_dict = df.iloc[j].to_dict()
                    row_dict["type"] = "photo"
                    matched[embedding_filepath]['metadata'] = df.iloc[j].to_dict()
                    continue

        print("DONE METADATA: "+ str(year))

        # we now find all of the keys for which all metadata & embeddings have been found
        for filepath in matched.keys():
            if 'resnet_18_embedding' in matched[filepath].keys():
                if 'metadata' in matched[filepath].keys():

                    filepaths_.append(filepath)
                    embeddings_list_.append(matched[filepath]['resnet_18_embedding'])
                    csv_data_.append(matched[filepath]['metadata'])

        # removes the embeddings & metadata files
        os.remove("temp/" + embeddings_filepath)
        os.remove("temp/" + metadata_filepath)


    return filepaths_, embeddings_list_, csv_data_


# need main for setting multiprocessing start method to spawn
if __name__ == '__main__':

    print("Downloading metadata and reformatting...")

    # create photos directory
    if not os.path.isdir("data/"):
        os.mkdir("data/")
    if not os.path.isdir("temp/"):
        os.mkdir("temp/")

    # if the flag is set to use the pre-computed metadata over all images, we download the metadata
    if USE_PRECOMPUTED_METADATA:
        print("Downloading global_metadata.pkl & global_embeddings.npy")
        print("This may take a few minutes...")
        download_url("https://news-navigator.labs.loc.gov/data/global_metadata.pkl", "data/global_metadata.pkl")
        download_url("https://news-navigator.labs.loc.gov/data/global_embeddings.npy", "data/global_embeddings.npy")
        print("Done!")

    # else, we run full pre-processing script
    else:
        # sets the year range based on the start year and end year
        years = np.arange(END_YEAR - START_YEAR + 1) + START_YEAR

        # sets number of processes (be careful based on number of available cores)
        N_CPU_PROCESSES = 1

        # sets multiprocessing pool
        pool = Pool(N_CPU_PROCESSES)

        # chunks the batch for multiprocessing
        chunked = chunk(years, N_CPU_PROCESSES)

        # runs the multiprocessing
        data = pool.map(process_years, chunked)

        global_filepaths = []
        global_embeddings_list = []
        global_metadata = []

        # combines all of the returned data
        for row in data:
            global_filepaths += row[0]
            global_embeddings_list += row[1]
            global_metadata += row[2]

        # we now pre-process the metadata (sort, convert types, etc.)
        for i in range(0, len(global_metadata)):
            md = global_metadata[i]

            # converts from numpy ints & floats to normal ints and floats
            md["pub_year"] = int(md["pub_year"])
            md["pub_month"] = int(md["pub_month"])
            md["pub_day"] = int(md["pub_day"])
            md["page_seq_num"] = int(md["page_seq_num"])
            md["edition_seq_num"] = int(md["edition_seq_num"])
            md["score"] = float(md["score"])
            md["box_x1"] = float(md["box_x1"])
            md["box_x2"] = float(md["box_x2"])
            md["box_y1"] = float(md["box_y1"])
            md["box_y2"] = float(md["box_y2"])
            md["name"] = md["name"].replace("[volume]", "").strip()

            # now, we add the ChronAm IIIF URLs for serving images
            x = math.floor(md['box_x1']*10000)/100.
            y = math.ceil(md['box_x2']*10000)/100.
            w = math.ceil((md['box_y1'] - md['box_x1'])*10000)/100.
            h = math.ceil((md['box_y2'] - md['box_x2'])*10000)/100.

            url_coordinates = "pct:" + str(x) + "," + str(y) + "," + str(w) + "," + str(h)
            url_chronam_path = "%2F".join(md['url'].split("/")[4:10]) + ".jp2"
            url_prefix = "https://chroniclingamerica.loc.gov/iiif/2"
            url_suffix_full = "pct:100/0/default.jpg"
            url_suffix_downsampled = "pct:10/0/default.jpg"

            md['IIIF_url'] = "/".join([url_prefix, url_chronam_path, url_coordinates, url_suffix_full])
            md['IIIF_downsampled_url'] = "/".join([url_prefix, url_chronam_path, url_coordinates, url_suffix_downsampled])

            # change nan to "" for OCR
            if not isinstance(md["ocr"], str):
                if math.isnan(md["ocr"]):
                    md["ocr"] = ""

            # sets filepath according to folder in 'static'
            md["render_fp"] = "photos/" + md['filepath'].replace("/", "_")

            # sets unix timestamp for quick sorting by date published
            year_ = md["pub_year"]
            month_ = md["pub_month"]
            day_ = md["pub_day"]
            timestamp = time.mktime(datetime.datetime(year=year_, month=month_, day=day_).timetuple())
            md["timestamp"] = timestamp

            # goes to ChronAm front page
            md["site_url"] = "https://chroniclingamerica.loc.gov/lccn/" + md["lccn"] + "/" + str(md["pub_year"]) + "-" + str(md["pub_month"]).zfill(2) + "-" + str(md["pub_day"]).zfill(2) + "/ed-" + str(md["edition_seq_num"])  # + "/seq-1/"

            # we update that metadata entry
            global_metadata[i] = md

        # now we sort everything by timestamp
        # (non-trivial b/c requires re-indexing embeddings...)
        sorted_metadata = []
        sorted_embeddings = []
        for md, embedding in sorted(zip(global_metadata, global_embeddings_list), key= lambda tuple: tuple[0]['timestamp']):
            sorted_metadata.append(md)
            sorted_embeddings.append(embedding)

        global_metadata = sorted_metadata
        global_embeddings_list = np.array(sorted_embeddings)

        # now, after the data is sorted, we add the UUIDs
        for i in range(0, len(global_metadata)):
            md = global_metadata[i]
            md["uuid"] = i
            global_metadata[i] = md

        print("DONE PROCESSING ALL METADATA")

        # now, we write all of the data to disk as npy and pkl files

        embeddings_destination = "data/global_embeddings.npy"
        np.save(embeddings_destination, global_embeddings_list)

        metadata_destination = "data/global_metadata.pkl"
        with open(metadata_destination, 'wb') as f:
            pickle.dump(global_metadata, f, -1)

        print("SAVED!")
