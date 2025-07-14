import { environVRM } from '../shared/js/environvrm.mjs';
import { localSystem, characterManager, collectorToConsole } from '../shared/js/character.mjs'

const voices = {
    index: 0,
    list: [],
}

const audioData = {
    generated: null,
    raw: null,
    rate: 24000,
}

const appState = {
    ready: {
        tts: false,
        character: false,
        environ: false,
    },
    modelID: '',
    useaudio: true,
    usellm: false,
    talking: false,
    talkInterval: null,
    analyser: null,
    dataArray: null,
    easing: 1.0,
    gate: 0.00,
    vowelStream: [],
    vowelIndex: 0,
    blinkTimer: null,
    isBlinking: false,
    startDelay: 100,
}

const justBob = new characterManager();
justBob.add('Bob', "You are a helpful avatar named Bob who answers users questions. Answer as if you are Bob. Answer in the first person when talking about Bob since you are playing the role of Bob.");

const mouthShapes = ['aa', 'ih', 'ou', 'e', 'oh'];
const vowelVisemeMap = {a: 'aa', e: 'e', i: 'ih', o: 'oh', u: 'ou'};

const tglvoice = document.getElementById('togglevoice');
const braindlg = document.getElementById('braindlg');

const usellm = document.getElementById('usellm');
const selmdl = document.getElementById('selmdl');
const brainaction = document.getElementById('brainaction');

const bobarea = document.getElementById('bobarea');
const genarea = document.getElementById('genarea');
const gender = document.getElementById('gender');
const lang = document.getElementById('language');
const vlist = document.getElementById('voicelist');
const stext = document.getElementById('stext');
const afmt = document.getElementById('format');
const uprompt = document.getElementById('uprompt');

const audarea = document.getElementById('audioarea');
const audplayer = document.getElementById('audioPlayer');

export function appInit() {
    document.getElementById('pagetitle').innerHTML = 'FlexiBob';
    addListeners();
    setupModels();
    loadBasics();
}

function addListeners() {
    if(document.readyState !== 'complete') {setTimeout(addListeners, 30); return;}

    document.addEventListener('keydown', (e) => {
        // Ctrl+Shift+C as the combo (adjust if needed)
        if (e.ctrlKey && e.shiftKey && e.code === 'KeyC') {
            collectorToConsole();
            console.log('%c[Collector dumped to console]', 'color: limegreen; font-weight: bold;');
        }
    });

    tglvoice.addEventListener('change', (event) => {
        if(tglvoice.checked) {
            appState.useaudio = true;
            if(!appState.ready.tts) {loadTTSModel();}
        } else {
            appState.useaudio = false;
        }
    });
    document.getElementById('mouth').addEventListener('click', (event) => {showVoiceDlg();});
    document.getElementById('mouthdone').addEventListener('click', (event) => {closeVoiceDlg();});
    document.getElementById('brain').addEventListener('click', (event) => {showBrainDlg();});
    document.getElementById('kbase').addEventListener('click', (event) => {knowledgeDlg();});
    document.getElementById('kbdone').addEventListener('click', (event) => {closeKBDlg();});

    usellm.addEventListener('change', (event) => {
        if(usellm.checked) {
            selmdl.disabled = false;
        } else {
            selmdl.value = -1;
            selmdl.disabled = true;
        }
        setupModels();
    });
    selmdl.addEventListener('change', (event) => {changeModel();});
    brainaction.addEventListener('click', (event) => {updateBrain();});

    document.getElementById('faqreplace').addEventListener('click', (event) => {replaceFAQ();});
    document.getElementById('kbaseadd').addEventListener('click', (event) => {kBaseAdd();});
    document.getElementById('kbaseremove').addEventListener('click', (event) => {kBaseRemove();});
    document.getElementById('kbasewipe').addEventListener('click', (event) => {kBaseWipe();});

    gender.addEventListener('change', (event) => {updateVoices(); inputChange();});
    lang.addEventListener('change', (event) => {updateVoices(); inputChange();});
    vlist.addEventListener('change', (event) => {inputChange();});

    audplayer.addEventListener('play', (event) => {setTimeout(() => talkStart(), appState.startDelay);});
    audplayer.addEventListener('ended', (event) => {talkStop();});
    
    uprompt.addEventListener('keypress', (event) => {
        if (event.key === "Enter") {event.preventDefault(); prompt();}
    });
    document.getElementById('generate').addEventListener('click', (event) => {prompt();});
}

