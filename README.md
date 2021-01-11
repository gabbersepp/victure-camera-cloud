# Victure Video Cloud
This is a free, self hosted alternative for the Cloud storage, provided by camera manufacturer Victure.

# Components
It consists of several components.

## cam-server-backend
This container is responsible for saving the RTSP stream using VLC. 

# Notes
The easiest and best would have been to use ffmpeg. But I (and others in the internet) had no success. It worked only with RTSP Proxies or VLC.

# Additional links
[How to force VLC to exit after recording](https://forum.videolan.org/viewtopic.php?t=40406#p368523)
[VLC Command line](https://wiki.videolan.org/VLC_command-line_help/)
[Record RTP stream with VLC](https://forum.videolan.org/viewtopic.php?t=130881)
[VLC without interface](https://superuser.com/questions/664826/play-vlc-stream-without-interface)
[Why the Victure 730 does not work properly](https://community.home-assistant.io/t/victure-camera-not-working/141689/40)
[Find correct URL for connection to Victure cam](https://www.ispyconnect.com/man.aspx?n=Victure)