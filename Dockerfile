FROM node:9-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
# RUN npm i -g sails

ADD package.json /usr/src/app/
RUN npm install --quiet

# # Bundle app source
ADD . /usr/src/app

EXPOSE 1337