function setupModels() {
    if(document.readyState !== 'complete') {setTimeout(setupModels, 30); return;} 
    let gpumsg;
//localSystem.gpu.available = false;
    if(localSystem.gpu.available) {
        gpumsg = 'WebGPU: <div style="display:inline-block; background-color:black; color:green; padding: 5px; border-radius:10%;">available</div>';
    } else {
        gpumsg = 'WebGPU: <div style="display:inline-block; background-color:black; color:red; padding: 5px;">not available</div>';
        if(localSystem.gpu.gl2) {
            gpumsg += '<br><div style="display:inline-block; background-color:black; color:green; padding: 5px;">WebGL2</div> is available so WebGPU support may be turned off.  Search to find out how to enable WebGPU in your browser.';
        } else {
            gpumsg += '<br>You don\'t appear to have a GPU.  Select one of the non-GPU models.  One is larger and will perform better but slowly, while the other is smaller and will not perform as well.  If you believe you have a gpu, search for how to enable WebGPU in your browser.';
        }
    }
    document.getElementById('gpumsg').innerHTML = gpumsg;

    // Add model options to select element
    let count = modelInfo.length;

    selmdl.innerHTML = '';
    let index = -1;
    if(!usellm.checked) {    
        const opt = document.createElement('option');
        opt.value = -1;
        opt.innerHTML = `None`;
        selmdl.appendChild(opt);
    } else {
        for(let i=0; i<count; i++) {
            if(localSystem.gpu.available && modelInfo[i].gpu == 'no') continue;
            if(!localSystem.gpu.available && modelInfo[i].gpu == 'yes') continue;

            const opt = document.createElement('option');
            opt.value = i;
            opt.innerHTML = `${modelInfo[i].short}`;
            selmdl.appendChild(opt);

            if(modelInfo[i].modelid == appState.modelID) {
                index = i;
                brainaction.textContent = 'Cancel';
            } else {
                if(index < 0) index = i;
            }
        }
    }
    
    selmdl.value = index;
    changeModel();
}

function changeModel() {
    modelIndex = selmdl.value * 1;
    if(modelIndex < 0) {
        document.getElementById('mdldesc').innerHTML = '';
        if(appState.usellm) {
            brainaction.textContent = 'Unload model';
        } else {
            brainaction.textContent = 'Cancel';
        }
        return;
    }

    if(appState.modelID == modelInfo[modelIndex].modelid) {
        brainaction.textContent = 'Cancel';
    } else {
        brainaction.textContent = 'Load model';
    }

    if(modelInfo[modelIndex].gpu == 'yes') {
        document.getElementById('mdldesc').innerHTML = `${modelInfo[modelIndex].desc} (at least ${modelInfo[modelIndex].size} VRAM required)`;

        isWebllmModelCached(modelIndex).then((isCached) => {
            if (isCached) {
                modelInfo[modelIndex].cached = true;
            } else {
                modelInfo[modelIndex].cached = false;
            }
        });
    } else {
        document.getElementById('mdldesc').innerHTML = `${modelInfo[modelIndex].desc}`;
    }
}

async function loadBasics() {
    loadTTSModel();
    justBob.loadEmbeddingModel({embedCallback: emodelLoaded});
    const bobknowledge = {
        faq: {url: 'data/faqcore.csv', header: true, name:'faqcore'},
        info: [
            {url: 'data/bobcore.txt', name: 'bobcore'}
        ],
        callback: knowledgeReady,
    }
    const ckresult = await justBob.addCharacterKnowledge(bobknowledge);
    if(ckresult.error) console.log(console.error(ckresult.error));
}

