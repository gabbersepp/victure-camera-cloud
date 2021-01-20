# Victure Video Cloud
This is a free, self hosted alternative for the Cloud storage, provided by camera manufacturer Victure.

## Why?
I have four PC730 at home and another one from Victure in my garden shed. I like them really much but they suffer from a bad designed cloud storage program. You have to buy cloud storage for each camera. This is way too expensive. If you don't want to use cloud storage, you can use a micro sd card, too.
But this suffers from security issues as a thief easily can tear the camera from the wall. This can only be avoided by placing the camera as high as possible.
But sometimes the possible height is not high enough. 

## How?
Gladly Victure implemented OVIF on their cameras. You can activate it in the PC360 app.

>*OVIF* is a open standard for security hardware that enables hardware from different manufacturers to communicate with each others.

>*ATTENTION* activating OVIF disables encryption of the video data. 

## Why using VLC and not ffmpeg
`ffmpeg` is normally a good choise for those tasks. But unfortunatelly there seems to be [a bug in the RTSP implementation](https://community.home-assistant.io/t/victure-camera-not-working/141689/40) of my camera which leads to corrupt data.


# Components
It consists of several components.

## cam-server-backend
This container is responsible for saving the RTSP stream using VLC. In my setup I am running a kubernetes cluster on a Linux host. Within the network a NAS is available. To avoid that it's hard drives are running 24/7, I stream the videos to the host's SSD.

## cam-server-backup
Every hour the saved videos on the host are moved to the NAS by this component.

## cam-server-memory-cleanup
There are two container with this image. One is executed once a hour to ensure that the storage taken by the backup does not exceed a pre defined limit.

Another one runs every 10 minutes to ensure that the host's storage is cleaned up.

## cam-client-backend
A small nodeJS application that serves the videos from the NAS. If requested this server converts the video into a format that can be played from within the browser. Also it generates thumbnails on the fly.

## cam-client-frontend
A small VueJS app.

# Notes
The easiest and best would have been to use ffmpeg. But I (and others in the internet) had no success. It worked only with RTSP Proxies or VLC.

# Additional links
[How to force VLC to exit after recording](https://forum.videolan.org/viewtopic.php?t=40406#p368523)
[VLC Command line](https://wiki.videolan.org/VLC_command-line_help/)
[Record RTP stream with VLC](https://forum.videolan.org/viewtopic.php?t=130881)
[VLC without interface](https://superuser.com/questions/664826/play-vlc-stream-without-interface)
[Why the Victure 730 does not work properly](https://community.home-assistant.io/t/victure-camera-not-working/141689/40)
[Find correct URL for connection to Victure cam](https://www.ispyconnect.com/man.aspx?n=Victure)
[Send video in nodeJS](https://github.com/daspinola/video-stream-sample/blob/master/server.js)
[Video conversion with VLC using CLI](https://superuser.com/questions/388511/how-can-i-make-the-following-conversion-in-vlc-from-the-commandline/390240)