FROM node:latest
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app
RUN apt-get update && apt-get install -y git && apt-get install -y vim
RUN npm install
COPY . /usr/src/app
CMD ["npm", "start"]