async function loadLLM() {
    brainaction.style.display = 'none';
    document.getElementById('mdldesc').style.display = 'none';
    document.getElementById('llmprogress').style.display = 'block';

    modelIndex = selmdl.value * 1;
    if(modelIndex >= 0) {
        if(modelInfo[modelIndex].type == 'onnx') {
            modelStatus.isGPU = false;
        } else {
            modelStatus.isGPU = true;
        }
    }

    let modelID = '';
    if(modelIndex < 0) {
        appState.usellm = false;
        appState.modelID = '';
        justBob.unloadLLM();
        return;
    } else {
        appState.usellm = true;
        modelID = modelInfo[modelIndex].modelid;
        appState.modelID = modelID;
    }

    const bobmdlparams = {
        usellm: appState.usellm,
        llmModelId: modelID,
        llmCallback: modelLoaded,
    }
    justBob.loadLLM(bobmdlparams);
}

function showVoiceDlg() {
    document.getElementById('mbo').style.visibility = 'visible';
    document.getElementById('voicedlg').style.display = 'block';
}

function closeVoiceDlg() {
    document.getElementById('mbo').style.visibility = 'hidden';
    document.getElementById('voicedlg').style.display = 'none';    
}

function showBrainDlg() {
    if(appState.usellm) {
        modelIndex = selmdl.value * 1;
        const modelID = modelInfo[modelIndex].modelid;
        if(modelID == appState.modelID) {
            brainaction.textContent = 'Cancel';
        } else {
            brainaction.textContent = 'Load Model';
        }
    } else {
        brainaction.textContent = 'Cancel';
    }

    brainaction.style.display = 'block';

    document.getElementById('mbo').style.visibility = 'visible';
    braindlg.style.display = 'block';
}

function updateBrain() {
    const action = brainaction.textContent;
    switch(action) {
        case 'Cancel':
            closeBrainDlg();
            break;
        case 'Unload model':
            justBob.unloadLLM();
            appState.usellm = false;
            appState.modelID = '';
            closeBrainDlg();
            break;
        case 'Load model':
            loadLLM();
            break;
        default:
            console.warn('invalid brain command');
            break;
    }
}

function closeBrainDlg() {
    document.getElementById('mbo').style.visibility = 'hidden';
    braindlg.style.display = 'none';
    document.getElementById('llmprogress').style.display = 'none';
    document.getElementById('mdldesc').style.display = 'block';
}

function knowledgeDlg() {
    document.getElementById('mbo').style.visibility = 'visible';
    document.getElementById('kbdlg').style.display = 'block';

    const fname = justBob.characterFAQName();
     document.getElementById('faqlist').innerHTML = `<div class='ltext16'>${fname}`;
    updateInfoList();
}

function updateInfoList() {
    const inames = justBob.characterInfoNames();
    let html = '';
    for(let i=0; i<inames.length; i++) {
        html += `<div style='position: relative; height: 40px;'><input type='checkbox' id='kbase_${i}' class='ch' style='vertical-align: middle;' /><div class='ltext16' style='width: 450px; vertical-align: middle;' >${inames[i]}</div></div>`;
    }
    document.getElementById('infolist').innerHTML = html;
}

function replaceFAQ() {openLocalText('*.csv', faqDataReady);}
function faqDataReady(result) {
    const fparts = result.name.split('.');
    const resp = justBob.setCharacterFAQ(fparts[0], result.data, faqEmbeddingsReady);
    if(resp.error) {console.warn(resp.error); return;}
    document.getElementById('kbdone').style.display = 'none';
    document.getElementById('kbprogress').style.display = 'block';
}

function faqEmbeddingsReady(result) {
    const eprogress = document.getElementById('kbprogress');
    const w = `${result.progress.toFixed(0)}%`;
    eprogress.style.width = w;
    eprogress.innerText = `FAQ: ${w}`;

    if(result.state == 'done') {
        document.getElementById('kbdone').style.display = 'block';
        document.getElementById('kbprogress').style.display = 'none';
    }
}

