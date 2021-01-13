# map /app/data
# map /app/config.json
FROM node
RUN apt update && \
    apt install -y vlc && \
    useradd -m vlcuser && \
    mkdir /app && \
    mkdir /app/data

COPY app/ /app
WORKDIR /app
RUN npm install
USER vlcuser
CMD node index.js 