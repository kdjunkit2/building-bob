import { csvHandler } from '../../shared/js/csv.mjs'
import { TabularVAE } from './js/vae.mjs'
import { PCA } from './js/pca.mjs'

const players = {
    headers: [],
    train: null,
    train_url: 'data/players_train.csv',
    test: null,
    test_url: 'data/players_test.csv',
    model: null,
    mu: {
        points: [[]],
        positions: [],
        mean: null,
        W: null,
        latent: [],
    },
    vis: {},
    class: [],
    team: [],
}

const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'P', 'K', 'DL', 'LB', 'DB'];
const posColors = [
    '#4269d0', // Medium Blue
    '#efb118', // Golden Yellow
    '#ff725c', // Light Red
    '#6cc5b0', // Cyan
    '#3ca951', // Green
    '#a463f2', // Purple
    '#ff8ab7', // Pink
    '#97bbf5', // Light Blue
    '#9c6b4e', // Brown
    '#008080'  // Teal
];

const plotParams = {
    xmin: 0, 
    xmax: 0, 
    ymin: 0, 
    ymax: 0,
    background: '#000000',
    color: '#ffffff',
    canvasImg: null,
};

export function appInit() {
    document.getElementById('pagetitle').textContent = 'Coach Bob Players';
    setupUI();
    addListeners();
    loadData();
}

function setupUI() {
    const pos = document.getElementById('positions');
    let html = '';
    for(let i=0; i<positions.length; i++) {
        html += `<div style='width: 30px; background-color: ${posColors[i]}; color: #000000; text-align: center; padding: 3px;'>${positions[i]}</div>`
    }
    pos.innerHTML = html;
}

function addListeners() {
    if(document.readyState !== 'complete') {setTimeout(addListeners, 30); return;}

    document.getElementById('main1').addEventListener('click', (event) => {gotoScreen('main');});
    document.getElementById('main2').addEventListener('click', (event) => {gotoScreen('main');});
    document.getElementById('main3').addEventListener('click', (event) => {gotoScreen('main');});

    document.getElementById('inf').addEventListener('click', (event) => {gotoScreen('inf');});
    document.getElementById('vis').addEventListener('click', (event) => {gotoScreen('vis');});
    document.getElementById('trn').addEventListener('click', (event) => {gotoScreen('trn');});

    document.getElementById('trainPlayer').addEventListener('click', (event) => {trainPlayerModel();});

    document.getElementById('plotcanvas').addEventListener('click', (event) => {clickPlot(event);});

    document.getElementById('draftclass').addEventListener('click', (event) => {draftClass();});

    document.getElementById('QB').addEventListener('click', (event) => {displayPlayersOfType('QB');});
    document.getElementById('RB').addEventListener('click', (event) => {displayPlayersOfType('RB');});
    document.getElementById('WR').addEventListener('click', (event) => {displayPlayersOfType('WR');});
    document.getElementById('TE').addEventListener('click', (event) => {displayPlayersOfType('TE');});
    document.getElementById('OL').addEventListener('click', (event) => {displayPlayersOfType('OL');});
    document.getElementById('P').addEventListener('click', (event) => {displayPlayersOfType('P');});
    document.getElementById('K').addEventListener('click', (event) => {displayPlayersOfType('K');});
    document.getElementById('DL').addEventListener('click', (event) => {displayPlayersOfType('DL');});
    document.getElementById('LB').addEventListener('click', (event) => {displayPlayersOfType('LB');});
    document.getElementById('DB').addEventListener('click', (event) => {displayPlayersOfType('DB');});
}

function gotoScreen(screen) {
    document.getElementById('inference').style.display = 'none';
    document.getElementById('visualizer').style.display = 'none';
    document.getElementById('train').style.display = 'none';
    document.getElementById('main').style.display = 'none';
    switch(screen) {
        case 'inf':
            document.getElementById('inference').style.display = 'block';
            break;
        case 'vis':
            document.getElementById('visualizer').style.display = 'block';
            break;
        case 'trn':
            document.getElementById('train').style.display = 'block';
            break;
        default:
            document.getElementById('main').style.display = 'block';
    }
}

