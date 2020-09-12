// this variable stores the library annotations as they are added & removed
var annotations = [];

// these variables store the +/- annotations for training the ML classifier as they are added & removed
// on the predict page
var all_positive_annotations = [];
var all_negative_annotations = [];
var positive_annotations = [];
var negative_annotations = [];
var starting_positive_annotations = [];
var starting_negative_annotations = [];

// this variable stores the - annotation library
var negative_library = [];

// this variable stores the query string
var query_string = window.location.search;

// this variable stores the facet names
var facet_names = [];

// this variable stores the current facet index
var facet_index = [];

// this variable stores the selected facets on the 'search' page
var selected_facets = [];

// this variable stores whether to sort by date ascending on not on 'search' page
var date_ascending = [];

// this function adds loading bar as the page loads
document.onreadystatechange = function () {
  var state = document.readyState
  if (state == 'interactive') {
       loading();
  } else if (state == 'complete') {
    var modal = document.getElementById("modal");
    modal.style.display = "none";
  }
}

// function for replacing values in query string
function replace_query_string_value(temp_query_string, variable, new_value) {
    // boolean for tracking whether the variable to be updated is in query string
    var registered = 0;

    var vars = temp_query_string.split('&');
    for (var i = 0; i < vars.length; i++){
      var split = vars[i].split('=');
      var to_check = split[0];
      // need to handle case that full URL is passed in and need to parse
      // first query string parameter from endpoint (i.e., /predict?select_state=All)
      if ((i === 0) && (split[0].includes('?'))) {
        to_check = split[0].split('?')[1];
      }
      if (to_check === variable) {
        split[1] = new_value;
        registered = 1;
      }
      vars[i] = split.join('=');
    }
    var fixed = vars.join('&');
    // if the variable is not in the query string, we append it to the end of the query string
    if (registered === 0) {
      fixed = fixed.concat('&'.concat(variable).concat("=").concat(new_value));
    }
    return fixed;
}

function parse_commas(query_string_section, expect_ints=true) {
  var parsed = [];
  var temp_values = [];
  if (query_string_section.includes(',')) {
    temp_values = query_string_section.split(',');
  }
  else if (query_string_section.includes('%2C')) {
    temp_values = query_string_section.split('%2C');
  }
  else {
    temp_values.push(query_string_section);
  }
  // if it's a list with just an empty string, we replace it with an empty string
  if (temp_values.length === 1 && temp_values[0] === "") {
    parsed = [];
  }
  else {
    if (expect_ints) {
      for(var i=0; i<temp_values.length; i++) {
        parsed.push(parseInt(temp_values[i]));
      }
    }
    else {
      for(var i=0; i<temp_values.length; i++) {
        parsed.push(temp_values[i]);
      }
    }
  }
  return parsed;
}


// function that parses annotations from query string based on query string parameter (plus_library, etc.)
// query_string_param refers to the parameter to be extracted from the query string
// nested refers to whether we are constructing a list of lists (i.e., if ',' and '@' separating)
// expect_ints refers to whether we expect the parsed values to be ints
function parse_query_string(query_string_param, nested=false, expect_ints=true) {

  // we set the initial annotations list using the URL
  var temp_values_str = "";
  var vars = window.location.search.substring(1).split('&');
  for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      if (decodeURIComponent(pair[0]) === query_string_param) {
          temp_values_str = pair[1];
      }
  }
  if (!(nested)) {
    // we then return the parsed values
    return parse_commas(temp_values_str, expect_ints);
  }
  else {
    var all_parsed = [];
    var chunks = [];
    if (temp_values_str.includes('@')) {
      chunks = temp_values_str.split('@');
    }
    else if (temp_values_str.includes('%40')) {
      chunks = temp_values_str.split('%40');
    }
    else {
      chunks = [temp_values_str];
    }
    for (var i = 0; i < chunks.length; i++) {
      var chunk = chunks[i];
      var parsed = parse_commas(chunk);
      all_parsed.push(parsed);
    }
    return all_parsed;
  }
}

// this function updates pagination links
function update_pagination_links(parameter, flag="") {

  var updated_string = [];

  if (parameter === 'plus_library') {
    updated_string = annotations.slice().join(',');
  }
  else if (parameter === 'minus_library') {
    updated_string = negative_library.slice().join(',');
  }
  else if (parameter === 'positive') {
    updated_string = unravel(all_positive_annotations);
  }
  else if (parameter === 'negative') {
    updated_string = unravel(all_negative_annotations);
  }
  else if (parameter === 'view') {
    updated_string = flag;
  }
  else if (parameter === 'facet_names') {
    upated_string = facet_names.slice().join(',');
  }
  else if (parameter === 'facet_index') {
    upated_string = facet_index[0];
  }
  else if (parameter === 'selected_facets') {
    updated_string = selected_facets.join(',');
  }

  var pagination_divs = document.querySelectorAll('.pagination');
  for (var i = 0; i < pagination_divs.length; i++){
    var elements = pagination_divs[i].getElementsByTagName("li");
    for (var j = 0; j < elements.length; j++){
      var this_href = elements[j].childNodes[0].getAttribute("href");
      if (this_href === null) continue;
      updated_href = replace_query_string_value(this_href, parameter, updated_string);
      pagination_divs[i].getElementsByTagName("li")[j].childNodes[0].setAttribute('href', updated_href);
    }
  }
}

