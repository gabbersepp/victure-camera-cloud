# map /app/config.json
FROM node as build
COPY app/package.json /app/package.json
COPY app/package-lock.json /app/package-lock.json

WORKDIR /app
RUN npm install

COPY app/ /app
RUN npm run build

FROM nginx
COPY --from=build /app/dist /usr/share/nginx/html