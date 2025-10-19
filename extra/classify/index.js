import { csvHandler } from '../../shared/js/csv.mjs'
import { sysDevicesInitialize } from '../../shared/js/device.mjs';

export const localSystem = await sysDevicesInitialize();

const classifier = {
    csvname: '',
    jsonname: '',
    csv: [],
    labels: [],
    data: {
        text: [],
        labels: [],
        embed: [],
        train: [],
    },
    net: null,
    model: null,
}

const toptdefaults = {
    iterations: 5000,
    errorThresh: 0.0005,
    learningRate: 0.003, // scales with delta to effect training rate --> number between 0 and 1
};

const toptions = {
    iterations: 5000,
    errorThresh: 0.0005,
    learningRate: 0.003, // scales with delta to effect training rate --> number between 0 and 1
    momentum: 0.1, // scales with next layer's change value --> number between 0 and 1
    validation: 0.2,
};

const mdlParams = {
    activation: 'tanh',
    hiddenLayers: [192],
};

export function appInit() {
    document.getElementById('pagetitle').textContent = 'Brain.js MLP';
    loadEmbedModel();
    addListeners();
    setDefaultTrainingOptions()
}

function loadEmbedModel() {
    llmWorker.ecallback = embedModelLoaded;
    llmWorker.postMessage({action: 'eload', gpu: localSystem.gpu.available});
}

function embedModelLoaded(result) {
    const eprogress = document.getElementById('eprogress');
    const w = `${result.progress.toFixed(0)}%`;
    eprogress.style.width = w;
    eprogress.innerText = `Snowflake: ${w}`;

    if(result.state == 'done') {
        eprogress.style.width = '100%';
        eprogress.innerText = ``;
        eprogress.style.display = 'none';
        document.getElementById('main').style.display = 'block';
    }
}

function addListeners() {
    if(document.readyState !== 'complete') {setTimeout(addListeners, 30); return;}

    document.getElementById('trn').addEventListener('click', (event) => {
        document.getElementById('main').style.display = 'none';
        document.getElementById('train').style.display = 'inline-block';
        if(classifier.data.train.length) {
            document.getElementById('sdata').style.border = '3px solid #49637a';
            document.getElementById('strain').style.border = '3px solid #abc0d1';
            document.getElementById('datapanel').style.display = 'none';
            document.getElementById('trainpanel').style.display = 'inline-block';
        } else {
            document.getElementById('sdata').style.border = '3px solid #abc0d1';
            document.getElementById('strain').style.border = '3px solid #49637a';
            document.getElementById('datapanel').style.display = 'inline-block';
            document.getElementById('trainpanel').style.display = 'none';
        }
    });
    document.getElementById('rmdl').addEventListener('click', (event) => {
        document.getElementById('main').style.display = 'none';
        document.getElementById('train').style.display = 'none';
        document.getElementById('run').style.display = 'inline-block';
        if(classifier.model) {
            document.getElementById('inference').style.visibility = 'visible';
            document.getElementById('prompt').focus();
        } else {
            document.getElementById('inference').style.visibility = 'hidden';
        }
    });


    document.getElementById('mainfromtrain').addEventListener('click', (event) => {
        document.getElementById('main').style.display = 'block';
        document.getElementById('train').style.display = 'none';
    });
    document.getElementById('restarttrain').addEventListener('click', (event) => {restartFromLoad();});
    document.getElementById('loaddata').addEventListener('click', (event) => {openLocalText('*.csv', dataReady);});
    document.getElementById('embeddata').addEventListener('click', (event) => {embedData();});
    document.getElementById('traindefaults').addEventListener('click', (event) => {setDefaultTrainingOptions();});
    document.getElementById('trainmodel').addEventListener('click', (event) => {trainModel();});
    document.getElementById('savemdl').addEventListener('click', (event) => {saveModel();});
    document.getElementById('runmdl').addEventListener('click', (event) => {document.getElementById('rmdl').dispatchEvent(new Event('click'));});

    document.getElementById('mainfromrun').addEventListener('click', (event) => {
        document.getElementById('main').style.display = 'block';
        document.getElementById('run').style.display = 'none';
    });
    document.getElementById('loadmodel').addEventListener('click', (event) => {openLocalText('*.json', mdlLoadReady);});
    document.getElementById('prompt').addEventListener('keypress', (event) => {
        if (event.key === "Enter") {event.preventDefault(); prompt();}
    });
    document.getElementById('rprompt').addEventListener('click', (event) => {prompt();});
}