// this function is called upon page load to set the annotations
function set_annotations(menu_option) {

  // first, if any of the images don't load, we hide them:
  document.addEventListener("DOMContentLoaded", function(event) {
   document.querySelectorAll('img').forEach(function(img){
  	img.onerror = function(){this.style.display='none';};
   })
  });

  if (menu_option === 'menu_search') {
    document.getElementById("select_state").setAttribute("class", "selectfacet");
    document.getElementById("select_start_year").setAttribute("class", "selectfacet");
    document.getElementById("select_end_year").setAttribute("class", "selectfacet");
    document.getElementById("select_state").setAttribute("onchange", "submit_form();");
    document.getElementById("select_start_year").setAttribute("onchange", "submit_form();");
    document.getElementById("select_end_year").setAttribute("onchange", "submit_form();");
    document.getElementById("search").style.width = "100%";
    document.getElementById("search").placeholder = "Search by keyword here!";
  }
  else if (menu_option === 'menu_predict') {

    var ml_select_state = document.getElementById("ml_select_state");
    if (ml_select_state !== null) {
      ml_select_state.setAttribute("class", "selectfacet");
    }
    var ml_select_start_year = document.getElementById("ml_select_start_year");
    if (ml_select_start_year !== null) {
      ml_select_start_year.setAttribute("class", "selectfacet");
    }
    var ml_select_end_year = document.getElementById("ml_select_end_year");
    if (ml_select_end_year !== null) {
      ml_select_end_year.setAttribute("class", "selectfacet");
    }
    var ml_search = document.getElementById("ml_search");
    if (ml_search !== null) {
      ml_search.style.width = "95%";
      ml_search.placeholder = "Filter by keyword here!";
    }
  }

  // grab the parsed annotations & other data from query string
  annotations = parse_query_string("plus_library");
  negative_library = parse_query_string("minus_library");
  all_positive_annotations = parse_query_string("positive", true, true);
  all_negative_annotations = parse_query_string("negative", true, true);
  facet_names = parse_query_string("facet_names", false, false);
  facet_index = parse_query_string("facet_index");
  selected_facets = parse_query_string("selected_facets");
  date_ascending = parse_query_string("date_ascending", false, false);
  if (date_ascending.length === 0) {
    date_ascending = ["true"];
  }
  view_sort = parse_query_string("view_sort");
  if (view_sort.length === 0) {
    view_sort = [0];
  }
  // start_time = parse_query_string("start_time", false, false);
  // if (start_time.length === 0) {
  //   var d = new Date();
  //   start_time = d.getTime();
  //   query_string = replace_query_string_value(query_string, "start_time", start_time);
  //   console.log(query_string);
  // }

  // if there is no facet names or index set, we do so here
  if (facet_names.length === 0) {
    facet_names = ['Untitled'];
  }
  if (facet_index.length === 0) {
    facet_index = [0];
  }

  if (all_positive_annotations.length === 0) {
    positive_annotations = [];
  }
  else {
    positive_annotations = all_positive_annotations[facet_index[0]];

  }
  if (all_negative_annotations.length === 0) {
    negative_annotations = [];
  }
  else {
  negative_annotations = all_negative_annotations[facet_index[0]];
  }

  // we also fix URI for facet names, replacing %20 w/ space, '+' with space
  for (var i = 0; i < facet_names.length; i++) {
    facet_names[i] = decodeURI(facet_names[i]).replace(/%20/g, " ");
  }
  for (var i = 0; i < facet_names.length; i++) {
    var updated_name = '';
    for (var j = 0; j < facet_names[i].length; j++) {
      if (facet_names[i][j] === '+') {
        facet_names[i] = facet_names[i].substring(0, j) + ' ' + facet_names[i].substring(j + 1);
      }
    }
  }

  // now, we add the facets to the left panel on 'predict' page
  if (menu_option === 'menu_predict') {
    for (var i=0; i<facet_names.length; i++) {
      add_facet_to_panel(menu_option, i);
      // if it's the selected facet, we highlight the corresponding button
      if (i === facet_index[0]) {
        document.getElementById("facet".concat(i)).style.backgroundColor = "#333";
        document.getElementById("facet".concat(i)).style.color = "#f2f2f2";
      }
    }
    // we also set the facet title on load if on 'predict' view
    // and add event listener to prevent user from enteirng enter, tab, comma, or '+'
    facet_name_div = document.getElementById("facet_name");
    if (!facet_names[facet_index[0]].includes("Untitled")) {
      facet_name_div.innerHTML = facet_names[facet_index[0]];
      facet_name_div.style.color = "black";
      facet_name_div.style.borderColor = "black";
    }
    updated_facet_name = document.getElementById("facet_name").innerHTML;
    facet_name_div.addEventListener('keydown', (evt) => {
        if ((evt.keyCode === 13) || (evt.keyCode === 188) || (evt.keyCode === 9) || (evt.keyCode === 187) || (evt.keyCode === 50) || (evt.keyCode === 55) || (evt.keyCode === 191) ) {
            evt.preventDefault();
        }
    });
  }

    // if on 'search' page, we also add trained facets
    if (menu_option === 'menu_search') {

      var n_defined = 0;

      document.getElementById('innerpanel').innerHTML = "";
      for (var i=0; i<facet_names.length; i++) {
        if (!((facet_names[i].includes('Untitled')) && ((all_positive_annotations[i].length === 1 && all_positive_annotations[i][0] === annotations[0]) || all_positive_annotations[i].length === 0) && all_negative_annotations[i].length === 0)) {
          // add facet to panel as long as it's not named 'Untitled'
          add_facet_to_panel(menu_option, i);
          // if it's a selected facet on the search page, we highlight the corresponding button
          if (selected_facets.includes(i)) {
            document.getElementById("facet".concat(i)).style.backgroundColor = "#333";
            document.getElementById("facet".concat(i)).style.color = "#f2f2f2";
          }
          n_defined += 1;
        }

        // // add facet to panel
        // add_facet_to_panel(menu_option, i);
        // // if it's a selected facet on the search page, we highlight the corresponding button
        // if (selected_facets.includes(i)) {
        //   document.getElementById("facet".concat(i)).style.backgroundColor = "#333";
        //   document.getElementById("facet".concat(i)).style.color = "#f2f2f2";
        // }
        // n_defined += 1;
      }

      // if there are none, we say so
      if (n_defined === 0) {
        inner_panel = document.getElementById("innerpanel");
        inner_panel.innerHTML = "None defined yet";
        inner_panel.style.textAlign = "center";
        inner_panel.style.fontStyle = "italic";
      }

  }

  // if there are no positive annotations, we default to setting to full library
  if (positive_annotations.length === 0) {
    positive_annotations = annotations.slice(0,1);
  }

  // set initial positive & negative annotation bookkeeping of state on 'predict' page
  starting_positive_annotations = positive_annotations.slice();
  starting_negative_annotations = negative_annotations.slice();

  // now, we go through and set border for each image by ID
  for(var i=0; i<annotations.length; i++) {
    annotations[i] = +annotations[i];
    var element = document.getElementById(+annotations[i]);
    if (!(element === null)) {
      element.style.outline = "3px solid #FF0000";
    }
    var element = document.getElementById(annotations[i].toString().concat("gallery"));
    if (!(element === null)) {
      element.style.outline = "3px solid #FF0000";
    }
  }
  for(var i=0; i<positive_annotations.length; i++) {
    positive_annotations[i] = +positive_annotations[i];
    var element = document.getElementById(String(positive_annotations[i]).concat("librarypositive"));
    if (!(element === null)) {
      element.style.outline = "3px solid #00FF00";
    }
  }
  for(var i=0; i<negative_annotations.length; i++) {
    negative_annotations[i] = +negative_annotations[i];
    var element = document.getElementById(String(negative_annotations[i]).concat("librarynegative"));
    if (!(element === null)) {
      element.style.outline = "3px solid #0000FF";
    }
  }

  // update buttons on image showing it's been added
  for(var i=0; i<annotations.length; i++) {
    annotations[i] = +annotations[i];
    var librarybutton = document.getElementById(String(annotations[i]).concat("librarybutton"));
    if (!(librarybutton === null)) {
      librarybutton.style.backgroundColor = "red";
      librarybutton.style.color = "white";
      librarybutton.innerHTML = "Remove";    }
    var librarybuttonlist = document.getElementById(String(annotations[i]).concat("librarybuttonlist"));
    if (!(librarybuttonlist === null)) {
      librarybuttonlist.style.backgroundColor = "red";
      librarybuttonlist.style.color = "white";
      librarybuttonlist.innerHTML = "Remove";    }
  }
  for(var i=0; i<positive_annotations.length; i++) {
    positive_annotations[i] = +positive_annotations[i];
    var positivebutton = document.getElementById(String(positive_annotations[i]).concat("positivebutton"));
    if (!(positivebutton === null)) {
      positivebutton.style.backgroundColor = "green";
      positivebutton.style.fontSize = "12px";
      positivebutton.style.color = "white";
      positivebutton.innerHTML = "Undo +";
    }
  }
  for(var i=0; i<negative_annotations.length; i++) {
    negative_annotations[i] = +negative_annotations[i];
    var negativebutton = document.getElementById(String(negative_annotations[i]).concat("negativebutton"));
    if (!(negativebutton === null)) {
      negativebutton.style.backgroundColor = "blue";
      negativebutton.style.fontSize = "12px";
      negativebutton.style.color = "white";
      negativebutton.innerHTML = "Undo -";
    }
  }

  // we add the icons showing images have been added (star for library; + for positive annotations, etc.)
  update_star_icons("add", annotations);
  update_plus_icons("add", positive_annotations);
  update_minus_icons("add", negative_annotations);

  // now, we update the hrefs to tabs on the nav bar
  update_tabs(menu_option, "plus_library");
  update_tabs(menu_option, "positive");
  update_tabs(menu_option, "negative");

  // highlights an element in the menu based on string passed in
  highlight(menu_option);

  // corrects query string
  var corrected_query_string = "";
  corrected_query_string = replace_query_string_value(query_string, "plus_library", annotations.join(","));

  // we now grab the view type (list or gallery) from the URL
  var vars = window.location.search.substring(1).split('&');
  var view = "";
  for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      if (decodeURIComponent(pair[0]) === 'view') {
          view = pair[1];
      }
  }
  if (view === "") {
    toggle_gallery('gallery', menu_option);
  }
  else if (view === "gallery") {
    toggle_gallery('gallery', menu_option);
  }
  else {
    toggle_gallery('list', menu_option);
  }

  // add loading bar to onclick for the pagination links
  var pagination_divs = document.querySelectorAll('.pagination');
  for (var i = 0; i < pagination_divs.length; i++){
    var elements = pagination_divs[i].getElementsByTagName("li");
    for (var j = 0; j < elements.length; j++){
      var this_href = elements[j].childNodes[0].getAttribute("href");
      if (this_href === null) continue;
      else {
      pagination_divs[i].getElementsByTagName("li")[j].childNodes[0].setAttribute('onclick', 'loading()');
      }
    }
  }

  // if on the view page, set downloads
  if (menu_option === 'menu_view') {
    set_downloads();
  }

  // add loading() to all 'search' buttons
  var submit_buttons = document.getElementsByTagName('input');
  for(var i = 0; i < submit_buttons.length; i++) {
    if(submit_buttons[i].type === 'submit') {
      submit_buttons[i].setAttribute("onclick", "loading()");
    }
  }

  // lastly, we highlight the occurrence of the keyword search in the OCR
  ocr_divs = document.getElementsByClassName("ocr");
  search_element = null;
  if (menu_option === 'menu_search') {
    search_element = document.getElementById("search");
  }
  if (menu_option === 'menu_predict') {
    search_element = document.getElementById("ml_search");
  }

  if (search_element != null) {
    search_string = search_element.value;
    if (search_string.length > 0) {
    for (var i = 0; i < ocr_divs.length; i++){
      text = ocr_divs[i].innerHTML;
      index = ocr_divs[i].innerHTML.toLowerCase().indexOf(search_string);
      if (index >= 0) {
         text = text.substring(0,index) + "<span class='ocr_highlight'>" + text.substring(index,index+search_string.length) + "</span>" + text.substring(index+search_string.length,text.length);
         ocr_divs[i].innerHTML = text;
       }
      }
    }
  }

  // if we are on the 'about' page with no search done yet, we manually set pages
  if ((window.location.pathname === '/search/about') && (window.location.search === '')) {
    document.getElementById("menu_search").setAttribute("href", "/search");
    document.getElementById("menu_predict").setAttribute("onclick", "return direct_to_search();");
    document.getElementById("menu_view").setAttribute("onclick", "return direct_to_search();");
  }

  if (menu_option === 'menu_search') {

    var sort_div = document.getElementById("sort");

    if (!(sort_div === null)) {

      sort_div.innerHTML = "Sorting by: ";
      var select = document.createElement('select');
      var options = ["date, oldest to newest", "date, newest to oldest"];

      if (JSON.stringify(facet_names) !== JSON.stringify(["Untitled"])) {
        options = options.concat(facet_names);
      }
      for(var i = 0; i < options.length; i++) {
          var opt = options[i];
          var el = document.createElement("option");
          el.textContent = opt;
          el.value = opt;
          select.appendChild(el);
      }
      sort_div.appendChild(select);
      if (selected_facets.length === 0) {
        if (date_ascending[0] === 'true') {
        select.value = "date, oldest to newest";
        }
        else if (date_ascending[0] === 'false') {
          select.value = "date, newest to oldest";
        }
      }
      else {
        select.value = facet_names[selected_facets[0]];
      }
      select.setAttribute("onchange","update_search_sort();");
      select.setAttribute("id", "selectsort");
    }
  }

  if (menu_option === 'menu_view') {

    var sort_div = document.getElementById("sort");
    sort_div.innerHTML = "Sorting by: ";
    var select = document.createElement('select');
    select.style.marginRight = "15px";
    select.style.witdh = "calc(100%-15px)";
    var options = ["order added", "date, oldest to newest", "date, newest to oldest"];

    for(var i = 0; i < options.length; i++) {
        var opt = options[i];
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        select.appendChild(el);
      }
    sort_div.appendChild(select);

    if (view_sort[0] === 0) {
    select.value = "order added";
    }
    else if (view_sort[0] === 1) {
      select.value = "date, oldest to newest";
    }
    else if (view_sort[0] === 2) {
      select.value = "date, newest to oldest";
    }
    select.setAttribute("onchange","update_view_sort();");
    select.setAttribute("id", "selectsort");
  }

}


