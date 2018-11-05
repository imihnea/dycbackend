FROM node:10-slim
WORKDIR /dycbackend
COPY package.json /dycbackend
RUN npm install
COPY . /dycbackend
CMD ["npm", "start"]