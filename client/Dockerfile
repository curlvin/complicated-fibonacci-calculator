############# BUilder Phase###########
#specify base image
FROM node:alpine as builder

#specify workdir
WORKDIR /app

#copy config files to workdir
COPY ./package.json .

#install dependencies
RUN npm install

#copy everything else to workdir
COPY . .

#build prod image
RUN npm run build


######### RUN PHASE ###########
#specify base image for run phase
FROM nginx

#expose port to elastic beanstalk
EXPOSE 3000

#overwrite default config in container with local
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

#specify files to copy from build phase to run phase
COPY --from=builder /app/build /usr/share/nginx/html




## no need to specify a startup command like ["start","nginx"] when using nginx because that action is automatically executed ##