function toggle_predict_positive_image(id, boolean_highlight) {
  if (!boolean_highlight) {
    // remove the border
    element = document.getElementById(id);
    if (!(element === null)) {
    element.style.outline = "0";
    }
    elementgallery = document.getElementById(id.toString().concat("gallery"));
    if (!(elementgallery === null)) {
    elementgallery.style.outline = "0";
    }

    var plusbutton = document.getElementById(String(id).concat("plusbutton"));
    if (!(plusbutton === null)) {
      plusbutton.style.backgroundColor = "white";
      plusbutton.style.opacity = "0.85";
      plusbutton.innerHTML = "+";
      plusbutton.style.top = "0%";
      plusbutton.style.height = "50%";
    }
    var minusbutton = document.getElementById(String(id).concat("minusbutton"));
    if (!(minusbutton === null)) {
      // minus.style.display = "block";
      minusbutton.style.zIndex = "2";
      minusbutton.style.top = "50%";
      minusbutton.style.height = "50%";
      minusbutton.style.opacity = "0.85";
    }

    var plus = document.getElementById(String(id).concat("plus"));
    if (!(plus === null)) {
    plus.style.display = "none";
    }
  }

  else {
    if (!(document.getElementById(id.toString().concat("gallery")) === null)) {
    document.getElementById(id.toString().concat("gallery")).style.outline = "3px solid #00FF00";
    }

    // update button for saving to library
    var plusbutton = document.getElementById(String(id).concat("plusbutton"));
    if (!(plusbutton === null)) {
      plusbutton.style.backgroundColor = "green";
      plusbutton.style.color = "white";
      plusbutton.style.opacity = "1.0";
      plusbutton.innerHTML = "Undo +";
      plusbutton.style.top = "20%";
      plusbutton.style.height = "30px";
      document.getElementById(String(id).concat("gallery")).onclick = plusbutton.onclick;
    }
    var minusbutton = document.getElementById(String(id).concat("minusbutton"));
    if (!(minusbutton === null)) {
    minusbutton.style.zIndex = "-1";
    }
  }
}


function toggle_predict_negative_image(id, boolean_highlight) {
  if (!boolean_highlight) {
    // remove the border
    element = document.getElementById(id);
    if (!(element === null)) {
    element.style.outline = "0";
    }
    elementgallery = document.getElementById(id.toString().concat("gallery"));
    if (!(elementgallery === null)) {
    elementgallery.style.outline = "0";
    }

    // update button for saving to library
    var plusbutton = document.getElementById(String(id).concat("plusbutton"));
    if (!(plusbutton === null)) {
    // plusbutton.style.display = "block";
    plusbutton.style.zIndex = "2";
    plusbutton.style.top = "0%";
    plusbutton.style.height = "50%";
    plusbutton.style.opacity = "0.85";
    }
    var minusbutton = document.getElementById(String(id).concat("minusbutton"));
    if (!(minusbutton === null)) {
    minusbutton.style.backgroundColor = "white";
    minusbutton.style.display = "0.85";
    minusbutton.innerHTML = "-";
    minusbutton.style.top = "50%";
    minusbutton.style.height = "50%";
    }

    // update minus
    var minus = document.getElementById(String(id).concat("minus"));
    if (!(minus === null)) {
    minus.style.display = "none";
    }
  }

  else {
    if (!(document.getElementById(id.toString().concat("gallery")) === null)) {
    document.getElementById(id.toString().concat("gallery")).style.outline = "3px solid #0000FF";
    }

    // update button for saving to library
    var plusbutton = document.getElementById(String(id).concat("plusbutton"));
    if (!(plusbutton === null)) {
    // plusbutton.style.display = "none";
    plusbutton.style.zIndex = "-1";
    }
    var minusbutton = document.getElementById(String(id).concat("minusbutton"));
    if (!(minusbutton === null)) {
    minusbutton.style.backgroundColor = "blue";
    minusbutton.style.color = "white";
    minusbutton.innerHTML = "Undo -";
    minusbutton.style.top = "60%";
    minusbutton.style.height = "30px";
    document.getElementById(String(id).concat("gallery")).onclick = minusbutton.onclick;
    minusbutton.style.zIndex = "2";
    minusbutton.style.opacity = "1.0";
    }

    // update minus
    var minus = document.getElementById(String(id).concat("minus"));
    if (!(minus === null)) {
    minus.style.display = "block";
    minus.style.width = "30px";
    }
  }
}