async function loadData() {
    players.train = await csvHandler.fromURL(players.train_url);
    players.headers = players.train.shift();
    players.test = await csvHandler.fromURL(players.test_url);
    players.test.shift();

    players.model = new TabularVAE();
    loadModels();
}

async function loadModels() {
    await loadModelFromURL('models/players.zip', players.model);
    runTestData(true);
    createVisData(players.test);
}

async function loadModelFromURL(url, model) {
    try {
        console.log(`Fetching VAE zip from ${url} …`);
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`fetch failed: ${resp.status}`);
        const blob = await resp.blob();

        const { config } = await model.loadZip(blob);
        console.log(`Loaded VAE from zip. Latent=${config.cfg.latentDim}, inputDim=${config.inputDim}`);
    } catch (err) {
        console.log('Error loading VAE: ' + err.message);
    }
}

//------------------------------------------- TRAINING ---------------------------------------------------

async function trainPlayerModel() {
    if(players.model) {
        players.model.dispose();
        players.model = null;
    }

    players.model = new TabularVAE(players.train);
    players.model.build();

    await players.model.train({
        beta: 0.001,
        epochs: 75,
        onEpochEnd: (e, logs, beta) => trainingProgress(e, logs, beta)
    });
    console.log('Player training done');
    runTestData(true);
    createVisData(players.test);
    players.model.saveZip({filename: 'players'});
}

function trainingProgress(e, logs, beta) {
    document.getElementById('tstatus').textContent = `epoch ${e+1} of 75 - loss: ${logs.loss.toFixed(4)} [beta: ${beta.toFixed(4)}]`;
    //console.log(`epoch ${e+1} - loss: ${logs.loss.toFixed(4)}`);
}

function runTestData(replacePos = false, showOutput = false) {
    if(!players.test || !players.model) return;

    const { mu } = players.model.encode(players.test);
    let recon = players.model.decode(mu);
    
    let i, j, len = players.test[0].length;
    let cum = new Array(len).fill(0);
    let pmatch = 0;
    let confusion = [[]];
    let output = '';

    for(i=0; i<positions.length; i++) {
        confusion[i] = new Array(positions.length).fill(0);
    }

    for(i=0; i<recon.length; i++) {
        const ppos = players.test[i].slice(0, positions.length);
        const actpos = ppos.indexOf(1);

        const real = inverseCoding(recon[i]);
        const result =  predictPosition(recon[i], real);
        output += `"${result.position}", ${result.player.join(", ")}\n`;
        
        if(actpos == result.index) {
            pmatch++;
        } else {
            confusion[actpos][result.index]++;
        }
    }

    console.log(`Position match: ${Math.round(pmatch / recon.length *1000)/10}% [${recon.length-pmatch} misses]`);
    console.log('Confusion Matrix: ---------------------------------')
    console.log(confusion);

    for(i=positions.length; i<len; i++) {
        for(j=0; j<players.test.length; j++) {
            cum[i] += (Math.pow((players.test[j][i] - recon[j][i]), 2) / players.test.length);
        }
    }

    cum = cum.slice(positions.length, len);
    const mse = cum.reduce((accumulator, currentValue) => accumulator + currentValue, 0) / cum.length;

    if(replacePos) {
        for(i=0; i<recon.length; i++) {
            const real = inverseCoding(recon[i]);
            const result =  predictPosition(recon[i], real);
            players.test[i] = result.player;
        }
    }

    console.log(`MSE: ${mse.toFixed(3)}`)
    console.log(cum);
    if(showOutput) console.log(output);
}

//----------------------------------------------- VISUALIZE ------------------------------------------------