function resetClassifier() {
    classifier.csvname = '';
    classifier.jsonname = '';
    classifier.csv = [];
    classifier.labels = [];
    classifier.data = {
        text: [],
        labels: [],
        embed: [],
        train: [],
    };
    classifier.net = null;
    classifier.model = null;

    document.getElementById('modelname').textContent = '';
    document.getElementById('filename').textContent = ``;
    document.getElementById('records').textContent = ``;
    document.getElementById('fields').textContent = ``;
    document.getElementById('embeddata').style.display = 'none';
    document.getElementById('tstatus').textContent = '';
}

function restartFromLoad() {
    resetClassifier();
    document.getElementById('embeddata').style.display = 'none';
    document.getElementById('filename').textContent = ``;
    document.getElementById('records').textContent = ``;
    document.getElementById('fields').textContent = ``;
    document.getElementById('sdata').style.border = '3px solid #abc0d1';
    document.getElementById('strain').style.border = '3px solid #49637a';
    document.getElementById('datapanel').style.display = 'inline-block';
    document.getElementById('trainpanel').style.display = 'none';
    document.getElementById('modelopts').style.display = 'none';
}

function dataReady(file) {
    resetClassifier();
    document.getElementById('filename').textContent = ``;
    document.getElementById('records').textContent = ``;
    document.getElementById('fields').textContent = ``;

    classifier.csvname = file.name;
    classifier.jsonname = file.name.split('.')[0] + '.json';
    classifier.csv = csvHandler.toArray(file.data);
    if(document.getElementById('hasheaders').checked) {classifier.csv.shift();}
    
    if(!classifier.csv.length) {
        document.getElementById('filename').textContent = 'No records loaded';
        classifier.csv = [];
        return;
    }
    if(classifier.csv[0].length != 2) {
        document.getElementById('filename').textContent = `Should be 2 fields not ${classifier.csv[0].length} `;
        classifier.csv = [];
        return;
    }

    // split data for embedding and to get labels
    for(let i=0; i<classifier.csv.length; i++) {
        classifier.data.text.push(classifier.csv[i][0]);
        classifier.data.labels.push(classifier.csv[i][1]);
    }
    classifier.labels = uniqueArray(classifier.data.labels);

    document.getElementById('filename').textContent = `${classifier.csvname}`;
    document.getElementById('records').textContent = `${classifier.csv.length} Records`;
    document.getElementById('fields').textContent = `Labels: ${classifier.labels.join(", ")}`;
    document.getElementById('embeddata').style.display = 'inline-block';
}

function embedData() {
    if(!classifier.data.text.length) {return;}
    classifier.data.embed = [];
    llmWorker.ecallback = embedReady;
    llmWorker.postMessage({action: 'embed', sentences: classifier.data.text, q: 5, tag: ''});
}

function embedReady(result) {
    const eprogress = document.getElementById('embedprogress');
    if(result.state == 'embedding') {
        const w = `${result.progress.toFixed(0)}%`;
        eprogress.style.width = w;
        eprogress.innerText = `Embedding: ${w}`;
        return;
    }

    if(result.data.length != classifier.data.text.length) {
        console.warn('Embedding array size mismatch');
        return;
    }

    classifier.data.embed = [...result.data];
    classifier.data.train = [];
    for(let i = 0; i<classifier.data.embed.length; i++) {
        const label = {};
        label[classifier.data.labels[i]] = 1;
        classifier.data.train.push({input: classifier.data.embed[i], output: label});
    }
    classifier.data.train = shuffleArray(classifier.data.train);
    classifier.data.train = shuffleArray(classifier.data.train);
    eprogress.innerText = '';
    eprogress.style.width = 0;

    document.getElementById('sdata').style.border = '3px solid #49637a';
    document.getElementById('strain').style.border = '3px solid #abc0d1';
    document.getElementById('datapanel').style.display = 'none';
    document.getElementById('trainpanel').style.display = 'inline-block';
}