// this function updates the annotations whenever an image is clicked
function update_positive_library(id, menu_option) {

  // saves pagination divs for updating URLs in if/else
  var pagination_divs = document.querySelectorAll('.pagination');

  // if the id is in the list,
  if (annotations.includes(id)) {

    // if the id is being used in training a facet learner,
    // we send an alert to the user saying it can't be removed
    if ((menu_option === 'menu_view') || (menu_option === 'menu_search')) {
      var flattened_all_positive_annotations = Array.prototype.concat.apply([], all_positive_annotations);
      if (flattened_all_positive_annotations.includes(id)) {
        window.alert("You can't remove this image from your collection because it is being used to train one of your AI navigators!");
        return false;
      }
    }

    // then we remove from annotations
    position = annotations.indexOf(id);
    if ( ~position ) annotations.splice(position, 1);

    // remove the border
    element = document.getElementById(id);
    if (!(element === null)) {
    element.style.outline = "0";
    }
    elementgallery = document.getElementById(id.toString().concat("gallery"));
    if (!(elementgallery === null)) {
    elementgallery.style.outline = "0";
    }

    // now, we update the pagination links to remove the annotation
    update_pagination_links("plus_library");

    if (menu_option === 'menu_predict') {
      var plusbutton = document.getElementById(String(id).concat("plusbutton"));
      if (!(plusbutton === null)) {
        plusbutton.style.backgroundColor = "white";
        plusbutton.style.opacity = "0.85";
        plusbutton.innerHTML = "add +";
        plusbutton.style.top = "0%";
        plusbutton.style.height = "50%";
      }
      var minusbutton = document.getElementById(String(id).concat("minusbutton"));
      if (!(minusbutton === null)) {
        // minus.style.display = "block";
        minusbutton.style.zIndex = "2";
        minusbutton.style.top = "50%";
        minusbutton.style.height = "50%";
        minusbutton.style.opacity = "0.85";
      }

      var plus = document.getElementById(String(id).concat("plus"));
      if (!(plus === null)) {
      plus.style.display = "none";
      }
    }
    else {
      // update button for saving to library
      var librarybutton = document.getElementById(String(id).concat("librarybutton"));
      if (!(librarybutton === null)) {
      librarybutton.style.backgroundColor = "white";
      librarybutton.style.color = "black";
      librarybutton.innerHTML = "+ Collection";
      }
      var librarybuttonlist = document.getElementById(String(id).concat("librarybuttonlist"));
      if (!(librarybuttonlist === null)) {
      librarybuttonlist.style.backgroundColor = "white";
      librarybuttonlist.style.color= "black";
      librarybuttonlist.innerHTML = "+ Collection";
      }

      // remove star icon
      update_star_icons("remove", [id]);
    }

  } else {

    // if the id is not in the list, we add
    annotations.push(id);

    if (menu_option === 'menu_predict') {
      if (!(document.getElementById(id.toString().concat("gallery")) === null)) {
      document.getElementById(id.toString().concat("gallery")).style.outline = "3px solid #00FF00";
      }
    }
    else {
      if (!(document.getElementById(id) === null)) {
      document.getElementById(id).style.outline = "3px solid #FF0000";
      }
      if (!(document.getElementById(id.toString().concat("gallery")) === null)) {
      document.getElementById(id.toString().concat("gallery")).style.outline = "3px solid #FF0000";
      }
    }

    // now, we update the pagination links to include the annotation
    update_pagination_links("plus_library");

    if (menu_option === 'menu_predict') {
      // update button for saving to library
      var plusbutton = document.getElementById(String(id).concat("plusbutton"));
      if (!(plusbutton === null)) {
        plusbutton.style.backgroundColor = "green";
        plusbutton.style.color = "white";
        plusbutton.style.opacity = "1.0";
        plusbutton.innerHTML = "Undo +";
        plusbutton.style.top = "20%";
        plusbutton.style.height = "30px";
        document.getElementById(String(id).concat("gallery")).onclick = plusbutton.onclick;
      }
      var minusbutton = document.getElementById(String(id).concat("minusbutton"));
      if (!(minusbutton === null)) {
      minusbutton.style.zIndex = "-1";
      }
    }
    else {

      // update button for saving to library
      var librarybutton = document.getElementById(String(id).concat("librarybutton"));
      if (!(librarybutton === null)) {
      librarybutton.style.backgroundColor = "red";
      librarybutton.style.color = "white";
      librarybutton.innerHTML = "Remove";
      }
      var librarybuttonlist = document.getElementById(String(id).concat("librarybuttonlist"));
      if (!(librarybuttonlist === null)) {
      librarybuttonlist.style.backgroundColor = "red";
      librarybuttonlist.style.color = "white";
      librarybuttonlist.innerHTML = "Remove";
      }

      // add star icon
      update_star_icons("add", [id]);
    }
  }

  // if the annotations bar exists, we update it (for search form)
  var plus_library_bar = document.getElementById("plus_library_bar");
  if (!(plus_library_bar === null)) {
  // add the annotations to the query bar to be returned w/ "search"
  document.getElementById("plus_library_bar").children[0].value = annotations;
  }

  // now, we update the hrefs to tabs on the nav bar
  update_tabs(menu_option, "plus_library");

  // correct the page references
  correct_page_references(menu_option);

  // if on the view page, set downloads
  if (menu_option === 'menu_view') {
    set_downloads();
  }

  var positiveimagecontainergallery = document.getElementById(String(id).concat("positiveimagecontainergallery"));
  if (!(positiveimagecontainergallery === null)) {
    positiveimagecontainergallery.style.display = 'block';
  }

  var image_librarypositive = document.getElementById(String(id).concat("librarypositive"));
  // here, we add the image to the left-hand panel if it's not there already
  if ((image_librarypositive === null) && (menu_option === 'menu_predict')) {

    // create image
    var image = document.createElement("img");
    image.id = String(id).concat("librarypositive");
    image.width = "200";
    image.src = document.getElementById(String(id).concat("gallery")).src;
    image.setAttribute("onclick", "update_annotations(".concat(id).concat(",  'menu_predict', 'positive')"));

    // create plus
    var plus = document.createElement("img");
    plus.src = "/static/plus.png";
    plus.id = String(id).concat("plus");
    plus.setAttribute("class", "saved");

    // create 'addtolibrary' button
    var addtolibrarybutton = document.createElement("a");
    addtolibrarybutton.id = String(id).concat("positivebutton");
    addtolibrarybutton.setAttribute("class", "addtolibrarybutton");
    addtolibrarybutton.style.fontSize = "12px";
    addtolibrarybutton.setAttribute("onclick", "update_annotations(".concat(String(id)).concat(", 'menu_predict', 'positive')"));
    addtolibrarybutton.innerHTML = "Add +";

    // create image container
    var imagecontainer = document.createElement('div');
    imagecontainer.setAttribute("class", "imagecontainer");
    imagecontainer.id = String(id).concat("positiveimagecontainergallery");

    // add image, plus, button to imagecontainer
    imagecontainer.appendChild(image);
    imagecontainer.appendChild(plus);
    imagecontainer.appendChild(addtolibrarybutton);

    // add imagecontainer to positive images panel on LHS
    var positive_images_wrapper = document.getElementById("positive-images-wrapper");
    if (!(positive_images_wrapper === null)) {
      positive_images_wrapper.appendChild(imagecontainer);
    }
  }

  // toggle off negative image duplicate if it exists (bad to have image in both + and - views)
  var negativeimagecontainergallery = document.getElementById(String(id).concat("negativeimagecontainergallery"));
  if (!(negativeimagecontainergallery === null)) {
    negativeimagecontainergallery.style.display = 'none';
  }

  // remove image from negative library here as well if it's there
  if (negative_library.includes(id)) {
    position = negative_library.indexOf(id);
    if ( ~position ) negative_library.splice(position, 1);
  }

  // we update positive annotations
  // (if removing from + libary on predict page, remove from + annotations)
  // (if adding to + library on predict page, add to + annotations)
  if (menu_option === 'menu_predict') {
    update_annotations(id, menu_option, "positive");
  }

  // we update the tune button (highlight or not depending on whether new selections have been made)
  update_tune_button(menu_option);

  return true;
}

// this function updates the annotations whenever an image is clicked
function update_negative_library(id, menu_option) {

  // saves pagination divs for updating URLs in if/else
  var pagination_divs = document.querySelectorAll('.pagination');

  // if the id is in the list, we remove
  if (negative_library.includes(id)) {
    position = negative_library.indexOf(id);
    if ( ~position ) negative_library.splice(position, 1);

    // remove the border
    elementgallery = document.getElementById(id.toString().concat("gallery"));
    if (!(elementgallery === null)) {
    elementgallery.style.outline = "0";
    }

    // now, we update the pagination links to remove the annotation
    update_pagination_links("minus_library");

    // update button for saving to library
    var plusbutton = document.getElementById(String(id).concat("plusbutton"));
    if (!(plusbutton === null)) {
    // plusbutton.style.display = "block";
    plusbutton.style.zIndex = "2";
    plusbutton.style.top = "0%";
    plusbutton.style.height = "50%";
    plusbutton.style.opacity = "0.85";
    }
    var minusbutton = document.getElementById(String(id).concat("minusbutton"));
    if (!(minusbutton === null)) {
    minusbutton.style.backgroundColor = "white";
    minusbutton.style.display = "0.85";
    minusbutton.innerHTML = "-";
    minusbutton.style.top = "50%";
    minusbutton.style.height = "50%";
    }

    // update minus
    var minus = document.getElementById(String(id).concat("minus"));
    if (!(minus === null)) {
    minus.style.display = "none";
    }

  } else {

    // if the id is not in the list, we add
    negative_library.push(id);

    if (!(document.getElementById(id.toString().concat("gallery")) === null)) {
    document.getElementById(id.toString().concat("gallery")).style.outline = "3px solid #0000FF";
    }

    // now, we update the pagination links to include the annotation
    update_pagination_links("minus_library");

    // update button for saving to library
    var plusbutton = document.getElementById(String(id).concat("plusbutton"));
    if (!(plusbutton === null)) {
    // plusbutton.style.display = "none";
    plusbutton.style.zIndex = "-1";
    }
    var minusbutton = document.getElementById(String(id).concat("minusbutton"));
    if (!(minusbutton === null)) {
    minusbutton.style.backgroundColor = "blue";
    minusbutton.style.color = "white";
    minusbutton.innerHTML = "Undo -";
    minusbutton.style.top = "60%";
    minusbutton.style.height = "30px";
    document.getElementById(String(id).concat("gallery")).onclick = minusbutton.onclick;
    minusbutton.style.zIndex = "2";
    minusbutton.style.opacity = "1.0";
    }

    // update minus
    var minus = document.getElementById(String(id).concat("minus"));
    if (!(minus === null)) {
    minus.style.display = "block";
    minus.style.width = "30px";
    }
  }

  // if the minus library bar exists, we update it (for search form)
  var minus_library_bar = document.getElementById("minus_library_bar");
  if (!(minus_library_bar === null)) {
  // add the minus annotations to the query bar to be returned w/ "search"
  minus_library_bar.children[0].value = negative_library;
  }

  // now, we update the hrefs to tabs on the nav bar
  update_tabs(menu_option, "minus_library");

  // correct the page references
  correct_page_references(menu_option);

  // if on the view page, set downloads
  if (menu_option === 'menu_view') {
    set_downloads();
  }

  var negativeimagecontainergallery = document.getElementById(String(id).concat("negativeimagecontainergallery"));
  if (!(negativeimagecontainergallery === null)) {
    negativeimagecontainergallery.style.display = 'block';
  }

  // here, we add the image to the left-hand panel if it's not there already
  var image_librarynegative = document.getElementById(String(id).concat("librarynegative"));
  if ((image_librarynegative === null) && (menu_option === 'menu_predict')) {

    // create image
    var image = document.createElement("img");
    image.id = String(id).concat("librarynegative");
    image.width = "200";
    image.src = document.getElementById(String(id).concat("gallery")).src;
    image.setAttribute("onclick", "update_annotations(".concat(id).concat(",  'menu_predict', 'negative')"));

    // create minus
    var minus = document.createElement("img");
    minus.src = "/static/minus.png";
    minus.id = String(id).concat("minus");
    minus.setAttribute("class", "saved");

    // create 'addtolibrary' button
    var addtolibrarybutton = document.createElement("a");
    addtolibrarybutton.id = String(id).concat("negativebutton");
    addtolibrarybutton.setAttribute("class", "addtolibrarybutton");
    addtolibrarybutton.style.fontSize = "12px";
    addtolibrarybutton.setAttribute("onclick", "update_annotations(".concat(String(id)).concat(", 'menu_predict', 'negative')"));
    addtolibrarybutton.innerHTML = "Add -";

    // create image container
    var imagecontainer = document.createElement('div');
    imagecontainer.setAttribute("class", "imagecontainer");
    imagecontainer.id = String(id).concat("negativeimagecontainergallery");

    // add image, plus, button to imagecontainer
    imagecontainer.appendChild(image);
    imagecontainer.appendChild(minus);
    imagecontainer.appendChild(addtolibrarybutton);

    // add imagecontainer to positive images panel on LHS
    document.getElementById("negative-images-wrapper").appendChild(imagecontainer);
  }

  var positiveimagecontainergallery = document.getElementById(String(id).concat("positiveimagecontainergallery"));
  if (!(positiveimagecontainergallery === null)) {
    positiveimagecontainergallery.style.display = 'none';
  }

  // remove image from positive library here as well if it's there
  if (annotations.includes(id)) {
    position = annotations.indexOf(id);
    if ( ~position ) annotations.splice(position, 1);
  }

  // we update negative annotations
  // (if removing from - libary on predict page, remove from - annotations)
  // (if adding to - library on predict page, add to - annotations)
  if (menu_option === 'menu_predict') {
    update_annotations(id, menu_option, "negative");
  }

  // we update the tune button (highlight or not depending on whether new selections have been made)
  update_tune_button(menu_option);

}


