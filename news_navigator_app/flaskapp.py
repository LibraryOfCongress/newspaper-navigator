# Flask
from flask import Flask, Blueprint, request, jsonify, flash, render_template, redirect, send_from_directory, make_response, url_for
from werkzeug.datastructures import ImmutableMultiDict
import flask

# scikit-learn
from sklearn.metrics.pairwise import cosine_distances
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.manifold import TSNE
from sklearn.svm import LinearSVC

# NLTK
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords

# NumPy
import numpy as np

# various Flask libraries
from flask_paginate import Pagination, get_page_args
from forms import DataSearchForm, MLSearchForm

# vanilla Python imports
from collections import Counter, OrderedDict
from functools import reduce
import datetime
import zipfile
import glob
import json
import math
import time
import csv
import sys
import io
import os
import re

try:
    import cPickle as pickle
except ModuleNotFoundError:
    import pickle

N_PER_PAGE = 100

N_PREDICTIONS = 200

abbrev_to_state = {
    'AL': 'Alabama',
    'AK': 'Alaska',
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'FL': 'Florida',
    'GA': 'Georgia',
    'HI': 'Hawaii',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'ME': 'Maine',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PA': 'Pennsylvania',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming',
    'PR': 'Puerto Rico',
    'DC': 'District of Columbia',
    'nan': 'nan',
    'None': 'None'
    }

state_to_abbrev = {
    'Alabama': 'AL',
    'Alaska': 'AK',
    'Arizona': 'AZ',
    'Arkansas': 'AR',
    'California': 'CA',
    'Colorado': 'CO',
    'Connecticut': 'CT',
    'Delaware': 'DE',
    'Florida': 'FL',
    'Georgia': 'GA',
    'Hawaii': 'HI',
    'Idaho': 'ID',
    'Illinois': 'IL',
    'Indiana': 'IN',
    'Iowa': 'IA',
    'Kansas': 'KS',
    'Kentucky': 'KY',
    'Louisiana': 'LA',
    'Maine': 'ME',
    'Maryland': 'MD',
    'Massachusetts': 'MA',
    'Michigan': 'MI',
    'Minnesota': 'MN',
    'Mississippi': 'MS',
    'Missouri': 'MO',
    'Montana': 'MT',
    'Nebraska': 'NE',
    'Nevada': 'NV',
    'New Hampshire': 'NH',
    'New Jersey': 'NJ',
    'New Mexico': 'NM',
    'New York': 'NY',
    'North Carolina': 'NC',
    'North Dakota': 'ND',
    'Ohio': 'OH',
    'Oklahoma': 'OK',
    'Oregon': 'OR',
    'Pennsylvania': 'PA',
    'Rhode Island': 'RI',
    'South Carolina': 'SC',
    'South Dakota': 'SD',
    'Tennessee': 'TN',
    'Texas': 'TX',
    'Utah': 'UT',
    'Vermont': 'VT',
    'Virginia': 'VA',
    'Washington': 'WA',
    'West Virginia': 'WV',
    'Wisconsin': 'WI',
    'Wyoming': 'WY',
    'Puerto Rico': 'PR',
    'District of Columbia': 'DC',
    'nan': 'nan',
    'None': 'None'
    }


bp = Blueprint('news-navigator', __name__, template_folder='templates', static_folder="static")


# initializes data in __main__
@bp.before_app_first_request
def load_data():
    global metadata
    global embeddings
    global years
    global states
    global word2vec_model

    # now, we load in the pkl & npy data
    with open('data/global_metadata.pkl', 'rb') as f:
        metadata = pickle.load(f)
    embeddings = np.load('data/global_embeddings.npy')

    for i in range(0, len(metadata)):
        lowered = metadata[i]['ocr'].lower()
        metadata[i]['lowered_ocr'] = lowered


