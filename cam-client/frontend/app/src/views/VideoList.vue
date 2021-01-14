<template>
    <div class="video-list-view">
        <v-container class="video-list">
            <v-row no-gutters class="video-container">
                <v-col md="3" v-for="v in videos" :key="v.path" @click="selectedVideo = v" >
                    <span class="title">{{ v.cameraName }} - {{ formatDate(v.date) }}</span> 
                    <img :src="getThumbnailUrl(v.path)" class="thumbnail" loading="lazy">
                </v-col>
            </v-row> 
        </v-container>

        <infinite-loading @infinite="infiniteVideosHandler"></infinite-loading>

        <v-overlay id="video-overlay" :value="selectedVideo">
            <v-btn
                color="success"
                @click="selectedVideo = null"
                class="hide"
            >X</v-btn>
            <video width="500" height="500" controls  :key="selectedVideo.path"  v-if="selectedVideo">
                <source :src="getVideoUrl(selectedVideo.path)" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        </v-overlay>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import Utils from "../utils/Utils"
import date from "date-and-time";
import Config from '@/utils/Config';
import InfiniteLoading from 'vue-infinite-loading';

@Component({
    components: {
        InfiniteLoading
    }
})
export default class VideoList extends Vue {

    private videos: any[] = [];
    private config!: Config;
    private selectedVideo: any = null;
    private page: number = 1;
    
    private formatDate(d: Date): string {
        return date.format(d, "DD-MM-YYYY HH:mm:ss", true)
    }

    private getVideoUrl(urlPart: string) {
        return `${this.config.apiUrl}/file/${urlPart}`;
    }

    private getThumbnailUrl(videoName: string) {
        return `${this.config.apiUrl}/thumbnail/${videoName}`;
    }

    private async infiniteVideosHandler($state: any) {
        this.config = await Utils.getConfig()
        const result = await fetch(`${this.config.apiUrl}/list/${this.page}`);
        const json: any[] = await result.json();
        json.forEach((o: any) => o.date = new Date(o.date))

        if (json.length > 0) {
            this.page++;
            this.videos.push(...json);
            $state.loaded()
        } else {
            $state.complete()
        }
    }
}
</script>

<style lang="scss" scoped>
.video-list-view {
    height: 100%;

    .video-list {
        height: 100%
    }
    .video-container {
        cursor: pointer;

        div {
            .title {
                font-weight: bold;
            }

            .thumbnail {
                height: 100px;
            }
        }
    }

    #video-overlay {
        .hide {
            position: absolute;
            top: 0;
            right: 0;
            z-index: 100;
        }
    }
}
</style>