// function that updates all of the query strings with corrected query string
function correct_query_string(corrected_query_string, menu_option) {

  var view_button = document.getElementById('menu_view');
  var view_updated = "/search/view".concat(corrected_query_string);

  var search_button = document.getElementById('menu_search');
  var search_updated = "/search".concat(corrected_query_string);

  var predict_button = document.getElementById('menu_predict');
  var predict_updated =  "/search/predict".concat(corrected_query_string);

  var about_button = document.getElementById('menu_about');
  var about_updated =  "/search/about".concat(corrected_query_string);

  if (menu_option === 'menu_search') {
    view_button.setAttribute("href", view_updated);
    predict_button.setAttribute("href", predict_updated);
    about_button.setAttribute("href", about_updated);
    search_button.setAttribute("href", search_updated);
    var edit_facets_button = document.getElementById('editfacetsbutton');
    if (!(edit_facets_button === null)) {
      edit_facets_button.setAttribute('href', predict_button.getAttribute('href'));
    }
  }
  else {
    view_button.setAttribute("href", view_updated);
    predict_button.setAttribute("href", predict_updated);
    about_button.setAttribute("href", about_updated);
    search_button.setAttribute("href", search_updated);
  }

  // we don't update if on the about page
  if (!(menu_option==='menu_about')) {

    // updated 'update' button on view page with new selections
    var update_button = document.getElementById('updatebutton');

    if (menu_option === 'menu_view' & update_button != null) {
      update_button.setAttribute("href", view_button.getAttribute('href'));

      // we need to handle the edge case that the user removes all annotations on a given page,
      // in which case we must decrement the page number too
      var n_annotations = annotations.length;
      var query_variables = update_button.getAttribute('href').split('&');
      var page_number = null;
      for (var i = 0; i < query_variables.length; i++){
        if (query_variables[i].substring(0,5) === 'page=') {
          page_number = parseInt(query_variables[i].substring(5));
        }
      }

      // we only need to do this if beyond page 1 (if we go to 0 annotations, that's okay! then no results)
      if ((page_number != null) && (page_number > 1)) {
        update_button.href = replace_query_string_value(update_button.href, "page", (page_number-1).toString());
        view_button.href = replace_query_string_value(view_button.href, "page", (page_number-1).toString());
      }
    }
    else if (menu_option === 'menu_search' && !(update_button === null)) {
      update_button.setAttribute("href", search_button.getAttribute('href'));
    }
    else if (menu_option === 'menu_predict' && !(update_button === null)) {
      // we want to reset the page to 1 if we re-train
      update_button.setAttribute("href", predict_button.getAttribute('href'));
      update_button.href = replace_query_string_value(update_button.href, "page", "1");
    }
  }
}

// function that handles the pagination linking across view, search, predict, about
function correct_page_references(menu_option) {

  var view_button = document.getElementById('menu_view');
  var search_button = document.getElementById('menu_search');
  var predict_button = document.getElementById('menu_predict');
  var about_button = document.getElementById('menu_about');

  if (menu_option === 'menu_search') {
    view_button.href = replace_query_string_value(view_button.href, "page", "1");
    predict_button.href = replace_query_string_value(predict_button.href, "page", "1");
    about_button.href = replace_query_string_value(about_button.href, "page", "1");

    view_button.href = replace_query_string_value(view_button.href, "select_state", "All");
    view_button.href = replace_query_string_value(view_button.href, "select_start_year", "1900");
    view_button.href = replace_query_string_value(view_button.href, "select_end_year", "1963");
    view_button.href = replace_query_string_value(view_button.href, "search", "");
    view_button.href = replace_query_string_value(view_button.href, "selected_facets", "");
    predict_button.href = replace_query_string_value(predict_button.href, "select_state", "All");
    predict_button.href = replace_query_string_value(predict_button.href, "select_start_year", "1900");
    predict_button.href = replace_query_string_value(predict_button.href, "select_end_year", "1963");
    predict_button.href = replace_query_string_value(predict_button.href, "search", "");
    predict_button.href = replace_query_string_value(predict_button.href, "selected_facets", "");
    about_button.href = replace_query_string_value(about_button.href, "select_state", "All");
    about_button.href = replace_query_string_value(about_button.href, "select_start_year", "1900");
    about_button.href = replace_query_string_value(about_button.href, "select_end_year", "1963");
    about_button.href = replace_query_string_value(about_button.href, "search", "");
    about_button.href = replace_query_string_value(about_button.href, "selected_facets", "");
  }
  // here we not only update pagination but also reset the 'predict' filters so they don't persist when returning
  else if (menu_option === 'menu_predict') {
    view_button.href = replace_query_string_value(view_button.href, "page", "1");
    search_button.href = replace_query_string_value(search_button.href, "page", "1");
    about_button.href = replace_query_string_value(about_button.href, "page", "1");

    view_button.href = replace_query_string_value(view_button.href, "ml_select_state", "All");
    view_button.href = replace_query_string_value(view_button.href, "ml_select_start_year", "1900");
    view_button.href = replace_query_string_value(view_button.href, "ml_select_end_year", "1963");
    view_button.href = replace_query_string_value(view_button.href, "ml_search", "");
    search_button.href = replace_query_string_value(search_button.href, "ml_select_state", "All");
    search_button.href = replace_query_string_value(search_button.href, "ml_select_start_year", "1900");
    search_button.href = replace_query_string_value(search_button.href, "ml_select_end_year", "1963");
    search_button.href = replace_query_string_value(search_button.href, "ml_search", "");
    about_button.href = replace_query_string_value(about_button.href, "ml_select_state", "All");
    about_button.href = replace_query_string_value(about_button.href, "ml_select_start_year", "1900");
    about_button.href = replace_query_string_value(about_button.href, "ml_select_end_year", "1963");
    about_button.href = replace_query_string_value(about_button.href, "ml_search", "");
  }
  else if (menu_option === 'menu_view') {
    predict_button.href = replace_query_string_value(predict_button.href, "page", "1");
    about_button.href = replace_query_string_value(about_button.href, "page", "1");
    search_button.href = replace_query_string_value(search_button.href, "page", "1");
  }
  else if (menu_option === 'menu_about') {
    predict_button.href = replace_query_string_value(predict_button.href, "page", "1");
    search_button.href = replace_query_string_value(search_button.href, "page", "1");
    view_button.href = replace_query_string_value(view_button.href, "page", "1");
  }
}

// toggle gallery vs. list view
function toggle_gallery(view_string, menu_option){

  // we don't update if on the about page or on view page with no annotations
  if (!(menu_option==='menu_about') && !(menu_option === 'menu_view' && annotations.length === 0)) {

    if (view_string === 'gallery' && !(document.getElementById("imagelist") === null)) {
      update_view_for_tabs('gallery', menu_option);
      document.getElementById("imagelist").style.display = "none";
      // document.getElementById("listbutton").style.background = '#ddd';
      document.getElementById("listbutton").style.backgroundColor = 'rgb(221,221,221,1.0)';
      document.getElementById("listbutton").style.color = 'black';
      if (!(document.getElementById("images-wrapper") === null)) {
        document.getElementById("images-wrapper").style.display = "block";
      }
      else if (!(document.getElementById("predict-images-wrapper") === null)) {
        document.getElementById("predict-images-wrapper").style.display = "block";
      }
      // document.getElementById("gallerybutton").style.background = '#333';
      document.getElementById("gallerybutton").style.backgroundColor = 'rgb(51,51,51,1.0)';
      document.getElementById("gallerybutton").style.color = '#f2f2f2';
    }

    if (view_string === 'list' && !(document.getElementById("imagelist") === null)) {
      update_view_for_tabs('list', menu_option);
      document.getElementById("imagelist").style.display = "block";
      // document.getElementById("listbutton").style.background = '#333';
      document.getElementById("listbutton").style.backgroundColor = 'rgb(51,51,51,1.0)';
      document.getElementById("listbutton").style.color = '#f2f2f2';
      if (!(document.getElementById("images-wrapper") === null)) {
        document.getElementById("images-wrapper").style.display = "none";
      }
      else if (!(document.getElementById("predict-images-wrapper") === null)) {
        document.getElementById("predict-images-wrapper").style.display = "none";
      }
      // document.getElementById("gallerybutton").style.background = '#ddd';
      document.getElementById("gallerybutton").style.backgroundColor = 'rgb(221,221,221,1.0)';
      document.getElementById("gallerybutton").style.color = 'black';
    }
  }

  // if the annotations bar exists, we update it (for search form)
  var view_bar = document.getElementById("view_bar");
  if (!(view_bar === null)) {
  document.getElementById("view_bar").children[0].value = view_string;
  }

  // fix pagination retention across view, search, predict, about
  correct_page_references(menu_option);
}