function kBaseAdd() {openLocalText('*.txt', infoDataReady);}
function infoDataReady(result) {
    const fparts = result.name.split('.');
    const resp = justBob.addCharacterInfo(fparts[0], result.data, infoEmbeddingsReady);
    if(resp.error) {console.warn(resp.error); return;}
    document.getElementById('kbdone').style.display = 'none';
    document.getElementById('kbprogress').style.display = 'block';
}

function infoEmbeddingsReady(result) {
    const eprogress = document.getElementById('kbprogress');
    const w = `${result.progress.toFixed(0)}%`;
    eprogress.style.width = w;
    eprogress.innerText = `Info: ${w}`;

    if(result.state == 'done') {
        document.getElementById('kbdone').style.display = 'block';
        document.getElementById('kbprogress').style.display = 'none';
        updateInfoList();
    }
}

function kBaseRemove() {
    const inames = justBob.characterInfoNames();
    for(let i=0; i<inames.length; i++) {
        if(document.getElementById('kbase_'+i).checked) {
            justBob.removeCharacterInfo(inames[i]);
        }
    }
    updateInfoList();
}

function kBaseWipe() {
    justBob.wipeCharacterInfo();
    updateInfoList();
}

function closeKBDlg() {
    document.getElementById('mbo').style.visibility = 'hidden';
    document.getElementById('kbdlg').style.display = 'none';

}

//----------------------------------------- Model status functions
function emodelLoaded(result) {
    const eprogress = document.getElementById('eprogress');
    const w = `${result.progress.toFixed(0)}%`;
    eprogress.style.width = w;
    eprogress.innerText = `Snowflake: ${w}`;
    if(result.state == 'done') {
        eprogress.style.width = '100%';
        eprogress.innerText = `Snowflake Embedding Loaded`;
        appState.ready.character = justBob.characterReady(); // would require name parameter if more than one character was created
        checkReady();
    }
}

function modelLoaded(result) {
    appState.ready.llm = true;
    const lprogress = document.getElementById('llmprogress');
    lprogress.style.display = 'block';
    const w = `${result.progress.toFixed(0)}%`;
    lprogress.style.width = w;
    lprogress.innerText = `LLM: ${w}`;

    if(result.state == 'done') {
        lprogress.style.width = '100%';
        lprogress.innerText = `LLM Loaded`;
        closeBrainDlg();
        
    }
}

function knowledgeReady(result, type) {
    if(type == 'shared') {
        sknowledgeReady(result);
    } else {
        cknowledgeReady(result);
    }

    if(result.state == 'finished') {
        const isready = justBob.characterReady(); // would require name parameter if more than one character was created
        if(isready.error) {console.warn(isready.error); return;}
        appState.ready.character = isready;
    }
}

function cknowledgeReady(result) {
    const ekprogress = document.getElementById('eckprogress');
    ekprogress.style.display = 'block';
    const w = `${result.progress.toFixed(0)}%`;
    ekprogress.style.width = w;
    ekprogress.innerText = `Character Knowledge: ${w}`;
}

function sknowledgeReady(result) {
    const ekprogress = document.getElementById('eskprogress');
    ekprogress.style.display = 'block';
    const w = `${result.progress.toFixed(0)}%`;
    ekprogress.style.width = w;
    ekprogress.innerText = `Shared Knowledge: ${w}`;
}

//------------------------------------------  Text-to-Speech (TTS) model loading and prep
// load the TTS model using the web worker
async function loadTTSModel() {
    let device = 'wasm';
    if(localSystem.gpu.available) device = 'webgpu';

    kttsWorker.callback = ttsmodelLoaded;
    kttsWorker.postMessage({action: 'load', device: device});
}

