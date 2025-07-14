import {KokoroTTS} from 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.0/+esm'

onmessage = function(msg) {
    let info = msg.data;
    console.log('KTTS Message received from main: ', info);
    
    if(info.action == 'load') {if(info.device) kttsModel.loadModel(info.device); else kttsModel.loadModel(); return;}
    if(info.action == 'voices') {return kttsModel.getVoices();}
    if(info.action == 'generate') {kttsModel.generate(info.text, info.voice); return;}
    console.log('invalid KTTS message');
}

class xenKTTSModelClass {
    constructor() {
        this.model = null;
        this.modelId = "onnx-community/Kokoro-82M-v1.0-ONNX"
        this.type = 'text-to-speech';

        this.tmstart = 0
        this.tmend = 0;
        this.loadFile = [];
        this.loadProg = [];
    }

    async loadModel(device = 'wasm') {
        let dtype = 'q8';
        if(device == 'webgpu') dtype = 'fp32';

        this.tmstart = performance.now();
        var self = this;

        this.model = await KokoroTTS.from_pretrained(this.modelId, {
            dtype: dtype, // Options: "fp32", "fp16", "q8", "q4", "q4f16"
            device: device, // Options: "wasm", "webgpu" (web) or "cpu" (node). If using "webgpu", we recommend using dtype="fp32".
            progress_callback: function(e) {loadStatusX(e, self);}
        });

        this.tmend = performance.now();
        let time = (this.tmend - this.tmstart)/1000;
        let params = {action:'load', status: 'done', file:'', progress: 100, time: time.toFixed(2)};
        postMessage(params);
    }

    loadStatus(e) { 
        this.tmend = performance.now();
        let time = (this.tmend - this.tmstart)/1000;
        switch(e.status) {
            case 'initiate':
                if(this.loadFile.indexOf(e.file) == -1) {
                    this.loadFile.push(e.file);
                    this.loadProg.push(0);
                }
                break;
            case 'progress':
                this.loadProg[this.loadFile.indexOf(e.file)] = e.progress;
                break;
            case 'ready':
                this.type = e.task;
                break;
        }
        
        let lstatus = 'loading';
        let progress = Math.min(...this.loadProg);
        if(e.status == 'ready') {lstatus = 'done';}
        else {if(progress == 100) lstatus = 'prep';}

        let params = {action:'load', status: lstatus, file:e.name, progress: progress, time: time.toFixed(2)};
        postMessage(params);
    }

    getVoices() {
        if(!this.model) {
            console.log('model not loaded');
            return;
        }

        let params = {action:'voices', status: 'done', data: this.model.voices};
        postMessage(params);
    }

    async generate(text, voice = 'af_heart') {
        if(!this.model) {
            console.log('model not loaded');
            return;
        }
        this.tmstart = performance.now();
        if(text.length < 1) {
            console.log('no text to generate');
            return;
        }
        if(!voice) voice = 'af_heart';
    
        const out = await this.model.generate(text, {voice: voice,});

        this.tmend = performance.now();
        let time = (this.tmend - this.tmstart)/1000;
        let params = {action:'speak', status: 'done', data: out, text: text, time: time.toFixed(2)};
        postMessage(params);
    }

}

function loadStatusX(e, parent) {parent.loadStatus(e);}
const kttsModel = new xenKTTSModelClass();