function unravel(list_of_lists) {
  var list_of_strings = [];
  for(var i=0; i<list_of_lists.length; i++) {
    concat = list_of_lists[i].join(",");
    list_of_strings.push(list_of_lists[i].join(","));
  }
  var unraveled = list_of_strings.join("@");
  return unraveled;
}

function update_tabs(menu_option, annotation_type) {

  relevant_string = null;

  if (annotation_type === "plus_library") {
    relevant_string = annotations.join(",");
  }
  else if (annotation_type === "minus_library") {
    relevant_string = negative_library.join(",");
  }
  else if (annotation_type === "positive") {
    relevant_string = unravel(all_positive_annotations);
  }
  else if (annotation_type === "negative") {
    relevant_string = unravel(all_negative_annotations);
  }
  else if (annotation_type === "facet_names") {
    relevant_string = facet_names.join(",").replace(/ /g, "%20").split('&nbsp;').join("");
  }
  else if (annotation_type === "facet_index") {
    relevant_string = facet_index[0];
  }
  else if (annotation_type === 'selected_facets') {
    relevant_string = selected_facets.join(",");
  }

  // we update the URL so it includes the relevant parameters if we go from search to view
  // update query string here
  query_string = replace_query_string_value(query_string, annotation_type, relevant_string);

  correct_query_string(query_string, menu_option);
}

function update_view_for_tabs(view_str, menu_option) {
  // grab updated query string
  var updated_query_string = replace_query_string_value(query_string, "view", view_str);
  // update the menu tabs
  correct_query_string(updated_query_string, menu_option);
  // lastly, we correct the pagination links to reflect new view
  update_pagination_links("view", view_str);

}

// when a search suggestion is clicked, this function re-generates search w/ the term
function search_suggestion(search_term, menu_option){
  if (positive_annotations.length === 0) {
    window.alert("You must select at least one positive (+) example first!");
    return false;
  }
  else {
    loading();
    if (menu_option === 'menu_search') {
    var search = document.getElementById("search");
    search.value = search_term;
    document.getElementById("searchform").submit();
    }
    else if (menu_option === 'menu_predict') {
      var search = document.getElementById("ml_search");
      search.value = search_term;
      document.getElementById("ml_select_state").value = "All";
      document.getElementById("ml_select_start_year").value = "1900";
      document.getElementById("ml_select_end_year").value = "1963";
      document.getElementById("facet_names").value = facet_names.join(",").replace(/ /g, "%20").split('&nbsp;').join("");
      document.getElementById("facet_index").value = facet_index[0];
      document.getElementById("mlsearchform").submit();
    }
  }
}

// updates star icons (show or hide)
function update_star_icons(update, ids) {
  for(var i=0; i<ids.length; i++) {
    ids[i] = +ids[i];
    // update button for saving to library
    var starlist = document.getElementById(String(ids[i]).concat("starlist"));
    if (!(starlist === null)) {
      if (update === 'add') {
      starlist.style.display = "block";
      starlist.style.width = "30px";
      }
      else if (update === 'remove') {
        starlist.style.display = "none";
      }
    }
    var star = document.getElementById(String(ids[i]).concat("star"));
    if (!(star === null)) {
      if (update === 'add') {
      star.style.display = "block";
      star.style.width = "30px";
      }
      else if (update === 'remove') {
        star.style.display = "none";
      }
    }
  }
}

// updates plus icons (show or hide)
function update_plus_icons(update, ids) {
  for(var i=0; i<ids.length; i++) {
    ids[i] = +ids[i];
    var plus = document.getElementById(String(ids[i]).concat("plus"));
    if (!(plus === null)) {
      if (update === 'add') {
      plus.style.display = "block";
      plus.style.width = "30px";
      }
      else if (update === 'remove') {
        plus.style.display = "none";
      }
    }
  }
}

// updates minus icons (show or hide)
function update_minus_icons(update, ids) {
  for(var i=0; i<ids.length; i++) {
    ids[i] = +ids[i];
    var minus = document.getElementById(String(ids[i]).concat("minus"));
    if (!(minus === null)) {
      if (update === 'add') {
      minus.style.display = "block";
      minus.style.width = "30px";
      }
      else if (update === 'remove') {
        minus.style.display = "none";
      }
    }
  }
}

// sets sharing URL when share button is clicked
function share(){
  var temp = document.createElement('input');
  document.body.appendChild(temp);
  temp.value = window.location.href.split('?')[0].concat(query_string);
  temp.select();
  document.execCommand('copy');
  document.body.removeChild(temp);
  window.alert("The app just copied a URL link to your clipboard (use CTRL+v to paste it). Use this link to save your progress or share what you've found!");
}

// sets citation when clicking the 'cite' button
function cite(url){
  window.prompt("Copy this citation to clipboard: Ctrl+C, Enter", url.concat(" from the Library of Congress, Newspaper Navigator Dataset: Extracted Visual Content from Chronicling America"));
}

// adds loading message when generating search results & ML predictions
function loading(){
  var modal = document.getElementById("modal");
  modal.style.display = "block";
}

// adds loading message when generating search results & ML predictions
function show_more_info(id){
  var modal = document.getElementById(id);
  modal.style.display = "block";
}

// closes the modal window when the 'X' is clicked
function close_more_info(id){
  var modal = document.getElementById(id);
  modal.style.display = "none";
}

// sets the API routes for the download buttons on the 'vew' page
function set_downloads(){
  var download_metadata_button = document.getElementById('downloadmetadata');
  if (!(download_metadata_button === null)) {
    download_metadata_button.setAttribute('href', '/search/download_metadata?plus_library='.concat(annotations.join(',')));
  }
}

// adds alert that the user must select at least one image before training
function verify_prediction() {
  if (annotations.length === 0) {
    window.alert("You must add at least one photo to your collection on the 'search' page first!");
    return false;
  }
  loading();
  return true;
}

// adds alert that the user must select at least one image before training
function verify_prediction_on_search_page() {
  if (annotations.length === 0) {
    window.alert("You must add at least one photo to your collection on this page first!");
    return false;
  }
  loading();
  return true;
}

// adds alert that the user must select at least one image before training
function verify_prediction_on_predict_page() {
  if (positive_annotations.length === 0) {
    window.alert("You must select at least one positive (+) example for the current facet before updating!");
    return false;
  }
  loading();
  return true;
}

// resets search form filters for ML
function ml_reset() {
  if (positive_annotations.length === 0) {
    window.alert("You must select at least one positive (+) example first!");
    return false;
  }
  else {
    loading();
    var ml_select_state = document.getElementById("ml_select_state");
    if (!(ml_select_state === null)) {
      ml_select_state.value = "All";
    }
    var ml_select_start_year = document.getElementById("ml_select_start_year");
    if (!(ml_select_start_year === null)) {
      ml_select_start_year.value = "1900";
    }
    var ml_select_end_year = document.getElementById("ml_select_end_year");
    if (!(ml_select_end_year === null)) {
      ml_select_end_year.value = "1963";
    }
    var ml_search = document.getElementById("ml_search");
    if (!(ml_search === null)) {
      ml_search.value = "";
    }

    document.getElementById("facet_names").value = facet_names.join(",").replace(/ /g, "%20").split('&nbsp;').join("");
    document.getElementById("facet_index").value = facet_index[0];
    document.getElementById("selected_facets").value = "";
    document.getElementById("positive").value = unravel(all_positive_annotations);
    document.getElementById("negative").value = unravel(all_negative_annotations);
    document.getElementById("plus_library").value = annotations.join(",");
    document.getElementById("minus_library").value = negative_library.join(",");
    document.getElementById("date_ascending").value = "true";
    document.getElementById("mlsearchform").submit();
  }
}

// highlights an element in the menu based on string passed in
function highlight(menu_option) {
  var menu_option = document.getElementById(menu_option);
  menu_option.style.background = '#ddd';
  menu_option.style.color = 'black';
}


// resets search form filters
function reset() {
  loading();
  document.getElementById("select_state").value = "All";
  document.getElementById("select_start_year").value = "1900";
  document.getElementById("select_end_year").value = "1963";
  document.getElementById("search").value = "";
  document.getElementById("selected_facets").value = "";
  document.getElementById("date_ascending").value = "true";
  document.getElementById("searchform").submit();
}

