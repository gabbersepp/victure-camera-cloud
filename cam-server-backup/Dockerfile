# map /app/data
FROM node
COPY app/package.json /app/package.json
WORKDIR /app
RUN npm install

COPY app/ /app
CMD node index.js 