# search homepage
@bp.route('', methods=['GET', 'POST'])
def search():

    search = DataSearchForm(request.args)

    if request.method == 'GET':
        if search.data['select_state'] is None and search.data['select_start_year'] == '1900' and search.data['select_end_year'] == '1963' and search.data['search'] == '':
            return render_template('index.html', form=search)

        return search_results(search)
    return render_template('index.html', form=search)

# about page (need to hit backend to keep other page links working dynamically)
@bp.route('/about', methods=['GET'])
def about():
    return render_template('about.html')

def perform_search(metadata, search, state, start_year, end_year):
    res = []

    desired_state = ''
    if state != 'All':
        desired_state = abbrev_to_state[state]

    for md in metadata:

        if md['pub_year'] < start_year or md['pub_year'] > end_year:
            continue

        if desired_state != '':

            # only checking first 5 here for speed, but could check all 10...
            md_states = [md['coverage_state_1'], md['coverage_state_2'], md['coverage_state_3'], md['coverage_state_4'],
                        md['coverage_state_5']]

            if not (desired_state in md_states):
                continue

        # if the search query isn't empty, we find OCR containing query
        if len(search) > 0:

            if 'lowered_ocr' in md.keys():
                # OCR is lowered upon load b/c the lowering operation is quite costly
                if not search in md['lowered_ocr']:
                    continue

        # if the image has made it this far, it's a valid search result
        res.append(md)

    return res

# search results
@bp.route('/results', methods=['GET'])
def search_results(search_params):

    page, per_page, offset = get_page_args(page_parameter='page',
                                           per_page_parameter='per_page')

    if request.method == 'GET':

        # parse query string
        search = request.args["search"]
        if search is None:
            search = ""
        else:
            search = search.lower()
        state = request.args["select_state"]
        if state is None:
            state = 'All'
        start_year = int(request.args["select_start_year"])
        if start_year is None:
            start_year = 1900
        end_year = int(request.args["select_end_year"])
        if end_year is None:
            end_year = 1963
        date_ascending = True
        if "date_ascending" in request.args:
            if request.args["date_ascending"] == "false":
                date_ascending = False
            else:
                date_ascending = True
        selected_facets = None
        if "selected_facets" in request.args:
            selected_facets = request.args["selected_facets"]
        if selected_facets is None or selected_facets == '':
            selected_facets = []
        else:
            selected_facets = selected_facets.split(",")
            for i in range(0, len(selected_facets)):
                selected_facets[i] = int(selected_facets[i])

        # grab positive_library_indices & negative_library_indices
        positive_library_indices, negative_library_indices, _, _ = get_annotations(request.args, 0)

        # iterate through each facet and generate predictions
        all_predictions = []
        for facet_index in selected_facets:
            # grab positive & negative annotations for this facet
            _, _, positive_indices, negative_indices = get_annotations(request.args, facet_index)

            # train and predict
            predictions = train_and_predict(positive_indices, negative_indices)
            all_predictions.append(predictions)

        # convert to numpy array
        all_predictions = np.array(all_predictions)

        # if no facets, then don't rank at all
        # if one facet, use sort using facet score
        # if multiple facets, multiply facet scores together and sort
        sorted_metadata = []
        if all_predictions.shape[0] == 0:
            sorted_metadata = metadata
            # if it's supposed to be in descending order, then we reverse
            if not date_ascending:
                sorted_metadata = sorted_metadata[::-1]
        else:
            sorted_indices = np.zeros(len(all_predictions[0]))
            if all_predictions.shape[0] == 1:
                sorted_indices = all_predictions[0].argsort()[::-1]
            else:
                sorted_indices = reduce(np.multiply, all_predictions).argsort()[::-1]

            # filter out photos already in library (+ or -)
            filtered_sorted_indices = []
            for index in sorted_indices:
                if index not in positive_library_indices and index not in negative_library_indices:
                    filtered_sorted_indices.append(index)

            # grab predictions, metadata
            sorted_predictions = predictions[filtered_sorted_indices]
            sorted_metadata = []
            for i in filtered_sorted_indices:
                sorted_metadata.append(metadata[i])

        res = perform_search(sorted_metadata, search, state, start_year, end_year)

        search_suggestions = []
        # IF USING GENSIM #
        ## generates search suggestions using word2vec (genism)
        # if search != "":
        #     try:
        #         suggestions = word2vec_model.most_similar(search.lower().split())
        #         for suggestion in suggestions:
        #             search_suggestions.append(suggestion[0])
        #             # can also do stemming here!
        #     except:
        #         pass
        ###################

        pagination = Pagination(page=page, per_page=N_PER_PAGE, total=len(res))

        return render_template('search.html',
                                results=res[(page-1)*N_PER_PAGE:page*N_PER_PAGE],
                                form=search_params,
                                page=page,
                                per_page=N_PER_PAGE,
                                pagination=pagination,
                                search_suggestions=search_suggestions
                                )