// this function updates the +/- annotations when a photo is added
// or removed on the 'predict' page
function update_annotations(id, menu_option, annotation_type) {

  // grab relevant annotations baed on annotation type
  var relevant_annotations = [];
  if (annotation_type === 'positive') {
    relevant_annotations = positive_annotations.slice();
  }
  else if (annotation_type === 'negative') {
    relevant_annotations = negative_annotations.slice();
  }

  // saves pagination divs for updating URLs in if/else
  var pagination_divs = document.querySelectorAll('.pagination');

  // if the id is in the list, we remove
  if (relevant_annotations.includes(id)) {

    // update relevant annotations first
    position = relevant_annotations.indexOf(id);
    if ( ~position ) relevant_annotations.splice(position, 1);
    // then update the global variable
    if (annotation_type === 'positive') {
      positive_annotations = relevant_annotations;
      all_positive_annotations[facet_index[0]] = positive_annotations.slice();
    }
    else if (annotation_type === 'negative') {
      negative_annotations = relevant_annotations;
      all_negative_annotations[facet_index[0]] = negative_annotations.slice();
    }

    if (menu_option === 'menu_predict') {
      if (annotation_type === 'positive') {
        toggle_predict_positive_image(id, false);
      }
      else {
        toggle_predict_negative_image(id, false);
      }
    }

    // remove the border
    var element = null;
    if (annotation_type === 'positive') {
      element = document.getElementById(String(id).concat("librarypositive"));
    }
    else if (annotation_type === 'negative') {
      element = document.getElementById(String(id).concat("librarynegative"));
    }
    if (!(element === null)) {
    element.style.outline = "0";
    }

    // now, we update the pagination links to remove the annotation
    // and also remove icon (+ or -)
    if (annotation_type === 'positive') {
      update_pagination_links("positive");
      update_plus_icons("remove", [id]);
    }
    else if (annotation_type === 'negative') {
      update_pagination_links("negative");
      update_minus_icons("remove", [id]);
    }

    // update button for saving to library
    var button = null;
    if (annotation_type === 'positive') {
      button = document.getElementById(String(id).concat("positivebutton"));
      if (!(button === null)) {
      button.style.backgroundColor = "white";
      button.style.fontSize = "12px";
      button.style.color = "black";
      button.innerHTML = "Add +";
      }
    }
    else if (annotation_type === 'negative') {
      button = document.getElementById(String(id).concat("negativebutton"));
      if (!(button === null)) {
      button.style.backgroundColor = "white";
      button.style.fontSize = "12px";
      button.style.color = "black";
      button.innerHTML = "Add -";
      }
    }

  } else {

    // update relevant_annotations first
    relevant_annotations.push(id);

    if (menu_option === 'menu_predict') {
      if ((annotation_type === 'positive')) {
        toggle_predict_positive_image(id, true);
      }
      else {
        toggle_predict_negative_image(id, true);
      }
    }

    // then update the global variable
    if (annotation_type === 'positive') {
      positive_annotations = relevant_annotations;
      all_positive_annotations[facet_index[0]] = positive_annotations.slice();
    }
    else if (annotation_type === 'negative') {
      negative_annotations = relevant_annotations;
      all_negative_annotations[facet_index[0]] = negative_annotations.slice();
    }

    // add border
    if (annotation_type === 'positive') {
      var element = document.getElementById(String(id).concat("librarypositive"));
      if (!(element === null)) {
      element.style.outline = "3px solid #00FF00";
      }
    }
    else if (annotation_type === 'negative') {
      var element = document.getElementById(String(id).concat("librarynegative"));
      if (!(element === null)) {
      element.style.outline = "3px solid #0000FF";
      }
    }

    // now, we update the pagination links to include the annotation
    // we also add the correct icon
    if (annotation_type === 'positive') {
      update_pagination_links("positive");
      update_plus_icons("add", [id]);
    }
    else if (annotation_type === 'negative') {
      update_pagination_links("negative");
      update_minus_icons("add", [id]);
    }

    // update button for making annotation
    if (annotation_type === 'positive') {
      var positivebutton = document.getElementById(String(id).concat("positivebutton"));
      if (!(positivebutton === null)) {
      positivebutton.style.backgroundColor = "green";
      positivebutton.style.color = "white";
      positivebutton.innerHTML = "Remove";
      }
    }
    else if (annotation_type === 'negative') {
      var negativebutton = document.getElementById(String(id).concat("negativebutton"));
      if (!(negativebutton === null)) {
      negativebutton.style.backgroundColor = "blue";
      negativebutton.style.color = "white";
      negativebutton.innerHTML = "Remove";
      }
    }

  } // end 'else'

  // now what we are outside of if/else, we update annotations bar and tabs

  // if the correct annotations bar exists, we update it (for search form)
  if (annotation_type === 'positive') {
    var plus_annotations_bar = document.getElementById("plus_annotations_bar");
    if (!(plus_annotations_bar === null)) {
      plus_annotations_bar.children[0].value = unravel(all_positive_annotations);
    }
  }
  else if (annotation_type === 'negative') {
    var minus_annotations_bar = document.getElementById("minus_annotations_bar");
    if (!(minus_annotations_bar === null)) {
      minus_annotations_bar.children[0].value = unravel(all_negative_annotations);
    }
  }

  // now, we update the hrefs to tabs on the nav bar
  if (annotation_type === 'positive') {
    update_tabs(menu_option, "positive");
  }
  else if (annotation_type === 'negative') {
    update_tabs(menu_option, "negative");
  }

  // correct the page references
  correct_page_references(menu_option);

  // we update the tune button (highlight or not depending on whether new selections have been made)
  update_tune_button(menu_option);

}

// updates facet name when user changse it on 'predict' page
function update_facet_name() {

  document.getElementById("facet_name").style.color = "black";
  document.getElementById("facet_name").style.borderColor = "black";

  // need protected character so people can't use commas in facet name title...

  // we now update the facet name in the array
  updated_facet_name = document.getElementById("facet_name").innerHTML;

  if (updated_facet_name === '') {
    document.getElementById("facet_name").style.color = "silver";
    document.getElementById("facet_name").style.borderColor = "gray";
  }

  if (updated_facet_name != "Untitled") {
    facet_names[facet_index[0]] = updated_facet_name.replace(/%20/g, " ");

    // we then update all hrefs
    update_tabs("menu_predict", "facet_names");
    update_tabs("menu_predict", "facet_index");
    update_pagination_links(facet_names);
    update_pagination_links(facet_index);

    // we then update the facet name on the left-hand panel
    document.getElementById("facettext".concat(facet_index[0])).innerHTML = updated_facet_name;
    var facet_names_bar = document.getElementById("facet_names_bar");
    if (!(facet_names_bar === null)) {
      facet_names_bar.children[0].value = facet_names.join(",").replace(/ /g, "%20").split('&nbsp;').join("");
    }
  }
}

// creates new facet when prompted by user on 'predict' page
function create_new_facet() {

  var success = verify_name();

  if (!success) {
    return false;
  }
  // we add new facet
  new_len = facet_names.push('Untitled-'.concat(facet_names.length+1));
  facet_index = [new_len-1];

  // we add new, empty lists to "list of list"s
  all_positive_annotations.push([]);
  all_negative_annotations.push([]);

  // we then update all hrefs
  update_tabs("menu_predict", "facet_names");
  update_tabs("menu_predict", "facet_index");
  update_tabs("menu_predict", "positive");
  update_tabs("menu_predict", "negative");
  update_pagination_links(facet_names);
  update_pagination_links(facet_index);

  ml_reset();

  return true;
}

// updates selected facet on 'predict' page
function update_selected_facet(facet_ID) {
  facet_index = [facet_ID];
  update_tabs("menu_predict", "facet_index");
  update_pagination_links(facet_index);
  ml_reset();
}

// adds facet to the left-hand panel on 'predict' page
function add_facet_to_panel(menu_option, facet_ID) {
  const div = document.createElement('div');
  div.setAttribute("class", "facetbutton");
  // div.innerHTML = facet_names[facet_ID];
  div.setAttribute("id", "facet".concat(facet_ID));

  div.style.clear = "both";

  if (menu_option === 'menu_predict') {
    div.setAttribute("onclick", "update_selected_facet(".concat(facet_ID).concat(")"));
  }
  else if (menu_option === 'menu_search') {
    div.setAttribute("onclick", "update_facet_selections(".concat(facet_ID).concat(")"));
  }
  document.getElementById('innerpanel').appendChild(div);

  const textdiv = document.createElement('div');
  textdiv.innerHTML = facet_names[facet_ID];
  textdiv.setAttribute("id", "facettext".concat(facet_ID));
  textdiv.style.float = "left";
  textdiv.style.paddingLeft = "10px";
  textdiv.style.paddingRight = "20px";
  document.getElementById('facet'.concat(facet_ID)).appendChild(textdiv);

  if (menu_option === 'menu_search') {
    const checkdiv = document.createElement('div');
    checkdiv.style.float = "right";
    checkdiv.setAttribute("id", "facetcheck".concat(facet_ID));
    checkdiv.innerHTML = "&#x2611";
    checkdiv.style.fontSize = "15px";
    // checkdiv.innerHTML = "&#10003";
    checkdiv.style.paddingRight = "10px";
    document.getElementById('facet'.concat(facet_ID)).appendChild(checkdiv);

    const xdiv = document.createElement('div');
    xdiv.style.float = "right";
    xdiv.setAttribute("id", "facetx".concat(facet_ID));
    xdiv.style.fontSize = "15px";
    // xdiv.innerHTML = "&#10008";
    xdiv.innerHTML = "&#x2610";
    xdiv.style.paddingRight = "10px";
    document.getElementById('facet'.concat(facet_ID)).appendChild(xdiv);

    if (selected_facets.includes(facet_ID)) {
      checkdiv.style.display = "block";
      xdiv.style.display = "none";
    }
    else {
      checkdiv.style.display = "none";
      xdiv.style.display = "block";
    }
  }
}


