# map /app/config.json
FROM node as build
COPY app/package.json /app/package.json
WORKDIR /app
RUN npm install

COPY app/ /app
RUN npm run build

FROM nginx
COPY --from=build /app/dist /usr/share/nginx/html