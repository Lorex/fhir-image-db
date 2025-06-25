FROM node:20-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install yarn and sails globally
RUN npm i -g yarn sails

ADD package.json /usr/src/app/
RUN yarn install --frozen-lockfile

# # Bundle app source
ADD . /usr/src/app

EXPOSE 1337