// set this up in the handler to take caare of both the loading process (to update the progress bar) and the final loaded model
function ttsmodelLoaded(result) {
    const tprogress = document.getElementById('ttsprogress');
    tprogress.style.display = 'block';
    if(result.state == 'loading') {
        tprogress.style.diplay = 'block';
        const w = `${result.progress.toFixed(0)}%`;
        tprogress.style.width = w;
        tprogress.innerText = `Kokoro TTS: ${w}`;
        return;
    }

    if(result.state == 'prep') {
        tprogress.innerText = result.msg;
        return;
    }

    tprogress.innerText = `Kokoro TTS Loaded`;
    appState.ready.tts = true;
    checkReady();
    kttsWorker.callback = gotVoices;
    kttsWorker.postMessage({action: 'voices'});
}

// setup the controls though right now the UI is hidden and the voice fixed to Liam for Bob.
function gotVoices(result) {
    for (const key in result.data) {
        if (result.data.hasOwnProperty(key)) {
          const value = result.data[key];
          voices.list.push({label: key, name: value.name, language: value.language, gender: value.gender, });          
        }
    }
    updateVoices();
    vlist.value = 15;
}

//----------------------------------------------------------------------------- VRM (BOB)
// Initialize the Three.js environment and load the model via Pixiv.js loader
async function initEnvironment() {
    const result = environVRM.new('bob', {parentId: 'bobviewer'});
    if(result.error) {console.warn(`Error creating environment: ${result.error}`); return;}
    environVRM.toggleGrid();
    environVRM.toggleAxes();
    environVRM.toggleControls();
    const vrm = await environVRM.loadVRMFromURL('model/Bob.vrm');
    appState.ready.environ = true;
    setCameraView();
    environVRM.animate();
    startBlinking();
}

// move the camera in to show a portrait of Bob vs. his whole body
function setCameraView() {
    const target = environVRM.cloneTarget();
    if(!target) {console.warn('No target present'); return;}

    const boneNode = environVRM.head();
    if(!boneNode) {console.warn('Head bone not found'); return;}
    const adj = 0.075;
    target.y = boneNode.getWorldPosition(environVRM.vector3()).y + adj;
    if(environVRM.aspect() < 1) environVRM.setCameraPosition(target.x, target.y - (1*adj), 0.8);
    else environVRM.setCameraPosition(target.x, target.y - (1*adj), 0.6);
            
    environVRM.setTarget(target);
}

// check that everything is loaded and ready to go.
function checkReady() {
    if(appState.ready.tts && appState.ready.character && !appState.ready.environ) {
        document.getElementById('initload').style.display = 'none';
        //bobarea.style.visibility = 'visible';
        bobarea.style.display = 'inline-block';
        genarea.style.display = 'inline-block';
        initEnvironment();
        addComment('bot', `Hi!, I'm Bob! I am here to answer your questions about me or how I was made.`);
    }
}

//------------------------------------------- CONVERSATION FUNCTIONS

function prompt() {
    const uq = uprompt.value;
    if(!uq.length) return;

    addComment('user', uq);
    uprompt.value = '';
    justBob.prompt(uq, promptResponse);
}

function promptResponse(a) {
    if(appState.useaudio) {
        const vlabel = voices.list[vlist.value].label;
        kttsWorker.callback = haveAudio;
        kttsWorker.postMessage({action: 'generate', text: a[0].text, voice: vlabel});
    } else {
        addComment('bot', a[0].text);
        uprompt.focus();
    }
}

function addComment(who, text) {
    let classname = '';
    let char = '';

    if(who == 'bot') {
        classname = 'botchat';
        char = '<b>Bob:</b> ';
    } else {
        classname = 'userchat';
        char = '<b>You:</b> ';
    }

    let html = `<div class="${classname}">${char}${text}</div>`;
    stext.innerHTML += html;
    stext.scrollTop = stext.scrollHeight;
}

//------------------------------------------- VOICE functions

function updateVoices() {
    let g = 'Female', l = 'en-us';
    if(gender.value == 1) {g = 'Male'};
    if(lang.value == 1) {l = 'en-gb'};
    
    voices.index = 0;
    vlist.innerHTML = '';
    for(let i=0; i<voices.list.length; i++) {
        if(voices.list[i].gender != g || voices.list[i].language != l) continue;

        var opt = document.createElement('option');
        opt.value = i;
        opt.innerHTML = `${voices.list[i].name}`;
        vlist.appendChild(opt);
    }
}

