//importScripts("https://unpkg.com/brain.js");
importScripts("https://cdnjs.cloudflare.com/ajax/libs/brain.js/2.0.0-beta.24/browser.js");

onmessage = function(msg) {
    let info = msg.data;
    console.log('brain Message received from main: ', info);
    
    if(info.action == 'train') brainModel.train(info.data, info.params, info.mdlparams);
    if(info.action == 'trainae') brainModel.trainae(info.data, info.params);
}

//======================================

class brainModelClass {
    constructor() {
        this.gpu = false; //true;
        this.net = null;
        this.netOptions = {
            activation: 'sigmoid', // activation function
            hiddenLayers: [3]
        };
        this.trainingOptions = {
            // Defaults values --> expected validation
            iterations: 2000, //20000, // the maximum times to iterate the training data --> number greater than 0
            errorThresh: 0.005, // the acceptable error percentage from training data --> number between 0 and 1
            log: trainConsole, // true to use console.log, when a function is supplied it is used --> Either true or a function
            logPeriod: 10, // iterations between logging out --> number greater than 0
            learningRate: 0.3, // scales with delta to effect training rate --> number between 0 and 1
            momentum: 0.1, // scales with next layer's change value --> number between 0 and 1
            callback: trainStatus, // a periodic call back that can be triggered while training --> null or function
            callbackPeriod: 10, // the number of iterations through the training data between callback calls --> number greater than 0
            timeout: Infinity, // the max number of milliseconds to train for --> number greater than 0. Default --> Infinity
        };

        this.tstats = null;
    }

    new(params = null) {
        if(this.net) this.net = null;
        if(params) {
            if(this.gpu) {
                this.net = new brain.NeuralNetworkGPU(params);
            } else {
                this.net = new brain.NeuralNetwork(params);
            }
        } else {
            if(this.gpu) {
                this.net = new brain.NeuralNetworkGPU();
            } else {
                this.net = new brain.NeuralNetwork();
            }
        }
    }

    newae(params) {
        if(this.net) this.net = null;

        //console.log(params);
        this.net = new brain.AE(
            {
              hiddenLayers: [ params.dim, params.edim, params.dim ]
              //hiddenLayers: [ params.edim ]
            }
        );

    }

    train(data, params, mdlparams = null) {
        if(!this.net) this.new(mdlparams);

        let tstart = performance.now();

        this.trainingOptions.iterations = params.iterations;
        this.trainingOptions.errorThresh = params.errorThresh;
        this.trainingOptions.learningRate = params.learningRate;
        this.trainingOptions.momentum = params.momentum;

        let val = true;
        if(!params.validation) {
            val = false;
        } else {
            if(params.validation < 0.05 || params.validation > 1) val = false;
        }
        let traindata = data, valdata = [];
        if(val) {
            let b = Math.round(params.validation * data.length);
            valdata  = data.slice(-b);                         // no mutation
            traindata = data.slice(0, data.length - b);
        }

        this.tstats = this.net.train(traindata, this.trainingOptions);

        let accuracy = -1;
        if(val) accuracy = this.validate(valdata) * 100;
        let json = this.net.toJSON();
        this.net = null;

        if(params.quantize) {
            if(params.quantize >= 0) {json = this.quantize(json, params.quantize);}
        }

        let tend = performance.now();
        let time = (tend-tstart) / 1000;
        postMessage({action: 'train', status: 'done', iterations: this.tstats.iterations, error: this.tstats.error, time: time, accuracy: accuracy, json: json});
    }

    trainae(data, params) {
        let h1 = Math.round(data[0].length + params.edim) / 2;
        if(h1 % 2 !== 0) h1++;
        let mdlparams = {dim: h1, edim: params.edim};
        if(!this.net) this.newae(mdlparams);

        let tstart = performance.now();

        this.trainingOptions.iterations = params.iterations;
        this.trainingOptions.errorThresh = params.errthreshold;
        this.trainingOptions.learningRate = params.learnrate;
        this.trainingOptions.momentum = params.momentum;

        this.tstats = this.net.train(data, this.trainingOptions);

        let json = this.net.denoiser.toJSON();
        this.net = null;

        if(params.quantize) {
            if(params.quantize >= 0) {json = this.quantize(json, params.quantize);}
        }

        let tend = performance.now();
        let time = (tend-tstart) / 1000;
        postMessage({action: 'train', status: 'done', iterations: this.tstats.iterations, error: this.tstats.error, time: time, json: json});
    }

