import { environVRM } from '../shared/js/environvrm.mjs';
import { localSystem, characterManager } from '../shared/js/character.mjs'
import { readIt } from '../shared/js/bspeech.mjs'

const aivoices = {
    index: 0,
    list: [],
}

const bvoices = {
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
    useaudio: false,
    ttstype: 'browser',
    modelID: '',
    usellm: false,
    forceCPU: false,
    last: {
        prompt: '',
        response: '',
    }
}

const justBob = new characterManager();
justBob.add('Bob', "You are a helpful avatar named Bob who answers users questions. Answer as if you are Bob. Answer in the first person when talking about Bob since you are playing the role of Bob.");

const tglvoice = document.getElementById('togglevoice');
const ttstype = document.getElementById('ttstype');

const braindlg = document.getElementById('braindlg');
const usellm = document.getElementById('usellm');
const selmdl = document.getElementById('selmdl');
const brainaction = document.getElementById('brainaction');

const bobarea = document.getElementById('bobarea');
const genarea = document.getElementById('genarea');
const gender = document.getElementById('gender');
const lang = document.getElementById('language');
const bvlist = document.getElementById('bvoicelist');
const avlist = document.getElementById('avoicelist');
const stext = document.getElementById('stext');
const afmt = document.getElementById('format');
const uprompt = document.getElementById('uprompt');

const audarea = document.getElementById('audioarea');
const audplayer = document.getElementById('audioPlayer');

export function appInit() {
    document.getElementById('pagetitle').innerHTML = 'FlexiBob';
    addListeners();
    setupModels();
    loadKnowledge();
}

