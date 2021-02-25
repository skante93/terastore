
FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get upgrade -y

RUN apt-get install -y rsyslog sudo nano

RUN apt-get install -y nodejs npm 

RUN apt-get install -y curl

RUN npm install -g n && n stable

RUN npm install -g supervisor

WORKDIR /root/app

CMD supervisor bin/www