function createVisData(data) {
    if(!players.model) return;
    
    players.mu.points = [[]];
    players.mu.positions = [];

    const { mu } = players.model.encode(data);
    const { points2D, pctExplained, mean, W } = latentToPCA2D(mu);
    console.log('PCA variance explained (PC1+PC2):', (pctExplained*100).toFixed(2) + '%');
    players.mu.points = structuredClone(points2D);
    players.mu.mean = mean;
    players.mu.W = W;
    
    for(let i=0; i<data.length; i++) {
        const pos = data[i].slice(0, positions.length);
        const value = pos.indexOf(1);
        players.mu.positions.push(value);
    }

    const out = findMinMaxPerDimension(players.mu.points);
    plotParams.xmin = out.mins[0];
    plotParams.xmax = out.maxs[0];
    plotParams.ymin = out.mins[1];
    plotParams.ymax = out.maxs[1];

    const radius = 3;
    const canvas = document.getElementById('plotcanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = plotParams.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let i, j;
    for(i=0; i<canvas.width; i++) {
        for(j=0; j<canvas.height; j++) {
            plotPoint(ctx, i, j, 1, nearestNeighborColor(i, j, true));
        } 
    }

    for(i=0; i<players.mu.points.length; i++) {
        plotPointL(canvas, ctx, players.mu.points[i][0], players.mu.points[i][1], radius, posColors[players.mu.positions[i]]);
    }

    plotParams.canvasImg = canvas.toDataURL('image/png');
}

function plotPointL(canvas, ctx, xl, yl, radius, color) {
    const {x, y} = latentPointToPoint(canvas, xl, yl);
    plotPoint(ctx, x, y, radius, color);
}

function plotPoint(ctx, x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI); // Full circle
    ctx.fillStyle = color;
    ctx.fill();
}

function latentPointToPoint(canvas, xl, yl) {
    const xd = plotParams.xmax - plotParams.xmin;
    const yd = plotParams.ymax - plotParams.ymin;

    const x = (xl - plotParams.xmin) / xd * canvas.width;
    const y = (yl - plotParams.ymin) / yd * canvas.height;
    return {x: x, y: y}
}

function pointToLatentPoint(canvas, x, y) {
    const xd = plotParams.xmax - plotParams.xmin;
    const yd = plotParams.ymax - plotParams.ymin;

    const xl = x / canvas.width * xd + plotParams.xmin;
    const yl = y / canvas.height * yd + plotParams.ymin;

    return {xl: xl, yl: yl};
}

function clickPlot(e) {
    if(!players.model) return;

    const canvas = document.getElementById('plotcanvas');
    if(e.offsetX >= 0 && e.offsetY >= 0 && e.offsetX < canvas.width && e.offsetY < canvas.height) {
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            plotPoint(ctx, e.offsetX, e.offsetY, 4, plotParams.color);
            const neighbor = nearestPseudoNeighbor(e.offsetX, e.offsetY);
            players.vis = realPlayer(neighbor);
            console.log(players.vis);

        };
        img.src = plotParams.canvasImg;
    }
}

// mu: Array<Array<number>> shape [N, latentDim] — from vae.encode(...).mu
function latentToPCA2D(mu) {

    const dims = mu[0].length;
    const mean = Array.from({ length: dims }, (_, j) =>
        mu.reduce((s, r) => s + r[j], 0) / mu.length
    );

    // 1) Get eigenvectors (sorted by eigenvalue descending)
    const eigen = PCA.getEigenVectors(mu).sort((a, b) => b.eigenvalue - a.eigenvalue);
    const pc1 = eigen[0];
    const pc2 = eigen[1];

    const v1 = pc1.vector;
    const v2 = pc2.vector;
    const W = Array.from({ length: dims }, (_, j) => [v1[j], v2[j]]);

    // 2) Project data onto the first 1–2 principal components
    // computeAdjustedData returns an object with:
    //   adjustedData: [k, N] (k = #PCs selected; N = samples)
    //   formattedAdjustedData: rounded version (also [k, N])
    //   selectedVectors: the PC vectors
    // We want points as [N, 2], so we transpose.
    const { adjustedData } = PCA.computeAdjustedData(mu, pc1, pc2); // shape [2, N]

    // transpose to [N, 2]
    const points2D = PCA.transpose(adjustedData); // [[x,y], ...] length N

    // (optional) how much variance the first 2 PCs explain:
    const pctExplained = PCA.computePercentageExplained(eigen, pc1, pc2); // 0..1

    return { points2D, pctExplained, mean, W };
}

