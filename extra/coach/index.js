import { csvHandler } from '../../shared/js/csv.mjs'


const coaches = [
    {name: 'Run Heavy', data_url: 'data/runheavy_2a.csv', data: [], train: [], model_url: 'models/runheavy 7269.json', json: null, model: null},
    {name: 'Balanced', data_url: 'data/balanced_2.csv', data: [], train: [], model_url: 'models/balanced 6967.json', json: null, model: null},
    {name: 'Pass Heavy', data_url: 'data/passheavy_2a.csv', data: [], train: [], model_url: 'models/passheavy 6564.json', json: null, model: null},
];

const toptions = {
    iterations: 20000,
    errorThresh: 0.02,
    learningRate: 0.001, //0.3, // scales with delta to effect training rate --> number between 0 and 1
    momentum: 0.01, // scales with next layer's change value --> number between 0 and 1
    validation: 0.2,
};

const mdlParams = {
    activation: 'sigmoid',
    hiddenLayers: [16, 8],
};

const ballon = document.getElementById('ballon');
ballon.spot = 80;

export function appInit() {
    document.getElementById('pagetitle').textContent = 'Coach Bob and Friends';
    setupControls();
    addListeners();
    loadModels();
    loadData();
}

function setupControls() {
    const hs = document.getElementById('homescore');
    const os = document.getElementById('oppscore');
    const cmin = document.getElementById('clockmin');
    const csec = document.getElementById('clocksec');
    const dist = document.getElementById('distance');

    let i;
    for(i=0; i<=70; i++) {
        const newOption = document.createElement('option');
        newOption.value = i;
        newOption.text = i;
        hs.appendChild(newOption);

        const newOption2 = document.createElement('option');
        newOption2.value = i;
        newOption2.text = i;
        os.appendChild(newOption2);
    }


    for(i=0; i<15; i++) {
        const newOption = document.createElement('option');
        newOption.value = i;
        newOption.text = i;
        cmin.appendChild(newOption);
    }

    for(i=1; i<60; i++) {
        const newOption = document.createElement('option');
        newOption.value = i;
        newOption.text = i;
        csec.appendChild(newOption);
    }

    for(i=1; i<40; i++) {
        const newOption = document.createElement('option');
        newOption.value = i;
        newOption.text = i + ' yards';
        dist.appendChild(newOption);
    }

    cmin.value = 14;
    csec.value = 30;
    dist.value = 10;
}

function addListeners() {
    if(document.readyState !== 'complete') {setTimeout(addListeners, 30); return;}

    document.getElementById('trainRHmdl').addEventListener('click', (event) => {trainRunHeavy();});
    document.getElementById('trainBLmdl').addEventListener('click', (event) => {trainBalanced();});
    document.getElementById('trainPHmdl').addEventListener('click', (event) => {trainPassHeavy();});

    document.getElementById('fieldimg').addEventListener('click', (event)=>{
        ballPlacement(event.offsetX, event.offsetY);
    });

    document.getElementById('callplay').addEventListener('click', (event) => {callPlay();});

    document.getElementById('gototrain').addEventListener('click', (event) => {
        document.getElementById('train').style.display = 'block';
        document.getElementById('inference').style.display = 'none';
    });

    document.getElementById('gotomain').addEventListener('click', (event) => {
        document.getElementById('train').style.display = 'none';
        document.getElementById('inference').style.display = 'block';
    });
    
}

function ballPlacement(x, y) {
    // 56 left -> 444 right
    let pos = Math.round((x - 56) / (444 - 56) * 100);
    if(pos < 1) pos = 1;
    if(pos > 99) pos = 99;
    ballon.spot = 100 - pos;
    if(ballon.spot > 50) {
        ballon.textContent = 100-ballon.spot;
    } else {
        ballon.textContent = ballon.spot;
    }
    document.getElementById('ballpos').style.left = x + 'px';
}

async function loadModels() {
    coaches[0].json = await jsonFromURL(coaches[0].model_url);
    coaches[1].json = await jsonFromURL(coaches[1].model_url);
    coaches[2].json = await jsonFromURL(coaches[2].model_url);
    
    createModels();
}

async function loadData() {
    coaches[0].data = await csvHandler.fromURL(coaches[0].data_url);
    coaches[1].data = await csvHandler.fromURL(coaches[1].data_url);
    coaches[2].data = await csvHandler.fromURL(coaches[2].data_url);
    
    createTrainData();
}

async function jsonFromURL(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text =  await response.text();
        return JSON.parse(text);
    } catch (error) {
        console.error("Failed to fetch JSON Model:", error);
        throw error;
    }
}

