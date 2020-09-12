FROM frolvlad/alpine-python-machinelearning
WORKDIR /project
ENV FLASK_APP flaskapp.py
ENV FLASK_RUN_HOST 0.0.0.0
RUN apk add --no-cache gcc musl-dev linux-headers
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
COPY . .
RUN python preprocessing/download_metadata.py
CMD ["flask", "run"]