    // inside your worker class
    validate(valdata) {
        if (!valdata?.length) return 0;

        // --- collect label set from validation data ---
        const LABELS = Array.from(new Set(
            valdata.map(r => Object.keys(r.output)[0])
        )).sort();

        const idx = Object.fromEntries(LABELS.map((k,i)=>[k,i]));
        const n = LABELS.length;

        // confusion matrix counts: rows = actual, cols = pred
        const cm = Array.from({length:n}, ()=> Array(n).fill(0));

        // totals
        const actualCounts = Array(n).fill(0);
        const predCounts   = Array(n).fill(0);

        let correctTop1 = 0;
        let correctTop2 = 0;

        const vlen = valdata.length;
        const ucnt = Math.max(1, Math.round(vlen * 0.05));
        let count = 0;

        for (let i = 0; i < vlen; i++) {
            const row = valdata[i];
            const actualLabel = Object.keys(row.output)[0];
            const ai = idx[actualLabel];

            const out = this.net.run(row.input);

            // sort predictions by score
            const ranked = Object.entries(out)
            .filter(([k]) => idx[k] !== undefined) // ignore stray keys
            .sort((a,b) => b[1] - a[1]);

            const predLabel = ranked[0]?.[0];
            const pi = idx[predLabel];

            if (pi !== undefined) {
            cm[ai][pi] += 1;
            actualCounts[ai] += 1;
            predCounts[pi] += 1;
            if (predLabel === actualLabel) correctTop1 += 1;
            }

            // top-2 accuracy (optional but enlightening)
            if (ranked.length > 1) {
            const top2 = new Set([ranked[0][0], ranked[1][0]]);
            if (top2.has(actualLabel)) correctTop2 += 1;
            }

            if (++count >= ucnt) {
            count = 0;
            postMessage({ action: 'train', status: 'validating', complete: (i / vlen) * 100 });
            }
        }

        // --- compute per-class precision/recall/F1 ---
        const perClass = {};
        for (let i = 0; i < n; i++) {
            const label = LABELS[i];
            const tp = cm[i][i];
            const fn = actualCounts[i] - tp;                      // missed this actual class
            const fp = predCounts[i]   - tp;                      // predicted as this but actually others

            const recall = actualCounts[i] ? tp / actualCounts[i] : 0;   // sensitivity
            const precision = predCounts[i] ? tp / predCounts[i] : 0;    // PPV
            const f1 = (precision + recall) ? (2 * precision * recall) / (precision + recall) : 0;

            perClass[label] = {
            support: actualCounts[i],
            precision: +precision.toFixed(3),
            recall: +recall.toFixed(3),
            f1: +f1.toFixed(3),
            };
        }

        const accuracyTop1 = correctTop1 / vlen;
        const accuracyTop2 = correctTop2 / vlen;

        // handy for quick console inspection
        console.table(perClass);
        console.log('Labels:', LABELS);
        console.log('Confusion (rows=actual, cols=pred):'); // you can render a prettier grid in UI
        console.log(cm);
        console.log({ accuracyTop1: +accuracyTop1.toFixed(4), accuracyTop2: +accuracyTop2.toFixed(4) });

        // Return overall for existing code paths, but attach details if you want them upstream
        this.lastValidation = { LABELS, cm, perClass, accuracyTop1, accuracyTop2 };
        return accuracyTop1;
    }

    validateOverall(valdata) {
        if(valdata.length < 1) return 0;
        let vlen = valdata.length;

        let output, max=0, i, okey='', match = 0;
        let ucnt = Math.round(vlen * 0.05), count=0;
        let vmatrix = [];

        for(i=0; i<vlen; i++) {
            output = this.net.run(valdata[i].input);
            max = 0; okey='';
            for (let [key, value] of Object.entries(output)) {
                if(value > max) {max = value; okey = key;}
            }
            const vkey = Object.keys(valdata[i].output)[0];
            if(okey == vkey) {
                match++;
            } else {
                vmatrix.push({actual: vkey, pred: okey});
            }
            count++
            if(count >= ucnt) {
                count = 0;
                postMessage({action: 'train', status: 'validating', complete: i/vlen*100});
            }
        }

        console.log(vmatrix);
        return match / vlen;
    }

    quantize(json, q = 5) {
        if(q < 2) q = 2;
        if(q > 15) q = 15;
        let i, j, tlen = 0, count = 0;
        for(i=1; i<json.sizes.length; i++) {tlen += json.sizes[i];}

        for(i=1; i<json.layers.length; i++) {
            json.layers[i].biases = json.layers[i].biases.map(function(x) { return +x.toFixed(q); });
            for(j=0; j<json.layers[i].weights.length; j++) {
                json.layers[i].weights[j] = json.layers[i].weights[j].map(function(x) { return +x.toFixed(q); });
                count++;
                postMessage({action: 'train', status: 'quantizing', complete: count/tlen*100});
            }
        }

        return json;
    }

}

const brainModel = new brainModelClass();

function trainConsole(t) {
    //console.log('console: ', t);
}

function trainStatus(t) {
    //console.log('train status: ', t);
    postMessage({action: 'train', status: 'training', iterations: t.iterations, error: t.error, maxi: brainModel.trainingOptions.iterations, et: brainModel.trainingOptions.errorThresh});
}