function createModels() {
    if(!coaches[0].json) {console.warn('JSON model [Run Heavy] not loaded'); return;}
    coaches[0].model = null;
    coaches[0].model = new brain.NeuralNetwork();
    coaches[0].model.fromJSON(coaches[0].json);

    if(!coaches[1].json) {console.warn('JSON model [Balanced] not loaded'); return;}
    coaches[1].model = null;
    coaches[1].model = new brain.NeuralNetwork();
    coaches[1].model.fromJSON(coaches[1].json);

    if(!coaches[2].json) {console.warn('JSON model [Pass Heavy] not loaded'); return;}
    coaches[2].model = null;
    coaches[2].model = new brain.NeuralNetwork();
    coaches[2].model.fromJSON(coaches[2].json);
}

function createTrainData() {
    let i;

    coaches[0].train = [];
    for(i=1; i<coaches[0].data.length; i++) {
        coaches[0].train.push(parseCsvRow(coaches[0].data[i]));
    }
    coaches[0].train = shuffleArray(coaches[0].train);
    //console.log(coaches[0].train);

    coaches[1].train = [];
    for(i=1; i<coaches[1].data.length; i++) {
        coaches[1].train.push(parseCsvRow(coaches[1].data[i]));
    }
    coaches[1].train = shuffleArray(coaches[1].train);

    coaches[2].train = [];
    for(i=1; i<coaches[2].data.length; i++) {
        coaches[2].train.push(parseCsvRow(coaches[2].data[i]));
    }
    coaches[2].train = shuffleArray(coaches[2].train);
}

function parseCsvRow(row) {
    const [clock, warn, late, lead, d1, d2, d3, d4, distance, latelong, spot, redzone, play] = row;
    const input = {
        clock:+clock,
        warn:+warn,
        late:+late,
        lead:+lead,
        d1:+d1, d2:+d2, d3:+d3, d4:+d4,
        distance:+distance,
        latelong:+latelong,
        spot:+spot,
        redzone:+redzone,
    };
    let label = {};
    label[play] = 1;
    return { input, output: label };
}

function trainRunHeavy() {
    brainWorker.callback = runHeavyReady;
    brainWorker.bstatus = document.getElementById('tstatus');
    brainWorker.postMessage({action: 'train', data: structuredClone(coaches[0].train), params: toptions, mdlparams: mdlParams});
    document.getElementById('mdltype').textContent = 'Run Heavy: ';
}

function runHeavyReady(json) {
    downloadJson(json, "runheavy.json");
    coaches[0].model = null;
    coaches[0].model = new brain.NeuralNetwork();
    coaches[0].model.fromJSON(json);
}

function trainBalanced() {
    brainWorker.callback = balancedReady;
    brainWorker.bstatus = document.getElementById('tstatus');
    brainWorker.postMessage({action: 'train', data: structuredClone(coaches[1].train), params: toptions, mdlparams: mdlParams});
    document.getElementById('mdltype').textContent = 'Balanced: ';
}

function balancedReady(json) {
    downloadJson(json, "balanced.json");
    coaches[1].model = null;
    coaches[1].model = new brain.NeuralNetwork();
    coaches[1].model.fromJSON(json);
}

function trainPassHeavy() {
    brainWorker.callback = passHeavyReady;
    brainWorker.bstatus = document.getElementById('tstatus');
    brainWorker.postMessage({action: 'train', data: structuredClone(coaches[2].train), params: toptions, mdlparams: mdlParams});
    document.getElementById('mdltype').textContent = 'Pass Heavy: ';
}

