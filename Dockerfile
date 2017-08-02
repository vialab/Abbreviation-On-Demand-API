FROM node:alpine

WORKDIR /usr/src/app
COPY . /usr/src/app

EXPOSE 10010

CMD ["npm", "start"]
