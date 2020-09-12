from wtforms import Form, SelectField, StringField, HiddenField

class DataSearchForm(Form):

    # states/territories
    state_options = ('All', 'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
                'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
                'NJ','NM','NY','NC','ND','OH','OK','OR','PA','PR','RI','SC','SD','TN','TX','UT',
                'VT','VA','WA','WV','WI','WY')

    # start years
    start_year_options = (1900, 1901, 1902, 1903, 1904, 1905, 1906, 1907, 1908, 1909,
                            1910, 1911, 1912, 1913, 1914, 1915, 1916, 1917, 1918, 1919,
                            1920, 1921, 1922, 1923, 1924, 1925, 1926, 1927, 1928, 1929,
                            1930, 1931, 1932, 1933, 1934, 1935, 1936, 1937, 1938, 1939,
                            1940, 1941, 1942, 1943, 1944, 1945, 1946, 1947, 1948, 1949,
                            1950, 1951, 1952, 1953, 1954, 1955, 1956, 1957, 1958, 1959,
                            1960, 1961, 1962, 1963)

    # end years
    end_year_options = (1900, 1901, 1902, 1903, 1904, 1905, 1906, 1907, 1908, 1909,
                            1910, 1911, 1912, 1913, 1914, 1915, 1916, 1917, 1918, 1919,
                            1920, 1921, 1922, 1923, 1924, 1925, 1926, 1927, 1928, 1929,
                            1930, 1931, 1932, 1933, 1934, 1935, 1936, 1937, 1938, 1939,
                            1940, 1941, 1942, 1943, 1944, 1945, 1946, 1947, 1948, 1949,
                            1950, 1951, 1952, 1953, 1954, 1955, 1956, 1957, 1958, 1959,
                            1960, 1961, 1962, 1963)

    # set the form fields for these selections
    select_state = SelectField('State/Territory:', choices=state_options)
    select_start_year = SelectField('Start Year: ', choices=start_year_options, default=1900)
    select_end_year = SelectField('End Year: ', choices=end_year_options, default=1963)

    # set the form field for keyword search
    search = StringField('')

    # set hidden field to keep track of images that have been annotated to include in library
    plus_library = HiddenField('')

    # set hidden field to keep track of negative annotations library for training
    minus_library = HiddenField('')

    # set hidden field to keep track of positive annotations for training
    positive = HiddenField('')

    # set hidden field to keep track of negative annotations for training
    negative = HiddenField('')

    # set hidden field to keep track of named facet learners
    facet_names = HiddenField('')

    # sets hidden field to keep track of current facet index
    facet_index = HiddenField('')

    # sets hidden field to keep track of applied facets during search
    selected_facets = HiddenField('')

    # set the hidden field to retain state for view
    view = HiddenField('')

    # set the hidden field to retain state of sorting
    date_ascending = HiddenField('true')

    # set the hidden field to retain state of sorting
    view_sort = HiddenField('')

    # set the session start time
    start_time = HiddenField('')

class MLSearchForm(Form):

    # states/territories
    state_options = ('All', 'AL','AK','AZ','AR','CA','CO','CT','DC','DE','FL','GA','HI','ID','IL','IN',
                'IO','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
                'NJ','NM','NY','NC','ND','OH','OK','OR','PA','PR','RI','SC','SD','TN','TX','UT',
                'VT','VA','WA','WV','WI','WY')

    # start years
    start_year_options = (1900, 1901, 1902, 1903, 1904, 1905, 1906, 1907, 1908, 1909,
                            1910, 1911, 1912, 1913, 1914, 1915, 1916, 1917, 1918, 1919,
                            1920, 1921, 1922, 1923, 1924, 1925, 1926, 1927, 1928, 1929,
                            1930, 1931, 1932, 1933, 1934, 1935, 1936, 1937, 1938, 1939,
                            1940, 1941, 1942, 1943, 1944, 1945, 1946, 1947, 1948, 1949,
                            1950, 1951, 1952, 1953, 1954, 1955, 1956, 1957, 1958, 1959,
                            1960, 1961, 1962, 1963)

    # end years
    end_year_options = (1900, 1901, 1902, 1903, 1904, 1905, 1906, 1907, 1908, 1909,
                            1910, 1911, 1912, 1913, 1914, 1915, 1916, 1917, 1918, 1919,
                            1920, 1921, 1922, 1923, 1924, 1925, 1926, 1927, 1928, 1929,
                            1930, 1931, 1932, 1933, 1934, 1935, 1936, 1937, 1938, 1939,
                            1940, 1941, 1942, 1943, 1944, 1945, 1946, 1947, 1948, 1949,
                            1950, 1951, 1952, 1953, 1954, 1955, 1956, 1957, 1958, 1959,
                            1960, 1961, 1962, 1963)

    # languages
    language_options = ('All',)

    # types of visual content
    visual_content_type_options = ('All', 'Photograph', 'Illustration', 'Map', 'Comics/Cartoon', 'Editorial Cartoon')

    # set the form fields for these selections
    ml_select_state = SelectField('State/Territory:', choices=state_options)
    ml_select_start_year = SelectField('Start Year: ', choices=start_year_options, default=1900)
    ml_select_end_year = SelectField('End Year: ', choices=end_year_options, default=1963)

    # set the form field for keyword search
    ml_search = StringField('')

    # set hidden field to keep track of images that have been annotated to include in library
    plus_library = HiddenField('')

    # set hidden field to keep track of negative annotations library for training
    minus_library = HiddenField('')

    # set hidden field to keep track of positive annotations for training
    positive = HiddenField('')

    # set hidden field to keep track of negative annotations for training
    negative = HiddenField('')

    # set hidden field to keep track of named facet learners
    facet_names = HiddenField('')

    # sets hidden field to keep track of current facet index
    facet_index = HiddenField('')

    # sets hidden field to keep track of applied facets during search
    selected_facets = HiddenField('')

    # set the hidden field to retain state for view
    view = HiddenField('')

    # set the hidden field to retain state of sorting
    date_ascending = HiddenField('true')

    # set the hidden field to retain state of sorting
    view_sort = HiddenField('')

    # set the session start time
    start_time = HiddenField('')

    # set the normal search fields
    search = StringField('')
    select_state = StringField('')
    select_start_year = StringField('')
    select_end_year = StringField('')