function passHeavyReady(json) {
    downloadJson(json, "passheavy.json");
    coaches[2].model = null;
    coaches[2].model = new brain.NeuralNetwork();
    coaches[2].model.fromJSON(json);
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

function callPlay() {
    if(!coaches[0].model || !coaches[1].model || !coaches[2].model) {console.warn('missing model'); return;}
    const qtr = document.getElementById('quarter').value * 1;
    let clock = (4-qtr)*900 + document.getElementById('clockmin').value * 60 + document.getElementById('clocksec').value * 1;

    let warn = 0;
    if(clock > 1800 && clock <= 1920) warn = 1; // just before half
    if(clock <= 120) warn = 1;

    let late = 0;
    if(clock < 420) late = 1;
    clock = clock / 3600;

    const lead = (document.getElementById('homescore').value * 1 - document.getElementById('oppscore').value * 1 + 70) / 140;
    let d1 = 0, d2 = 0, d3 = 0, d4 = 0, down = document.getElementById('down').value * 1;
    switch(down) {
        case 1:
            d1 = 1;
            break;
        case 2:
            d2 = 1;
            break;
        case 3:
            d3 = 1;
            break;
        case 4:
            d4 = 1;
            break;
    }

    const distance = document.getElementById('distance').value / 40;
    let latelong = 0;
    if(down > 2 && distance > 6) latelong = 1;

    let redzone = 0;
    if(ballon.spot <= 20) redzone = 1;

    const input = {
        clock:+clock,
        warn:+warn,
        late:+late,
        lead:+lead,
        d1:+d1, d2:+d2, d3:+d3, d4:+d4,
        distance:+distance,
        latelong:+latelong,
        spot:+ballon.spot / 99,
        redzone:+redzone,
    };
    
    const temp0 = 1, temp1 = 0.5, temp2 = 0.4;
    let seed = Math.random()*1000; //42;
    const fgmod = fgModifier(ballon.spot, down, distance * 40, lead * 140 - 70, clock * 3600);
    //console.log(seed);

    let rhresult = coaches[0].model.run(input);
    if(down < 4 || ballon.spot < 20) rhresult["PUNT"] = -Infinity;
    if(ballon.spot >= 40) {
        rhresult["FIELD_GOAL"] = -Infinity;
    } else {
        rhresult["FIELD_GOAL"] *= fgmod;
    }
    rhresult = softmaxNormalize(rhresult, temp0);
    let highestKey = Object.keys(rhresult).reduce((a, b) => rhresult[a] > rhresult[b] ? a : b);
    let highestValue = rhresult[highestKey];
    highestKey = highestKey.replace('_', ' ');
    document.getElementById('rhresult').innerText = `${highestKey} (${(highestValue*100).toFixed(0)}%)`;

    let rng = makeRNG(seed); // choose a seed per session or per play index
    let called = sampleFromProbs(rhresult, rng).replace('_', ' '); 
    document.getElementById('rhcall').innerHTML = `<i>called: ${called}</i>`;
    
    let balresult = coaches[1].model.run(input);
    if(down < 4 || ballon.spot < 20) balresult["PUNT"] = -Infinity;
    if(ballon.spot >= 40) {
        balresult["FIELD_GOAL"] = -Infinity;
    } else {
        balresult["FIELD_GOAL"] *= fgmod;
    }
    balresult = softmaxNormalize(balresult, temp1);
    highestKey = Object.keys(balresult).reduce((a, b) => balresult[a] > balresult[b] ? a : b);
    highestValue = balresult[highestKey];
    highestKey = highestKey.replace('_', ' ');
    document.getElementById('balresult').innerText = `${highestKey} (${(highestValue*100).toFixed(0)}%)`;

    rng = makeRNG(seed); // choose a seed per session or per play index
    called = sampleFromProbs(balresult, rng).replace('_', ' '); 
    document.getElementById('balcall').innerHTML = `<i>called: ${called}</i>`;

    let phresult = coaches[2].model.run(input);
    if(down < 4 || ballon.spot < 20) phresult["PUNT"] = -Infinity;
    if(ballon.spot >= 40) {
        phresult["FIELD_GOAL"] = -Infinity;
    } else {
        phresult["FIELD_GOAL"] *= fgmod;
    }

    phresult = softmaxNormalize(phresult, temp2);
    highestKey = Object.keys(phresult).reduce((a, b) => phresult[a] > phresult[b] ? a : b);
    highestValue = phresult[highestKey];
    highestKey = highestKey.replace('_', ' ');
    document.getElementById('phresult').innerText = `${highestKey} (${(highestValue*100).toFixed(0)}%)`;

    rng = makeRNG(seed); // choose a seed per session or per play index
    called = sampleFromProbs(phresult, rng).replace('_', ' '); 
    document.getElementById('phcall').innerHTML = `<i>called: ${called}`;

    console.log(rhresult, balresult, phresult);
}

function fgModifier(spot, down, dist, lead, clock) {
    console.log(spot, down, dist, lead, clock);
    if(spot > 40) return -Infinity;

    if(clock < 10) {
        if(lead == -3) return 2;
        if(lead <= -4) return -Infinity;
        if(lead <= 0) return 10;
        return -Infinity;
    }
    if(clock < 20) {
        if(down == 4) {
            if(lead == -3) return 2;
            if(lead <= -4) return -Infinity;
            if(lead <= 0) return 10;
            return -Infinity;
        }
    }
    if(clock < 180) {
        if(down == 4) {
            console.log('3 min');
            if(lead == -3) return 5;
            if(lead <= -4) return 1;
            if(lead <= 0) return 50;
            return -Infinity;
        }
    }

    if(spot <=20 && down == 4) return 50;
    return 1;
}

const LABELS = ['RUSH','PASS','PUNT','FIELD_GOAL'];

function softmaxNormalize(raw, temperature = 1.0) {
  const vals = LABELS.map(k => (raw[k] ?? 0));
  const t = Math.max(1e-6, temperature);
  const max = Math.max(...vals);
  const exps = vals.map(v => Math.exp((v - max) / t));
  const sum  = exps.reduce((a,b)=>a+b, 0) || 1;
  const out = {};
  LABELS.forEach((k,i) => out[k] = exps[i] / sum);
  return out; // sums to ~1
}

// simple LCG so you can seed runs (no external libs needed)
function makeRNG(seed = 123456789) {
  let x = seed >>> 0;
  return function rand() {
    x = (1664525 * x + 1013904223) >>> 0;
    return (x / 0x100000000);
  };
}

function sampleFromProbs(probs, rng = Math.random) {
  let r = rng(), acc = 0;
  for (const k of LABELS) {
    acc += probs[k] ?? 0;
    if (r <= acc) return k;
  }
  return LABELS[LABELS.length - 1]; // fallback
}