// updates the selected facets on 'search' page
function update_facet_selections(new_facet_ID) {


  if (annotations.length === 0) {
    window.alert("You must add at least one photo to your collection on the 'search' page first!");
  }
  else {

    facet_index[0] = new_facet_ID;
    query_string = replace_query_string_value(query_string, "facet_index", new_facet_ID.toString());
    document.getElementById("facet_index").value = new_facet_ID.toString();

    if (selected_facets.includes(new_facet_ID)) {
      position = selected_facets.indexOf(new_facet_ID);
      if ( ~position ) selected_facets.splice(position, 1);
      document.getElementById("facet".concat(new_facet_ID)).style.backgroundColor = "#ddd";
      document.getElementById("facet".concat(new_facet_ID)).style.color = "black";
      document.getElementById("facetx".concat(new_facet_ID)).style.display = "block";
      document.getElementById("facetcheck".concat(new_facet_ID)).style.display = "none";
    }
    // right now, we only allow one facet to be selected at a time; can easily change this later
    else {
      if (selected_facets.length === 0) {
        selected_facets.push(new_facet_ID);
      }
      else {
        current_facet_ID = selected_facets[0];
        selected_facets[0] = new_facet_ID;
        document.getElementById("facet".concat(current_facet_ID)).style.backgroundColor = "#ddd";
        document.getElementById("facet".concat(current_facet_ID)).style.color = "black";
        document.getElementById("facetx".concat(current_facet_ID)).style.display = "block";
        document.getElementById("facetcheck".concat(current_facet_ID)).style.display = "none";
      }

      document.getElementById("facet".concat(new_facet_ID)).style.backgroundColor = "#333";
      document.getElementById("facet".concat(new_facet_ID)).style.color = "#f2f2f2";
      document.getElementById("facetx".concat(new_facet_ID)).style.display = "none";
      document.getElementById("facetcheck".concat(new_facet_ID)).style.display = "block";
    }
    var selected_facets_bar = document.getElementById("selected_facets_bar");
    if (!(selected_facets_bar === null)) {
      selected_facets_bar.children[0].value = selected_facets.join(",");
    }
    update_tabs("menu_search", "selected_facets");
    update_pagination_links("selected_facets");

    submit_form();
  }
}

// verifies button click for editing facets on 'search' page
function verify_edit_facets() {
  if (annotations.length === 0) {
    window.alert("You must add at least one photo to your collection on the 'search' page first!");
    return false;
  }
  loading();
}

function submit_form() {
  loading();
  document.getElementById("searchform").submit();
}

// function for updating the CSS on the "tune" button on 'predict' page to make it highlighted
// if the annotations no longer agree with what they were
function update_tune_button(menu_option) {
  if (menu_option === 'menu_predict') {
    var tune_button = document.getElementById('tunebutton');
    if ((JSON.stringify(positive_annotations) === JSON.stringify(starting_positive_annotations)) && (JSON.stringify(negative_annotations) === JSON.stringify(starting_negative_annotations))) {
      if (!(tune_button === null)) {
        tune_button.style.transition = "none";
        tune_button.style.border = "3px solid transparent";
        tune_button.style.fontWeight = "normal";
        tune_button.style.color = "#bbb";
        tune_button.style.backgroundColor = "#ddd";
      }
    }
    else {
      if (!(tune_button === null)) {
        tune_button.style.transition = "none";
        tune_button.style.color = "white";
        tune_button.style.backgroundColor = "black";
        tune_button.style.border = "3px solid black";
      }
    }
  }
}

// sets index page on load
function set_index_page() {
  document.getElementById("search").placeholder = "Search by keyword here!";
  document.getElementById("search").style.width = "100%";
  var d = new Date();
  var start_time = d.getTime();
  document.getElementById("start_time").value = start_time;

  add_sample_searches();

  highlight('menu_search');
}

// forces user to name the curator before leaving the 'predict' page
function verify_name() {
  current_facet_ID = facet_index[0];
  facet_name = facet_names[current_facet_ID];
  function countInArray(array, search_element) {
    return array.filter(item => item === search_element).length;
  }
  // if (((facet_name === 'Untitled') || (facet_name === '') || (facet_name === '<br>')) && !(positive_annotations.length === 1 && positive_annotations[0] === annotations[0] && negative_annotations.length === 0)){
  if ((facet_name === '') || (facet_name === '<br>')){
    document.getElementById("righthalf").scrollTop = 0;
    window.alert("Please name your AI navigator using the box on the right before leaving this page!");
    return false;
  }
  if (countInArray(facet_names, facet_name) > 1){
    document.getElementById("righthalf").scrollTop = 0;
    window.alert("Please re-name your AI navigator using the box on the right before leaving this page, as it currently matches the name of another navigator!");
    return false;
  }
  loading();
  return true;
}

// sets alert when a vistor ends up on /about directly after hitting the landing page
function direct_to_search() {
  window.alert("Navigate to the 'search' tab first to add photos to your collection!");
  return false;
}

function stop_click_propagation(e){
    if (!e) var e = window.event;
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation();
}

function update_search_sort() {
  selected_index = document.getElementById("selectsort").selectedIndex;

  if (selected_index < 2) {
    selected_facets = [];
    var selected_facets_bar = document.getElementById("selected_facets_bar");
    if (!(selected_facets_bar === null)) {
      selected_facets_bar.children[0].value = selected_facets.join(",");
    }
    if (selected_index === 0) {
      document.getElementById("date_ascending").value = 'true';
    }
    else {
      document.getElementById("date_ascending").value = 'false';
    }
    submit_form();
  }

  // if > 1, we then update the facet (subtract 2 for the two date options coming first)
  else {
    update_facet_selections(selected_index - 2);
  }

  document.getElementById("searchform").submit();
}


function update_view_sort() {
  selected_index = document.getElementById("selectsort").selectedIndex;

  if (selected_index === 0) {
    query_string = replace_query_string_value(query_string, "view_sort", "0");
  }
  else if (selected_index === 1) {
    query_string = replace_query_string_value(query_string, "view_sort", "1");
  }
  else if (selected_index === 2) {
    query_string = replace_query_string_value(query_string, "view_sort", "2");
  }

  window.location = window.location.href.split('?')[0].concat(query_string);
}

// adds sample searches to 'index'
function add_sample_searches() {
  sample_searches = [
          "airplane",
          "automobile",
          "ballet",
          "baseball",
          "blimp",
          "cat",
          "canal",
          "champion",
          "circus",
          "clown",
          "comet",
          "construction",
          "dog",
          "electricity",
          "elephant",
          "flying machine",
          "giraffe",
          "glacier",
          "halloween",
          "invention",
          "microscope",
          "national park",
          "newsie",
          "pineapple",
          "pugilist",
          "schooner",
          "skating",
          "skyscraper",
          "telescope",
          "twister",
          "winter hat",
          "x-ray"
          ]

  let random = sample_searches.sort(() => .5 - Math.random()).slice(0,3);

  sample_search_div = document.getElementById("samplesearches");

  var search_strings = document.createElement('div');
  search_strings.innerHTML = "Not sure what to search for? Here are some suggestions: "

  var search_1 = document.createElement('a');
  search_1.href = window.location.href.concat("?select_state=All&select_start_year=1900&select_end_year=1963&search=").concat(random[0]).concat("&start_time=").concat(document.getElementById('start_time').value);
  search_1.innerHTML = random[0];
  var search_2 = document.createElement('a');
  search_2.href = window.location.href.concat("?select_state=All&select_start_year=1900&select_end_year=1963&search=").concat(random[1]).concat("&start_time=").concat(document.getElementById('start_time').value);
  search_2.innerHTML = random[1];
  var search_3 = document.createElement('a');
  search_3.href = window.location.href.concat("?select_state=All&select_start_year=1900&select_end_year=1963&search=").concat(random[2]).concat("&start_time=").concat(document.getElementById('start_time').value);
  search_3.innerHTML = random[2];
  search_strings.appendChild(search_1);
  comma_element = document.createElement('a');
  comma_element.innerHTML = ", ";
  search_strings.appendChild(comma_element);
  search_strings.appendChild(search_2);
  comma_element = document.createElement('a');
  comma_element.innerHTML = ", ";
  search_strings.appendChild(comma_element);
  search_strings.appendChild(search_3);
  search_strings.style.margin = "10px";


  sample_search_div.appendChild(search_strings);


}
