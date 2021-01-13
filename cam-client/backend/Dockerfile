# map /app/data
# map /app/config.json
FROM node
COPY app/ /app
WORKDIR /app
RUN npm install
CMD node index.js 