// find nearest mu point from latent space 2D coordinate;
function nearestNeighborIndex(x, y) {
    if(!players.mu.points.length) return -1;
    const canvas = document.getElementById('plotcanvas');
    const {xl, yl} = pointToLatentPoint(canvas, x, y);

    let len = players.mu.points.length;
    let d = Infinity, ni = -1;
    let i;
    for(i = 0; i<len; i++) {
        const dc = (xl - players.mu.points[i][0]) * (xl - players.mu.points[i][0]) + (yl - players.mu.points[i][1]) * (yl - players.mu.points[i][1]);
        if(dc < d) {
            d = dc;
            ni = i;
        }
    }
    return ni;
}

function nearestNeighborColor(x, y, semitrans = false) {
    const ni = nearestNeighborIndex(x, y);
    if(ni < 0) return '#00000000';
    if(semitrans) return posColors[players.mu.positions[ni]] + '10';
    return posColors[players.mu.positions[ni]];
}

function nearestPseudoNeighbor(x, y) {
    const neighbor = {index: -1, position:'', player: null};
    const ni = nearestNeighborIndex(x, y);
    if(ni < 0) return neighbor;
    
    const player = players.model.reconstruct([players.test[ni]])[0];
    const real = inverseCoding(player);
    const result = predictPosition(player, real);

    neighbor.index = result.index;
    neighbor.position = positions[result.index];
    neighbor.player = real;

    return neighbor;
}

// Back project the 2D point back to the latent dim vector equivalent.  Good starter funciton, but is replaced by nearest neighbor
// So that we don't lose small groups like punters and kickers in the back translation
function pcaBackProject2D(x, y) {
    if (!players.mu.W || !players.mu.mean) throw new Error('pcaBackProject2D: PCA not fitted yet');
    const { W, mean } = players.mu; // W: 8x2
    const dims = W.length;
    const z8 = new Array(dims);
    for (let j = 0; j < dims; j++) {
        // x̂ = μ̄ + z · Wᵀ  =>  x̂_j = mean_j + x*W[j][0] + y*W[j][1]
        z8[j] = mean[j] + x * W[j][0] + y * W[j][1];
    }
    return z8;
}

function findMinMaxPerDimension(arr) {
    if (!arr || arr.length === 0 || arr[0].length === 0) {
        return { mins: [], maxs: [] }; // Handle empty or invalid input
    }

    const numDimensions = arr[0].length;
    const mins = new Array(numDimensions).fill(Infinity);
    const maxs = new Array(numDimensions).fill(-Infinity);

    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < numDimensions; j++) {
        const currentValue = arr[i][j];
        mins[j] = Math.min(mins[j], currentValue);
        maxs[j] = Math.max(maxs[j], currentValue);
        }
    }

    return { mins, maxs };
}

//--------------------------------------- INFERENCE AND CREATION

