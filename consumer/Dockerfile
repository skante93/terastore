
FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get upgrade -y

RUN apt-get install -y rsyslog sudo nano

RUN apt-get install -y python3 python3-pip 

RUN pip3 install jupyterlab

WORKDIR /root/notebooks

CMD jupyter lab --allow-root --ip 0.0.0.0 --NotebookApp.token='' --NotebookApp.password=''
