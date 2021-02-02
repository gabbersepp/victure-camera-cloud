# map /app/data
# map /app/config.json
FROM node
RUN apt update && \
    apt install -y vlc && \
    useradd -m vlcuser

COPY app/package.json /app/package.json
WORKDIR /app
RUN npm install

COPY app/ /app
USER vlcuser
CMD node index.js 