function inputChange() {
    audarea.style.display = 'none';
}

async function generateAudio() {
    const text = stext.value;
    if(text.length < 1) return;

    const spokenText = text.toLowerCase();
    const vowelStream = spokenText.replace(/[^aeiou]/g, '').split('');
    appState.vowelStream = vowelStream;
    appState.vowelIndex = 0;


    const vlabel = voices.list[vlist.value].label;

    //kttsWorker.aistatus.innerHTML = 'Generating speech...';
    kttsWorker.callback = haveAudio;
    kttsWorker.postMessage({action: 'generate', text: text, voice: vlabel});
}

function haveAudio(result) {
    console.log(result);
    audioData.raw = Array.from(result.data.audio);
    audioData.generated = [... audioData.raw];
    audioData.rate = result.data.sampling_rate;

    updateAudioElement();
    addComment('bot', result.text);
    audplayer.play();
}

function talkStart() {
    if (appState.talking) return;

    const vrm = environVRM.vrm();
    if (!vrm || !vrm.expressionManager || !appState.analyser || !appState.dataArray) return;

    appState.talking = true;

    let currentValue = 0;
    let lastSwitchTime = performance.now();
    let currentViseme = 'aa';

    function animateMouth() {
        if (!appState.talking) return;

        const now = performance.now();

        // === Viseme cycling every 120ms based on vowel text ===
        if (now - lastSwitchTime > 120 && appState.vowelStream?.length > 0) {
            const v = appState.vowelStream[appState.vowelIndex % appState.vowelStream.length];
            currentViseme = vowelVisemeMap[v] || 'aa';
            appState.vowelIndex++;
            lastSwitchTime = now;
        }

        // === Amplitude analysis ===
        appState.analyser.getByteTimeDomainData(appState.dataArray);

        let sum = 0;
        for (let i = 0; i < appState.dataArray.length; i++) {
            const val = appState.dataArray[i] - 128;
            sum += val * val;
        }
        const rms = Math.sqrt(sum / appState.dataArray.length);
        const targetValue = Math.min(rms / 32, 1.0);
        currentValue += (targetValue - currentValue) * appState.easing;

        const outputValue = currentValue < appState.gate ? 0 : currentValue;
        //console.log(outputValue);

        // === Drive only the current viseme ===
        mouthShapes.forEach(name => vrm.expressionManager.setValue(name, 0));
        vrm.expressionManager.setValue(currentViseme, outputValue);
        vrm.expressionManager.update();

        requestAnimationFrame(animateMouth);
    }

    animateMouth();
}

function talkStop() {
    appState.talking = false;

    const vrm = environVRM.vrm();
    if (!vrm || !vrm.expressionManager) return;

    vrm.expressionManager.setValue('aa', 0);
    vrm.expressionManager.update();
    uprompt.focus();
}

//----------------------------------------------------- BLINKING

function startBlinking() {
    if (appState.blinkTimer) return;

    const vrm = environVRM.vrm();
    if (!vrm || !vrm.expressionManager) return;

    function blinkOnce() {
        if (!appState.isBlinking) return;

        // Close eyes
        vrm.expressionManager.setValue('blink', 1.0);
        vrm.expressionManager.update();

        // Open eyes after short delay
        setTimeout(() => {
            vrm.expressionManager.setValue('blink', 0.0);
            vrm.expressionManager.update();

            // Schedule next blink
            scheduleNextBlink();
        }, 100 + Math.random() * 100); // ~100ms blink
    }

    function scheduleNextBlink() {
        const delay = 3000 + Math.random() * 2000; // 3–5 seconds
        appState.blinkTimer = setTimeout(blinkOnce, delay);
    }

    appState.isBlinking = true;
    scheduleNextBlink();
}