@bp.route('/view', methods=['GET'])
def view():

        # get back pagination info
        page, per_page, offset = get_page_args(page_parameter='page',
                                               per_page_parameter='per_page')

        if request.method == 'GET':

            # parse query string
            annotations_str = request.args.get("plus_library")

            view_sort = 0
            if "view_sort" in request.args:
                if request.args["view_sort"] == "1":
                    view_sort = 1
                elif request.args["view_sort"] == "2":
                    view_sort = 2

            if annotations_str is None:
                pagination = Pagination(page=page, per_page=N_PER_PAGE, total=0)
                return render_template('view.html',
                                        results=[],
                                        page=page,
                                        per_page=N_PER_PAGE,
                                        pagination=pagination,
                                        )

            positive_indices = annotations_str.split(',')

            if positive_indices == ['']:
                pagination = Pagination(page=page, per_page=N_PER_PAGE, total=0)
                return render_template('view.html',
                                        results=[],
                                        page=page,
                                        per_page=N_PER_PAGE,
                                        pagination=pagination,
                                        )

            for i in range(0, len(positive_indices)):
                positive_indices[i] = int(positive_indices[i])

            positive_metadata = []
            for ndx in positive_indices:
                positive_metadata.append(metadata[ndx])

            # handle sorting based on "view_sort": 1 -> date ascending; 2 -> date descending
            if view_sort == 1:
                positive_metadata = sorted(positive_metadata, key=lambda k: k['uuid'])
            elif view_sort == 2:
                positive_metadata = list(reversed(sorted(positive_metadata, key=lambda k: k['uuid'])))

            pagination = Pagination(page=page, per_page=N_PER_PAGE, total=len(positive_metadata))

            return render_template('view.html',
                                    results=positive_metadata[(page-1)*N_PER_PAGE:page*N_PER_PAGE],
                                    page=page,
                                    per_page=N_PER_PAGE,
                                    pagination=pagination,
                                    )

def get_annotations(query_args, facet_index):

    #### parse query strings for +/- library annotations ####
    annotations_str = request.args.get("plus_library")
    positive_library_indices = []
    if not (annotations_str is None or annotations_str == ''):
        positive_library_indices = annotations_str.split(',')

        for i in range(0, len(positive_library_indices)):
            positive_library_indices[i] = int(positive_library_indices[i])

    minus_library_str = request.args.get("minus_library")
    negative_library_indices = []
    if not (minus_library_str is None) and not (minus_library_str == ""):
        negative_library_indices = minus_library_str.split(',')

        for i in range(0, len(negative_library_indices)):
            negative_library_indices[i] = int(negative_library_indices[i])
    ##########################################################

    #### parse query strings for +/- training annotations ####
    positive_list_str = request.args.get("positive")
    positive_indices = []
    if not (positive_list_str is None) and not (positive_list_str == ""):
        positive_list = positive_list_str.split('@')
        chunk  = positive_list[facet_index]
        positive_indices = chunk.split(',')
        if positive_indices == ['']:
                positive_indices = []
        for i in range(0, len(positive_indices)):
                positive_indices[i] = int(positive_indices[i])

    negative_list_str = request.args.get("negative")
    negative_indices = []
    if not (negative_list_str is None) and not (negative_list_str == ""):
        negative_list = negative_list_str.split('@')
        chunk  = negative_list[facet_index]
        negative_indices = chunk.split(',')
        if negative_indices == ['']:
            negative_indices = []
        for i in range(0, len(negative_indices)):
                negative_indices[i] = int(negative_indices[i])
    #########################################################

    # we default to setting to first entry in + library if no + set
    if len(positive_indices) == 0 and len(positive_library_indices) > 0:
        positive_indices = [positive_library_indices[0]]

    return positive_library_indices, negative_library_indices, positive_indices, negative_indices