const dataLabels = ['Speed', 'Height', 'Weight', 'Injury', 'Stamina', 'Short Route', 'Medium Route', 'Deep Route', 'Power Run', 'Speed Run', 'Short Pass', 'Medium Pass', 'Deep Pass', 'Run Block', 'Pass Block', 'Run Rush', 'Pass Rush', 'Tackle', 'Man Coverage', 'Zone Coverage', 'Kick Power', 'Kick Accuracy', 'Salary'];
const dataConversions = [{min: 49, max: 99, range: 50}, {min: 66, max: 81, range: 15}, {min: 160, max: 380, range: 220}, {min: 70, max: 98, range: 28}, {min: 63, max: 99, range: 36}, {min: 11, max: 99, range: 88}, {min: 9, max: 99, range: 90}, {min: 9, max: 98, range: 89}, {min: 12, max: 96, range: 84}, {min: 12, max: 91, range: 79}, {min: 5, max: 99, range: 94}, {min: 5, max: 98, range: 93}, {min: 4, max: 93, range: 89}, {min: 7, max: 98, range: 91}, {min: 9, max: 97, range: 88}, {min: 10, max: 95, range: 85}, {min: 10, max: 98, range: 88}, {min: 14, max: 96, range: 82}, {min: 5, max: 97, range: 92}, {min: 7, max: 97, range: 90}, {min: 7, max: 99, range: 92}, {min: 6, max: 99, range: 93}, {min: 12.25, max: 19.11, range: 6.86}];
const positionVectors = [
    [0.01759, 0.00513, 0.00001, 0.02069, 0.00178, 0, 0, 0, 0.00213, 0.01093, 0.17738, 0.0944, 0.15777, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.00044],
    [0.10177, 0.00005, 0, 0.01745, 0.00982, 0.01096, 0.0069, 0.004, 0.11333, 0.1978, 0, 0, 0, 0.00016, 0.00225, 0.00001, 0.00002, 0.00002, 0, 0, 0, 0, 0.0001],
    [0.16813, 0.00049, 0, 0.01485, 0.00922, 0.09937, 0.1004, 0.10612, 0.01499, 0.08844, 0, 0, 0, 0.00081, 0.00001, 0, 0.00001, 0, 0, 0, 0, 0, 0.00015],
    [0.01385, 0.03161, 0.00023, 0.02459, 0.00328, 0.02345, 0.01866, 0.01438, 0.01013, 0.01881, 0, 0, 0, 0.00564, 0.00442, 0.0001, 0.00008, 0.00007, 0, 0, 0, 0, 0.00011],
    [0.00005, 0.05528, 0.04045, 0.02324, 0.0079, 0, 0, 0, 0, 0, 0, 0, 0, 0.04924, 0.04666, 0.00001, 0, 0, 0, 0, 0, 0, 0.00026],
    [0.00225, 0.00467, 0, 0.02865, 0.00856, 0, 0, 0, 0, 0, 0.00003, 0.00001, 0, 0, 0, 0, 0, 0, 0, 0, 0.57105, 0.12107, 0.00015],
    [0.0011, 0.0004, 0, 0.01183, 0.00612, 0, 0, 0, 0, 0, 0.00002, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.61771, 0.1348, 0.00031],
    [0.00162, 0.01635, 0.00994, 0.02512, 0.00012, 0, 0, 0, 0, 0, 0, 0, 0, 0.00042, 0.0003, 0.10429, 0.07864, 0.14511, 0, 0.00001, 0, 0, 0.00015],
    [0.04075, 0.00498, 0.00013, 0.02267, 0.00468, 0.00004, 0.00002, 0.00001, 0.0001, 0.00054, 0, 0, 0, 0.00031, 0.00021, 0.08207, 0.06647, 0.16526, 0.00169, 0.00523, 0, 0, 0.0002],
    [0.14995, 0.00029, 0, 0.02243, 0.04432, 0.00066, 0.0004, 0.00026, 0.00088, 0.01318, 0, 0, 0, 0.00001, 0.00001, 0.00444, 0.00959, 0.02103, 0.03786, 0.05181, 0, 0, 0.00015],
];

