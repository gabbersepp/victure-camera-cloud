# map /app/data
# map /app/config.json
FROM node
RUN apt update && \
    apt install -y vlc && \
    useradd -m vlcuser

COPY app/package.json /app/package.json
COPY app/package-lock.json /app/package-lock.json

WORKDIR /app
RUN npm install

COPY app/ /app
USER vlcuser
CMD node index.js 