function stopBlinking() {
    appState.isBlinking = false;
    clearTimeout(appState.blinkTimer);
    appState.blinkTimer = null;

    const vrm = environVRM.vrm();
    if (vrm && vrm.expressionManager) {
        vrm.expressionManager.setValue('blink', 0.0);
        vrm.expressionManager.update();
    }
}


//---------------------------------------------------- AUDIO FUNCTIONS

function updateAudioElement() {
    const audlink = document.getElementById('audlink');
    let blob = null;
    let filename = '';

    if (afmt.value == 0) {
        const wavBuffer = createWavBuffer();
        blob = new Blob([wavBuffer], { type: 'audio/wav' });
        filename = 'speech.wav';
    } else {
        const mp3Buffer = createMP3();
        blob = new Blob(mp3Buffer, { type: 'audio/mp3' });
        filename = 'speech.mp3';
    }

    const url = URL.createObjectURL(blob);
    audplayer.src = url;

    // ==== Only create audio context and analyser once ====
    if (!appState.audioContext) {
        appState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        appState.source = appState.audioContext.createMediaElementSource(audplayer);
        appState.analyser = appState.audioContext.createAnalyser();
        appState.analyser.fftSize = 512;
        appState.dataArray = new Uint8Array(appState.analyser.frequencyBinCount);

        appState.source.connect(appState.analyser);
        appState.analyser.connect(appState.audioContext.destination);
    }

    // ==== Reset talking state ====
    appState.talking = false;
}

function createWavBuffer() {
    if (!audioData.raw || !audioData.raw.length) {
        console.warn('No audio data available for WAV export.');
        return null;
    }

    const numChannels = 1; // Mono audio
    const numSamples = audioData.raw.length;
    const bitsPerSample = 16; // 16-bit PCM

    const headerSize = 44;
    const dataSize = numSamples * numChannels * (bitsPerSample / 8);
    const fileSize = headerSize + dataSize;

    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    // Write WAV header
    writeString(view, 0, 'RIFF'); // ChunkID
    view.setUint32(4, fileSize - 8, true); // ChunkSize
    writeString(view, 8, 'WAVE'); // Format
    writeString(view, 12, 'fmt '); // Subchunk1ID
    view.setUint32(16, 16, true); // Subchunk1Size (PCM format)
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, audioData.rate, true);
    view.setUint32(28, audioData.rate * numChannels * (bitsPerSample / 8), true);
    view.setUint16(32, numChannels * (bitsPerSample / 8), true); // BlockAlign
    view.setUint16(34, bitsPerSample, true); // BitsPerSample
    writeString(view, 36, 'data'); // Subchunk2ID
    view.setUint32(40, dataSize, true); // Subchunk2Size

    // Write audio data
    let offset = headerSize;
    for (let i = 0; i < numSamples; i++) {
        const sample = Math.max(-1, Math.min(1, audioData.raw[i])); // Clamp to [-1, 1]
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
    }

    return buffer;
}

function createMP3() {
    const channels = 1; //1 for mono or 2 for stereo
    const sampleRate = audioData.rate; //44100; //44.1khz (normal mp3 samplerate)
    const kbps = 128; //encode 128kbps mp3
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps);

    const sampboost = audioData.raw.map(element => element * 32767);
    const samples = Int16Array.from(sampboost); //new Int16Array(44100); //one second of silence (get your data from the source you have)
    const sampleBlockSize = 576; //1152; //can be anything but make it a multiple of 576 to make encoders life easier

    const mp3Data = [];
    for (var i = 0; i < samples.length; i += sampleBlockSize) {
        const sampleChunk = samples.subarray(i, i + sampleBlockSize);
        //console.log(sampleChunk);
        const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
        if (mp3buf.length > 0) {mp3Data.push(mp3buf);}
    }
    const mp3buf = mp3encoder.flush();   //finish writing mp3

    if (mp3buf.length > 0) {
        mp3Data.push(new Int8Array(mp3buf));
    }

    return mp3Data;
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}