const positionWeights = [[0, 0, 0, 0, 0, 0, 0, 0, 0.125, 0.125, 0.25, 0.25, 0.25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0.2857, 0, 0, 0, 0, 0, 0, 0, 0.2857, 0.2857, 0, 0, 0, 0.0714, 0.0714, 0, 0, 0, 0, 0, 0, 0, 0],
    [0.25, 0, 0, 0, 0, 0.25, 0.25, 0.25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0.1667, 0, 0, 0, 0, 0.1667, 0.1667, 0.1667, 0, 0, 0, 0, 0, 0.1667, 0.1667, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 0],
    [0.25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.25, 0.25, 0.25, 0, 0, 0, 0, 0],
    [0.1667, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.1667, 0.1667, 0.1667, 0.1667, 0.1667, 0, 0, 0],
    [0.25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.25, 0.25, 0.25, 0, 0, 0]
];

const positionDistribution = [0.04, 0.07, 0.12, 0.08, 0.17, 0.02, 0.2, 0.15, 0.13, 0.2];

function inverseCoding(arr) {
    if(arr.length != players.train[0].length) {
        console.warn(`Decoding size mismatch ${arr.length} <> ${players.train[0].length}`);
        return;
    }

    const pdata = arr.slice(positions.length);
    const real = [];
    if(pdata.length != dataConversions.length) {
        console.warn(`Internal size mismatch ${pdata.length} <> ${dataConversions.length}`);
        return;
    }

    const exclusions = [0, 1, 2];
    for(let i=0; i<pdata.length; i++) {
        if(i < pdata.length - 1) {
            let conv = pdata[i] * dataConversions[i].range + dataConversions[i].min;
            const exclude = exclusions.indexOf(i);
            if(exclude == -1) {
                conv = 1.1459 * conv - 2.2041
                if(conv > 99) conv = 99;
                if(conv < 0) conv = 0;
            }
            real.push(Math.round(conv));
        }
        else {real.push(Math.round(pdata[i] * 100));}
    }

    return real;
}

function predictPosition(arr, real) {
    const ppos = arr.slice(0, positions.length);
    const maxp = maxArray(ppos);
    const mdlpos = ppos.indexOf(maxp);

    const pdata = arr.slice(positions.length);
    const results = similarityArray([powerArray(pdata, 2)], positionVectors);
    
    let predpos = -1; results[0].index;
    const receive = Math.max(real[5], real[6], real[7]);
    const run = Math.max(real[8], real[9]);
    const pass = Math.max(real[10], real[11], real[12]);
    const skill = Math.max(receive, run, pass);
    const block = Math.max(real[13], real[14]);
    const offense = Math.max(skill, block);

    const drush = Math.max(real[15], real[16]);
    const tackle = real[17];
    const cover = Math.max(real[18], real[19]);
    const dskill = Math.max(drush, cover);
    const defense = Math.max(drush, tackle, cover);

    const kick = Math.max(real[20], real[21]);

    if(kick > offense && kick > defense) {
        if(Math.random() > 0.5) predpos = 6;
        else predpos = 5;
    } else {
        if(defense > offense) {
            if(cover == dskill) {
                if(real[0] < 80 && real[2] > 200) predpos = 8;
                else predpos = 9;
            } else {
                if(drush == dskill) {
                    if(real[2] < 250) predpos = 8;
                    else predpos = 7;
                } else {
                    predpos = 8;
                }
            }
        } else {
            if(offense == block) {
                if(receive > 60 && real[2] < 260) predpos = 3;
                predpos = 4;
            } else {
                if(pass == skill) {
                    predpos = 0;
                } else {
                    if(run == skill) {
                        if(real[2] < 190) predpos = 2;
                        else predpos = 1;
                    } else {
                        if(block > 50 && real[2] > 230 || real[0] < 75) predpos = 3;
                        else predpos = 2;
                    }
                }
            }
        }
    }

    if(predpos < 0) console.log(predpos);
  
    //predpos = mdlpos;
    const pcoded = new Array(positions.length).fill(0);
    pcoded[predpos] = 1;

    return {index: predpos, position: positions[results[0].index], onehot: pcoded, player: pcoded.concat(pdata), mdlpos: mdlpos};
}

