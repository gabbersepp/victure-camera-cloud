<template>
    <div class="camera-config-view">
        <v-list dense>
            <v-subheader>Kameras</v-subheader>
            <v-list-item-group color="primary">
                <v-list-item v-for="(cam, i) in cameras" :key="cam.name" >
                    <v-list-item-icon>
                        <v-icon color="red darken-2" @click="deleteCamera(cam)">mdi-delete</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content @click="selectedCameraIndex = i">
                        <v-list-item-title v-text="cam.name"></v-list-item-title>
                        <v-list-item-subtitle v-text="cam.url"></v-list-item-subtitle>
                    </v-list-item-content>
                </v-list-item>
                <v-list-item>
                    <v-list-item-content>
                        <v-btn @click="newCamera()" block>Neue Kamera</v-btn>
                    </v-list-item-content>
                </v-list-item>
            </v-list-item-group>
        </v-list>
        
        <v-container v-if="selectedCamera">
            <v-form v-model="valid">
                <v-container>
                    <v-row>
                        <v-col cols="12" md="3">
                            <v-text-field v-model="selectedCamera.name"
                                label="Name der Kamera"
                                required />
                        </v-col>
                        <v-col cols="12" md="7">
                            <v-text-field v-model="selectedCamera.url"
                                label="Adresse (beachte: statische IP!)"
                                required />
                        </v-col>
                        <v-col cols="12" md="2">
                            <v-btn @click="save()"  block>Speichern</v-btn>
                        </v-col>
                    </v-row>
                </v-container>
            </v-form>
        </v-container>

         <v-alert :type="alertType" v-if="alertMessage">{{ alertMessage }}</v-alert>
    </div>
</template>

<script lang="ts">

import Config from '@/utils/Config';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import Utils from "./../utils/Utils";

@Component
export default class CameraConfig extends Vue {
    private config!: Promise<Config>;
    private cameras: any[] = [];
    private get selectedCamera(): any {
        if (this.cameras.length === 0) {
            return null;
        }

        if (this.selectedCameraIndex > -1) {
            return this.cameras[this.selectedCameraIndex]
        }

        return null;
    }
    private selectedCameraIndex: number = -1;

    private alertType: string | null = null;
    private alertMessage: string | null = null;

    constructor() {
        super();

        this.config = Utils.getConfig();
    }

    private async deleteCamera(cam: any) {
        const config = await this.config;
        const result = await fetch(`${config.apiUrl}/camera/${cam.name}`, {
            method: "DELETE"
        })

        if (result.status === 200) {
            this.setAlert("Erfolgreich gelöscht", "success")
        } else {
            const message = await result.json()
            this.setAlert("Fehler beim Löschen", "success")
        }

        this.load();
    }

    private newCamera(): void {
        this.cameras.push({ name: "", url: "" })
        this.selectedCameraIndex = this.cameras.length - 1
    }

    private setAlert(msg: string, type: string) {
        this.alertType = type;
        this.alertMessage = msg;
        setTimeout(() => this.alertMessage = null, 2000)
    }

    private async created() {
        this.load();
    }

    private async load() {
        const config = await this.config;
        const result = await fetch(`${config.apiUrl}/cameras`);
        this.cameras = await result.json();
    }

    private async save() {
        const config = await this.config;
        const result = await fetch(`${config.apiUrl}/camera`, {
            method: "POST",
            body: JSON.stringify(this.selectedCamera),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if (result.status === 200) {
            this.setAlert("Erfolgreich gespeichert", "success")
        } else {
            const message = await result.json()
            this.setAlert("Fehler beim Speichern", "success")
        }

        this.selectedCameraIndex = -1;
    }
}

</script>

<style lang="scss" scoped>

</style>