# this function trains the facet learner and predicts on all examples
# positive_indices, negative_indices are used for training
def train_and_predict(positive_indices, negative_indices):

    # set random seed for reproducibility w/ negative examples
    np.random.seed(0)

    # hyperparamaters for training model
    n_negative_examples = 1000

    ######### next, we grab the embeddings ############
    positive_embeddings = embeddings[positive_indices]

    # randomly draws indices to be included
    random_indices_for_negative = np.arange(len(embeddings))
    np.random.shuffle(random_indices_for_negative)
    random_indices_for_negative = random_indices_for_negative[:n_negative_examples]

    if len(negative_indices) > 0:
        # draw negative embeddings
        negative_embeddings = embeddings[np.concatenate([random_indices_for_negative, np.array(negative_indices)])]
    else:
        negative_embeddings = embeddings[random_indices_for_negative]
    ####################################################

    # construct training data
    train_X = np.concatenate((positive_embeddings, negative_embeddings), axis=0)
    train_y = np.concatenate((np.ones(len(positive_embeddings)), np.zeros(len(negative_embeddings))))
    # set sample weight
    sample_weight = np.ones(len(positive_embeddings) + len(negative_embeddings))
    sample_weight[:len(positive_indices)] = 10
    sample_weight[-len(negative_indices):] = 10

    # create Linear SVM
    # clf = RandomForestClassifier(max_depth=5, random_state=1, n_estimators=100)
    clf = LogisticRegression(class_weight='balanced', random_state=1, max_iter=100000)
    # LinearSVC(class_weight='balanced', verbose=False, max_iter=100000, tol=1e-6, random_state=1)

    # fit to the training data (positive + negative annotations w/ additional, randomly drawn negative examples)
    clf.fit(train_X, train_y, sample_weight)

    # generate predictions
    predictions = clf.predict_proba(embeddings)[:,1]

    return predictions