function realPlayer(npn) {
    if(!npn) return {position: '', height: '', weight: '', overall: 0, stats: []};
    const posidx = positions.indexOf(npn.position);
    if(npn.player.length != positionWeights[posidx].length) {
        console.warn('Position weights mismatch length');
        return {position: '', height: '', weight: '', overall: 0, stats: []}
    }

    const height = `${Math.floor(npn.player[1] / 12)}' ${npn.player[1] % 12}"`;
    let overall = 0;
    for(let i=0; i<npn.player.length; i++) {
        overall += (npn.player[i] * positionWeights[posidx][i]);
    }
    overall = Math.round(overall);

    return {index: npn.index, position: npn.position, height: height, weight: npn.player[2], overall: overall, stats: npn.player};
}

function draftClass() {
    const dc = players.model.sample(200);
    players.class = [];

    let p = {index: 0, position: 0, player: []};
    for(let i=0; i<dc.length; i++) {
        const real = inverseCoding(dc[i]);
        const result =  predictPosition(dc[i], real);
        //{index: predpos, position: positions[results[0].index], onehot: pcoded, player: pcoded.concat(pdata), mdlpos: mdlpos}        
        players.class.push(realPlayer({index: result.index, position: positions[result.index], player: real}));
    }

    players.class.sort((a, b) => b.overall - a.overall);
    console.log(players.class);
    classSummary();
    displayDraftClass();
}

function displayDraftClass() {
    document.getElementById('dcdisplay').style.display = 'block';
    const colwidth = 100;
    let i;
    let html = '';
    const headers = ['Pos', 'Height', 'Weight', 'Rating'];
    for(i=0; i<headers.length; i++) {
        html += `<div class='lmtext' style='display: inline-block; width: ${colwidth}px; border-bottom: 1px solid #abc0d1;'>${headers[i]}</div>`;
    }
    document.getElementById('dcheader').innerHTML = html;
    displayPlayersOfType();
}

function displayPlayersOfType(type = 'QB') {
    const dcarea = document.getElementById('dcplayers');
    const colwidth = 100;
    dcarea.innerHTML = '';
     let i;
    let html = '';
    for(i=0; i<players.class.length; i++) {
        if(players.class[i].position != type) continue;
        html +=  `<div class='ltext' style='display: inline-block; width: ${colwidth}px;'>${players.class[i].position}</div>`;
        html +=  `<div class='ltext' style='display: inline-block; width: ${colwidth}px;'>${players.class[i].height}</div>`;
        html +=  `<div class='ltext' style='display: inline-block; width: ${colwidth}px;'>${players.class[i].weight}</div>`;
        html +=  `<div class='ltext' style='display: inline-block; width: ${colwidth}px;'>${players.class[i].overall}</div>`;
        html += '<br>'
        dcarea.innerHTML += html;
        html = '';
    }
}

function classSummary() {
    if(!players.class.length) {console.log('No draft class to summarize'); return};
    const stats = {
        position: positions,
        poscount: new Array(positions.length).fill(0),
        distribution: new Array(positions.length).fill(0),
        max: new Array(positions.length).fill(0),
        min: new Array(positions.length).fill(Infinity),
        mean: new Array(positions.length).fill(0),
    }

    let i;
    for(i=0; i<players.class.length; i++) {
        const index = players.class[i].index;
        stats.poscount[index]++;
        if(players.class[i].overall > stats.max[index]) stats.max[index] = players.class[i].overall;
        if(players.class[i].overall < stats.min[index]) stats.min[index] = players.class[i].overall;
        stats.mean[index] += players.class[i].overall;
    }

    for(i=0; i<positions.length; i++) {
        if(stats.poscount[i] == 0) {
            stats.min[i] = 0;
            continue;
        }
        stats.mean[i] = Math.round(stats.mean[i] / stats.poscount[i]);
        stats.distribution[i] = `${Math.round(stats.poscount[i] / players.class.length * 100)}%`;
    }

    console.log(stats);
}