function setDefaultTrainingOptions() {
    document.getElementById('iterations').value = toptdefaults.iterations;
    document.getElementById('errort').value = toptdefaults.errorThresh;
    document.getElementById('learnr').value = toptdefaults.learningRate;
    document.getElementById('hidden').value = 192;
}

function trainModel() {
    document.getElementById('modelopts').style.display = 'none';
    toptions.iterations = document.getElementById('iterations').value * 1;
    toptions.errorThresh = document.getElementById('errort').value * 1;
    toptions.learningRate = document.getElementById('learnr').value * 1;
    mdlParams.hiddenLayers = document.getElementById('hidden').value.split(',').map(x => parseInt(x, 10));

    brainWorker.callback = trainReady;
    brainWorker.bstatus = document.getElementById('tstatus');
    brainWorker.postMessage({action: 'train', data: structuredClone(classifier.data.train), params: toptions, mdlparams: mdlParams, gpu: localSystem.gpu.available})
}

function trainReady(json) {
    classifier.net = json;
    classifier.model = new brain.NeuralNetwork();
    classifier.model.fromJSON(classifier.net);
    document.getElementById('modelopts').style.display = 'block';
}

function saveModel() {
    if(!classifier.net) return;
    downloadJson(classifier.net, classifier.jsonname);
    document.getElementById('modelname').textContent = classifier.jsonname;
}

function downloadJson(jsonObject, filename) {
    const jsonString = JSON.stringify(jsonObject, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;

    document.body.appendChild(a); // Append to body to make it clickable in some browsers
    a.click();
    document.body.removeChild(a); // Remove after click

    URL.revokeObjectURL(objectUrl);
}

function mdlLoadReady(file) {
    resetClassifier();
    classifier.jsonname = file.name.split('.')[0] + '.json';
    document.getElementById('modelname').textContent = classifier.jsonname;
    classifier.net = JSON.parse(file.data);
    classifier.model = new brain.NeuralNetwork();
    classifier.model.fromJSON(classifier.net);
    classifier.labels = Object.keys(classifier.net.outputLookup);
    document.getElementById('inference').style.visibility = 'visible';
    document.getElementById('prompt').focus();
}

function prompt() {
    if(!classifier.model) return;
    const ptext = document.getElementById('prompt').value;
    if(!ptext.length) return;
    llmWorker.ecallback = epromptReady;
    llmWorker.postMessage({action: 'embed', sentences: [ptext], q: 5, tag: ''});
}

function epromptReady(result) {
    if(result.state != 'done') return;
    const output = classifier.model.run(result.data[0]);
    const noutput = softmaxNormalize(output, 0.2);
    const entries = Object.entries(noutput);
    entries.sort((a, b) => b[1] - a[1]);

    const prompt = document.getElementById('prompt');
    let html = `<div><u>${prompt.value}</u></div><br><div><b>${entries[0][0]}: ${entries[0][1].toFixed(3)}</b></div>`;
    for(let i=1; i<entries.length; i++) {
        html += `<div>${entries[i][0]}: ${entries[i][1].toFixed(3)}</div>`;
    }
    document.getElementById('iresult').innerHTML = html;
    prompt.value = '';
    prompt.focus();
}


function softmaxNormalize(raw, temperature = 1.0) {
    const LABELS = classifier.labels;
    const vals = LABELS.map(k => (raw[k] ?? 0));
    const t = Math.max(1e-6, temperature);
    const max = Math.max(...vals);
    const exps = vals.map(v => Math.exp((v - max) / t));
    const sum  = exps.reduce((a,b)=>a+b, 0) || 1;
    const out = {};
    LABELS.forEach((k,i) => out[k] = exps[i] / sum);
    return out; // sums to ~1
}