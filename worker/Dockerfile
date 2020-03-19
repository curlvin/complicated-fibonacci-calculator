#specify base image
FROM node:alpine as builder

#specify workdir
WORKDIR /app

#copy config files to workdir
COPY ./package.json ./

#install dependencies
RUN npm install

#copy everything else to workdir
COPY . .

#Specify startup command
CMD ["npm","run","start"]