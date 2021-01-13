# map /app/config.json
FROM node as build
COPY app/ /app
WORKDIR /app
RUN npm install
RUN npm run build

FROM nginx
COPY --from=node /app/dist /usr/share/nginx/html