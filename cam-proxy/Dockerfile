# map config file to /app/config.json
# docker run -it --rm -v c:/git/rtsp-cam-manager:/app/data cam-server bash
FROM node
RUN apt update && \
    apt install -y vlc && \
    useradd -m vlcuser

WORKDIR /app

COPY app/ /app

USER vlcuser
CMD node index.js 