# ML prediction
@bp.route('/predict', methods=['GET'])
def get_prediction():

        # grab filters here
        if request.method == 'GET':

            # parse query string
            if "ml_search" in request.args:
                search = request.args["ml_search"]
                if search is None:
                    search = ""
                else:
                    search = search.lower()
            else:
                search = ""

            if "ml_select_state" in request.args:
                state = request.args["ml_select_state"]
                if state is None:
                    state = 'All'
            else:
                state = 'All'

            if "ml_select_start_year" in request.args:
                start_year = int(request.args["ml_select_start_year"])
                if start_year is None:
                    start_year = 1900
            else:
                start_year = 1900

            if "ml_select_end_year" in request.args:
                end_year = int(request.args["ml_select_end_year"])
                if end_year is None:
                    end_year = 1963
            else:
                end_year = 1963

            if "facet_index" in request.args:
                facet_index = request.args["facet_index"]
                if facet_index == '':
                    facet_index = 0
                else:
                    facet_index = int(facet_index)
            else:
                facet_index = 0

        # set random seed for reproducibility w/ negative examples
        np.random.seed(0)

        # hyperparamaters for training model
        n_negative_examples = 1000

        # get back pagination info
        page, per_page, offset = get_page_args(page_parameter='page',
                                               per_page_parameter='per_page')

        # grab parsed annotations
        positive_library_indices, negative_library_indices, positive_indices, negative_indices = get_annotations(request.args, facet_index)

        # train and predict
        predictions = train_and_predict(positive_indices, negative_indices)

        # sort indices of predictions and invert (here, capped @ 10K results)
        sorted_indices = predictions.argsort()[::-1]
        sorted_indices = sorted_indices[:N_PREDICTIONS + len(positive_library_indices) + len(negative_library_indices)]
        # filter out photos already in library (+ or -)
        filtered_sorted_indices = []
        for index in sorted_indices:
            if index not in positive_library_indices and index not in negative_library_indices:
                filtered_sorted_indices.append(index)

        # grab predictions, metadata
        sorted_predictions = predictions[filtered_sorted_indices]
        sorted_metadata = []
        for i in filtered_sorted_indices:
            sorted_metadata.append(metadata[i])

        # now we apply the search filters
        res = perform_search(sorted_metadata, search, state, start_year, end_year)

        ###### grab metadata for +/- library for UI #####
        positive_library_metadata = []
        for ndx in positive_library_indices:
            positive_library_metadata.append(metadata[ndx])

        negative_library_metadata = []
        for ndx in negative_library_indices:
            negative_library_metadata.append(metadata[ndx])
        ###################################################

        search = MLSearchForm(request.args)

        pagination = Pagination(page=page, per_page=N_PREDICTIONS, total=len(res)) #per_page=N_PER_PAGE,

        return render_template('predict.html',
                                results= res,  #res[(page-1)*N_PER_PAGE:page*N_PER_PAGE],
                                form=search,
                                page=page,
                                per_page=N_PER_PAGE,
                                pagination=pagination,
                                search_suggestions=[], #search_suggestions[:5],
                                plus_library=positive_library_metadata,
                                minus_library=negative_library_metadata
                                )



@bp.route('/download_metadata', methods=['GET'])
def serve_metadata():

    if request.method == 'GET':

        # parse query string
        library_indices = request.args.get("plus_library").split(',')
        for i in range(0, len(library_indices)):
            library_indices[i] = int(library_indices[i])

        csv_contents = []
        for index in library_indices:
            relevant_row = metadata[index].copy()

            relevant_row['IIIF_url'] += "?response-content-disposition=attachment"

            # need to fix box coordinates, which are permuted in metadata
            temp = relevant_row["box_x2"]
            relevant_row["box_x2"] = relevant_row["box_y1"]
            relevant_row["box_y1"] = temp

            del relevant_row["render_fp"]
            del relevant_row["timestamp"]
            del relevant_row["uuid"]
            del relevant_row["IIIF_downsampled_url"]
            del relevant_row["lowered_ocr"]
            relevant_row["issue_url"] = relevant_row["site_url"]
            del relevant_row["site_url"]
            key_ordering = ['filepath', 'url', 'IIIF_url', 'page_url', 'issue_url',
                            'pub_date', 'pub_year',
                            'pub_month', 'pub_day', 'page_seq_num', 'edition_seq_num',
                            'batch', 'lccn', 'name', 'publisher', 'place_of_publication',
                            'ocr', 'score', 'box_x1', 'box_y1', 'box_x2', 'box_y2',
                            'coverage_state_1', 'coverage_state_2', 'coverage_state_3',
                            'coverage_state_4', 'coverage_state_5', 'coverage_state_6',
                            'coverage_state_7', 'coverage_state_8', 'coverage_state_9',
                            'coverage_state_10']
            relevant_row = OrderedDict((key, relevant_row[key]) for key in key_ordering)
            csv_contents.append(relevant_row)

        # write to CSV
        str_io = io.StringIO()
        dictw = csv.DictWriter(str_io, csv_contents[0].keys())
        dictw.writeheader()
        dictw.writerows(csv_contents)
        output = make_response(str_io.getvalue())
        output.headers["Content-Disposition"] = "attachment; filename=news-navigator-metadata.csv"
        output.headers["Content-type"] = "text/csv"

        return output

app = Flask(__name__)
# register blueprint here for prefix
app.register_blueprint(bp, url_prefix='/search')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=1040)