function addListeners() {
    if(document.readyState !== 'complete') {setTimeout(addListeners, 30); return;}

    setBrowserVoices();

    document.getElementById('mouth').addEventListener('click', (event) => {showVoiceDlg();});
    tglvoice.addEventListener('change', (event) => {
        if(tglvoice.checked) {
            appState.useaudio = true;
            ttstype.style.display = 'inline-block';
            if(ttstype.value == 'ai') {
                document.getElementById('aivoice').style.display = 'block';
                document.getElementById('browservoice').style.display = 'none';
            } else {
                document.getElementById('aivoice').style.display = 'none';
                document.getElementById('browservoice').style.display = 'block';
            }
        } else {
            appState.useaudio = false;
            ttstype.style.display = 'none';
            document.getElementById('aivoice').style.display = 'none';
            document.getElementById('browservoice').style.display = 'none';
        }
    });
    ttstype.addEventListener('change', (event => {
        if(ttstype.value == 'ai') {
            appState.ttstype = 'ai';
            document.getElementById('browservoice').style.display = 'none';
            loadTTSModel();
        } else {
            appState.ttstype = 'browser';
            document.getElementById('aivoice').style.display = 'none';
            document.getElementById('browservoice').style.display = 'block';
        }
    }));
    document.getElementById('mouthdone').addEventListener('click', (event) => {closeVoiceDlg();});

    document.getElementById('brain').addEventListener('click', (event) => {showBrainDlg();});
    document.getElementById('kbase').addEventListener('click', (event) => {knowledgeDlg();});
    document.getElementById('kbdone').addEventListener('click', (event) => {closeKBDlg();});

    document.getElementById('togglecpuonly').addEventListener('change', (event) => {
        appState.forceCPU = document.getElementById('togglecpuonly').checked;
        setupModels();
    });
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

    gender.addEventListener('change', (event) => {updateAIVoices(); inputChange();});
    lang.addEventListener('change', (event) => {updateAIVoices(); inputChange();});
    avlist.addEventListener('change', (event) => {inputChange();});

    audplayer.addEventListener('play', (event) => {setTimeout(() => talkStart());});
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
    const useGPU = localSystem.gpu.available && !appState.forceCPU;

    selmdl.innerHTML = '';
    let index = -1;
    if(!usellm.checked) {    
        const opt = document.createElement('option');
        opt.value = -1;
        opt.innerHTML = `None`;
        selmdl.appendChild(opt);
    } else {
        for(let i=0; i<count; i++) {
            if(useGPU && modelInfo[i].gpu == 'no') continue;
            if(!useGPU && modelInfo[i].gpu == 'yes') continue;

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

async function loadKnowledge() {
    const leresult = justBob.loadEmbeddingModel({embedCallback: emodelLoaded}); // loads the embedding model in the library
                                                                                // sets the callback frunction to call when loaded.
    if(leresult.error) console.error(leresult.error);
    const bobknowledge = {                                              // structure for adding knowlege to Bob
        faq: {url: 'data/faqcore.csv', header: true, name:'faqcore'},   // a single FAQ can be included.  header: true is a header row.
        info: [                                                         // info is text files which has a row for each file included.
            {url: 'data/bobcore.txt', name: 'bobcore'}
        ],
        callback: knowledgeReady,       // function to call when the knowledge has been embedded and ready to go
    }
    const ckresult = await justBob.addCharacterKnowledge(bobknowledge);  // pass the knowledge object to the library
    if(ckresult.error) console.error(ckresult.error);
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
        forceCPU: appState.forceCPU,
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
    bvoices.index = bvoices.list[bvlist.value].index;
    if(appState.ready.tts && appState.ttstype == 'browser') {unloadTTS();}

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
    if(appState.ready.tts) {
        document.getElementById('aivoice').style.display = 'block';
        document.getElementById('browservoice').style.display = 'none';
        return;
    }
    document.getElementById('mouthdone').style.display = 'none';
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
        tprogress.style.display = 'block';
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
    tprogress.style.display = 'none';
    document.getElementById('mouthdone').style.display = 'block';
    appState.ready.tts = true;
    kttsWorker.callback = gotVoices;
    kttsWorker.postMessage({action: 'voices'});
}

// setup the controls though right now the UI is hidden and the voice fixed to Liam for Bob.
function gotVoices(result) {
    for (const key in result.data) {
        if (result.data.hasOwnProperty(key)) {
          const value = result.data[key];
          aivoices.list.push({label: key, name: value.name, language: value.language, gender: value.gender, });          
        }
    }
    updateAIVoices();
    avlist.value = 15;

    document.getElementById('aivoice').style.display = 'block';
}

function unloadTTS() {
    kttsWorker.callback = null;
    kttsWorker.postMessage({action: 'unload'});
}

//----------------------------------------------------------------------------- VRM (BOB)
// Initialize the Three.js environment and load the model via Pixiv.js loader
async function initEnvironment() {
    const result = environVRM.new('bob', {parentId: 'bobviewer'});  // initialize the environment and set it to the diplay div
    if(result.error) {console.warn(`Error creating environment: ${result.error}`); return;}
    environVRM.toggleGrid(); // we don't want the grid on for display the portrait of Bob
    environVRM.toggleAxes(); // we don't need the Axes here either
    environVRM.toggleControls(); // this turns off the controls for moving and rotating the view
    const vrm = await environVRM.loadVRMFromURL('model/Bob.vrm'); // we load the model from the fixed URL
    appState.ready.environ = true;
    setCameraView();
    environVRM.animate(); // we begin the animation loop
    startBlinking(); // start Bob blinking for that "real feel"
}

// move the camera in to show a portrait of Bob vs. his whole body
function setCameraView() {
    const target = environVRM.cloneTarget(); // get the target for where the camera view is facing
    if(!target) {console.warn('No target present'); return;}

    const boneNode = environVRM.head(); // find the head "bone" so that we can set the view to portrait
    if(!boneNode) {console.warn('Head bone not found'); return;}
    const adj = 0.075; // This is just a tweak to get the head view the way I wanted it.
    target.y = boneNode.getWorldPosition(environVRM.vector3()).y + adj; // adjust the y height to be more at face level vs mid-body
    if(environVRM.aspect() < 1) environVRM.setCameraPosition(target.x, target.y - (1*adj), 0.8); // set the camera position
    else environVRM.setCameraPosition(target.x, target.y - (1*adj), 0.6);
            
    environVRM.setTarget(target);
}

// check that everything is loaded and ready to go.
function checkReady() {
    if(appState.ready.character && !appState.ready.environ) {
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
    const uq = uprompt.value;  // Get the users input from the text box
    if(!uq.length) return;     // if nothing is entered, return

    addComment('user', uq);  // adds the users comment to the user interface (UI) -- this would be custom to the project
    uprompt.value = '';      // resets the text box to empty
    justBob.prompt(uq, promptResponse);  // Send the user's text to the character library -- the rest is done behind the scenes
                                         // promptResponse is where the results are returned when ready this can be a custom function
    appState.last.prompt = uq;
    appState.last.response = '';
    thinking();
}

function promptResponse(a) {
    appState.last.response = a[0].text;

    if(appState.useaudio) { // if audio is selected to be used
        //---------------------------------------------------------------------

        if(appState.ttstype == 'ai'){                           // if AI TTS is being used
            const vlabel = aivoices.list[avlist.value].label;   // get the voice that is being used
            kttsWorker.callback = haveAudio;                    // function to call when the audio is ready
            kttsWorker.postMessage({action: 'generate', text: a[0].text, voice: vlabel}); // text passed to the Kokoro TTS worker
        } else {                                        // if Browser TTS is being used
            readIt.setVoicei(bvoices.index);            // Set the voice used in the Browser TTS
            readIt.speak(a[0].text, talkStart);  // Speak the text -- on start, this function also calls the animation code
            addComment('bot', a[0].text);               // adds the response to the user interface
        }
    } else { // if no audio is selected
        addComment('bot', a[0].text);   // adds the comment to the UI
        uprompt.focus();                // sets the focus to the user text box to get ready for the next question
    }
}

const thinkingParams = {
    active: false,
    aIndex: 5,
    anim: [
        ['...', '....', '.....', '......', '.......', '........', '.........', '..........', '...........', '............'],
        ['\\', '|', '/', '-'],
        ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
        ['◐', '◓', '◑', '◒'],
        ["◜", "◠", "◝", "◞", "◡", "◟"],
        [ "(&nbsp;●&nbsp;&nbsp;&nbsp;&nbsp;)", "(&nbsp;&nbsp;●&nbsp;&nbsp;&nbsp;)", "(&nbsp;&nbsp;&nbsp;●&nbsp;&nbsp;)", "(&nbsp;&nbsp;&nbsp;&nbsp;●&nbsp;)", "(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;●)", "(&nbsp;&nbsp;&nbsp;&nbsp;●&nbsp;)", "(&nbsp;&nbsp;&nbsp;●&nbsp;&nbsp;)", "(&nbsp;&nbsp;●&nbsp;&nbsp;&nbsp;)", "(&nbsp;●&nbsp;&nbsp;&nbsp;&nbsp;)", "(●&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)" ],
        [ "🕛 ", "🕐 ", "🕑 ", "🕒 ", "🕓 ", "🕔 ", "🕕 ", "🕖 ", "🕗 ", "🕘 ", "🕙 ", "🕚 " ],
        [ "🌑 ", "🌒 ", "🌓 ", "🌔 ", "🌕 ", "🌖 ", "🌗 ", "🌘 " ],
    ],
    interval: 150,
    index: 0,
}

function thinking() {
    let html = `<div id="botthinking" class="botchat" style="width: 300px;">Thinking &nbsp;&nbsp;${thinkingParams.anim[thinkingParams.aIndex][thinkingParams.index]}</div>`;
    stext.innerHTML += html;
    stext.scrollTop = stext.scrollHeight;
    thinkingParams.active = true;
    setTimeout(thinkingNext, thinkingParams.interval);
}

function thinkingNext() {
    if(!thinkingParams.active) return;
    const tele = document.getElementById('botthinking');
    if(!tele) return;

    thinkingParams.index++;
    if(thinkingParams.index >= thinkingParams.anim[thinkingParams.aIndex].length) thinkingParams.index = 0;
    tele.innerHTML = `Thinking &nbsp;&nbsp;${thinkingParams.anim[thinkingParams.aIndex][thinkingParams.index]}`;    
    setTimeout(thinkingNext, thinkingParams.interval);
}

function thinkingStop() {
    thinkingParams.active = false;
    thinkingParams.index = 3;
    
    const tele = document.getElementById('botthinking');
    if(!tele) return;
    tele.remove();
}

function addComment(who, text) {
    let classname = '';
    let char = '';

    if(who == 'bot') {
        classname = 'botchat';
        char = '<b>Bob:</b> ';
        thinkingStop();
    } else {
        classname = 'userchat';
        char = '<b>You:</b> ';
    }

    let html = `<div class="${classname}">${char}${text}</div>`;
    stext.innerHTML += html;
    stext.scrollTop = stext.scrollHeight;
}

//------------------------------------------- VOICE functions

function setBrowserVoices() {
    const browservoices = readIt.getVoiceList();
    bvoices.list = [];
    let counter = 0;
    for(let i=0; i<browservoices.length; i++) {
        if(browservoices[i].lang == 'en-US' || browservoices[i].lang == 'en-GB') {
            bvoices.list.push({label: browservoices[i].voiceURI, name: browservoices[i].name, language: browservoices[i].lang, index: i,});
            var opt = document.createElement('option');
            opt.value = counter;
            opt.innerHTML = `${bvoices.list[counter].name}`;
            bvlist.appendChild(opt);
            counter++;
        }
    }
    bvlist.value = 0;
    bvoices.index = bvoices.list[bvlist.value].index;

    readIt.setOnEnd(talkStop);
}

function updateAIVoices() {
    let g = 'Female', l = 'en-us';
    if(gender.value == 1) {g = 'Male'};
    if(lang.value == 1) {l = 'en-gb'};
    
    aivoices.index = 0;
    avlist.innerHTML = '';
    for(let i=0; i<aivoices.list.length; i++) {
        if(aivoices.list[i].gender != g || aivoices.list[i].language != l) continue;

        var opt = document.createElement('option');
        opt.value = i;
        opt.innerHTML = `${aivoices.list[i].name}`;
        avlist.appendChild(opt);
    }
}

function inputChange() {
    audarea.style.display = 'none';
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
    const vrmmdl = environVRM.vrmModel();
    vrmmdl.talkStart(appState.last.response);
}

function talkStop() {
    const vrmmdl = environVRM.vrmModel();
    vrmmdl.talkStop();
    uprompt.focus();
}

//----------------------------------------------------- BLINKING

function startBlinking() {
    const vrmmdl = environVRM.vrmModel();
    vrmmdl.blinkStart();
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


