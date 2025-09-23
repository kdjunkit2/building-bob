// extras/players/js/vae.mjs
// Minimal, reusable VAE for tabular data in tfjs
// Usage sketch is at the bottom of this file.

// Assumes script tag for importing tensorflow.js was included in main index file 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest';
// Assumes JSZip is loaded globally via <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>

export class TabularVAE {
    /**
     * @param {number[][]} [data] optional (rows x cols), already numeric & scaled
     */
    constructor(data) {
        /** @type {tf.Tensor2D|null} */
        this._X = null;
        this._n = 0;
        this._d = 0;

        /** @type {{latentDim:number, hidden:[number,number], activation:string, outputActivation:string, seed:number|null} | null} */
        this._cfg = null;

        // models / variables
        this.encoder = null;  // (x) -> {mu, logVar}
        this.decoder = null;  // (z) -> x_hat

        // optimizer (created on build)
        this.optimizer = null;

        if (data) this.setData(data);
    }

    /**
     * Supply/replace dataset.
     * @param {number[][]} data rows x cols
     */
    setData(data) {
        if (this._X) this._X.dispose();
        this._X = tf.tensor2d(data);
        this._n = this._X.shape[0];
        this._d = this._X.shape[1];
    }

    /**
     * Suggests a sane default config based on column count.
     * You can override any field by passing a partial cfg to build().
     */
    _suggestConfig() {
        const d = this._d;
        // heuristic hidden sizes: shrink toward latent
        const h1 = Math.max(8, Math.round(d * 0.75));
        const h2 = Math.max(8, Math.round(d * 0.5));
        // latent suggestion: clamp between [2..min(32, d/2)]
        const latent = Math.min( Math.max(2, Math.round(d / 4)), Math.max(2, Math.min(32, Math.floor(d/2))) );
        return {
            latentDim: latent,
            hidden: [h1, h2],
            activation: 'relu',
            outputActivation: 'sigmoid', // assume inputs ~[0,1]; switch to 'linear' if unbounded
            seed: null,
        };
    }

    /**
     * Build encoder/decoder (and optimizer).
     * @param {{latentDim?:number, hidden?:[number,number], activation?:string, outputActivation?:string, seed?:number|null, learningRate?:number}} [cfg]
     */
    build(cfg={}) {
        if (!this._d) throw new Error('No data yet. Call setData() or pass data to constructor first.');
        const base = this._suggestConfig();
        this._cfg = { ...base, ...cfg };
        const { latentDim, hidden, activation, outputActivation, seed } = this._cfg;

        if (seed != null) tf.util.setSeed(seed);

        // ---- Encoder: x -> (mu, logVar)
        const xin = tf.input({shape:[this._d]});
        let h = tf.layers.dense({units:hidden[0], activation}).apply(xin);
        h = tf.layers.dense({units:hidden[1], activation}).apply(h);

        const mu = tf.layers.dense({units: latentDim, activation: 'linear', name:'mu'}).apply(h);
        const logVar = tf.layers.dense({units: latentDim, activation: 'linear', name:'logVar'}).apply(h);

        // Package encoder as a Model for easy reuse
        this.encoder = tf.model({inputs: xin, outputs: [mu, logVar], name: 'encoder'});

        // ---- Decoder: z -> x_hat
        const zin = tf.input({shape:[latentDim]});
        let hd = tf.layers.dense({units:hidden[1], activation}).apply(zin);
        hd = tf.layers.dense({units:hidden[0], activation}).apply(hd);
        const xhat = tf.layers.dense({units:this._d, activation: outputActivation}).apply(hd);

        this.decoder = tf.model({inputs: zin, outputs: xhat, name: 'decoder'});

        // ---- Optimizer
        const lr = cfg.learningRate ?? 1e-3;
        this.optimizer = tf.train.adam(lr);
    }

    latentDimensions() {return this._cfg.latentDim;}

    /**
     * Returns {mu, logVar} tensors for the given X (2D) or from internal data if X omitted.
     * @param {tf.Tensor2D} [X]
     */
    _forwardEncode(X) {
        return tf.tidy(() => {
            const x = X ?? this._X;
            const [mu, logVar] = this.encoder.predict(x);
            return { mu, logVar }; // NOTE: caller must dispose
        });
    }

    /**
     * Reparameterization: z = mu + exp(0.5*logVar) * eps
     */
    _sampleZ(mu, logVar, batchSize) {
        return tf.tidy(() => {
            const eps = tf.randomNormal([batchSize, mu.shape[1]]);
            const std = logVar.mul(0.5).exp();
            return mu.add(std.mul(eps));
        });
    }

    /**
     * One training step on a batch.
     * @param {tf.Tensor2D} xb
     * @param {number} beta weight for KL (1.0 default; can use warmup later)
     */
    _trainStep(xb, beta=1.0) {
        const d = this._d;
        const batchSize = xb.shape[0];

        return this.optimizer.minimize(() => {
            // wrap in tidy; optimizer.minimize returns the scalar loss; it will keep necessary grads
            const loss = tf.tidy(() => {
                const [mu, logVar] = this.encoder.apply(xb, { training:true });
                const z = this._sampleZ(mu, logVar, batchSize);
                const xhat = this.decoder.apply(z, { training:true });

                // Reconstruction loss (MSE)
                //let recon = tf.losses.meanSquaredError(xb, xhat).mean();
                
                // MAE (L1): tends to preserve spread better than MSE
                //let recon = tf.losses.absoluteDifference(xb, xhat).mean();

                
                // ===== Weighted Huber reconstruction loss =====
                const POS_START = 0, POS_COLS = 10; // pqb..pdb
                const BOOST_COLS = [18, 19, 23, 24, 30, 31];         // Columns to boost
                const d = xb.shape[1];
                const deltaNum = 0.05, deltaPos = 0.02;

                
                // Huber (smooth-L1). delta controls where it switches MSE→MAE.
                // On 0..1 features, 0.03–0.08 works well.
                function huberLoss(yTrue, yPred, delta = 0.05) {
                    const err  = yPred.sub(yTrue).abs();
                    const quad = tf.minimum(err, tf.scalar(delta));
                    const lin  = err.sub(quad);
                    // 0.5*quad^2/delta + lin
                    return quad.square().div(tf.scalar(2 * delta)).add(lin).mean();
                }

                // Slices
                const x_pos = xb.slice([0, POS_START], [xb.shape[0], POS_COLS]);
                const y_pos = xhat.slice([0, POS_START], [xhat.shape[0], POS_COLS]);

                const x_num = xb.slice([0, POS_START + POS_COLS], [xb.shape[0], d - POS_COLS]);
                const y_num = xhat.slice([0, POS_START + POS_COLS], [xhat.shape[0], d - POS_COLS]);

                // Base losses
                const lossPos = huberLoss(x_pos, y_pos, deltaPos); // tighter on one-hot
                const lossNum = huberLoss(x_num, y_num, deltaNum);

                // Optional: a separate BOOST slice to give it extra weight
                let lossKick = null;
                if (BOOST_COLS.length) {
                    const idx = tf.tensor1d(BOOST_COLS, 'int32');
                    const x_k = xb.gather(idx, 1);
                    const y_k = xhat.gather(idx, 1);
                    lossKick = huberLoss(x_k, y_k, deltaNum);
                    idx.dispose(); x_k.dispose(); y_k.dispose();
                }

                // Weights (tune these)
                const POS_WEIGHT  = 0.5;  // start 2-4
                const NUM_WEIGHT  = 1.0;
                const BOOST_WEIGHT = 4.0;  // start 2–4; raise if kick tails still compressed

                // Combine + normalize so recon scale stays ~stable (less β retuning)
                let recon = lossNum.mul(NUM_WEIGHT).add(lossPos.mul(POS_WEIGHT));
                let eff = NUM_WEIGHT + POS_WEIGHT;
                if (lossKick) { recon = recon.add(lossKick.mul(BOOST_WEIGHT)); eff += BOOST_WEIGHT; }
                //recon = recon.div(eff);                

                // --- variance matching over the selected numeric columns ---
                if (this._varMaskIdx) {
                    // batch std of predictions
                    const { variance: varPred } = tf.moments(xhat, 0);     // shape [d]
                    const stdPred = varPred.sqrt();

                    // gather selected cols
                    const stdPredSel = stdPred.gather(this._varMaskIdx);
                    const stdTargSel = this._stdTarget.gather(this._varMaskIdx);

                    // L1 (MAE) or L2 (MSE) loss or a combination of both.
                    const mae = tf.losses.absoluteDifference(stdPredSel, stdTargSel).mean();
                    const mse = tf.losses.meanSquaredError(stdPredSel, stdTargSel).mean();
                    const ALPHA = 1.0; // 0 = pure MSE, 1 = pure MAE
                    const lossVar = mae.mul(ALPHA).add(mse.mul(1 - ALPHA));

                    // small weight — start tiny and increase only if needed
                    const VAR_WEIGHT = 0.7;   // try 0.05–0.3 range
                    // add to your recon (not to KL)
                    recon = recon.add(lossVar.mul(VAR_WEIGHT));

                    // clean up temporaries
                    varPred.dispose(); stdPred.dispose();
                    stdPredSel.dispose(); stdTargSel.dispose();
                }
                
                // KL loss: -0.5 * sum(1 + logVar - mu^2 - exp(logVar)) averaged per sample
                const kl = tf.tidy(() => {
                    // Correct: -0.5 * Σ (1 + logVar - mu^2 - exp(logVar))
                    const klPer = tf.add(1, logVar).sub(mu.square()).sub(logVar.exp()).mul(-0.5);
                    // reduce sum over latent dims then mean over batch
                    return klPer.sum(-1).mean();
                });

                // ELBO loss = recon + beta * KL (both as positive to minimize)
                const total = recon.add(kl.mul(beta));
                return total;
            });
            return loss;
        }, true); // returnCost = true
    }

    /**
     * Train the model on the currently set data.
     * @param {{epochs?:number, batchSize?:number, shuffle?:boolean, beta?:number, onEpochEnd?:(e, logs)=>void}} opts
     */
    async train(opts = {}) {
        if (!this.encoder || !this.decoder) throw new Error('Call build() before train().');
        if (!this._X) throw new Error('No data set. Call setData().');

        // --- once per training run ---
        const POS_COLS = 10;             // pqb..pdb
        const EXCLUDE_COLS = [32];         // (optional) e.g. [32] to exclude Salary from variance matching
        const d = this._d;

        if (!this._stdTarget || !this._varMaskIdx) {
            // Global per-column std on the **scaled** training data
            const { variance } = tf.moments(this._X, 0);
            const std = variance.sqrt();

            // choose which columns to match (skip one-hot)
            const mask = Array.from({ length: d }, (_, j) =>
                j >= POS_COLS && !EXCLUDE_COLS.includes(j)
            );
            const idx = mask.map((keep, j) => keep ? j : -1).filter(j => j >= 0);

            // stash as tensors we can reuse in _trainStep
            this._stdTarget = std;                 // tf.Tensor1D
            this._varMaskIdx = tf.tensor1d(idx, 'int32');  // columns to match

            // if you prefer to free 'std' later, keep it; otherwise .clone() and dispose original
        }

        const betaDelta = 0.2;

        const epochs   = opts.epochs    ?? 50;
        const shuffle  = opts.shuffle   ?? true;
        const beta     = opts.beta      ?? 1/this._cfg.latentDim * betaDelta;
        const n        = this._n;
        const batchSz  = opts.batchSize ?? Math.min(128, Math.max(16, Math.floor(n / 20)));

        // reusable index buffer
        const baseIdx = [...Array(n).keys()];

        const shuffleInPlace = (arr) => {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = (Math.random() * (i + 1)) | 0;
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        };

        for (let epoch = 0; epoch < epochs; epoch++) {
            const idx = baseIdx.slice();
            if (shuffle) shuffleInPlace(idx);

            let batches = 0;
            let epochLoss = 0;
            const betaNow = Math.min(1/this._cfg.latentDim*betaDelta, Math.min(beta, (epoch+1)/epochs * beta));

            for (let start = 0; start < n; start += batchSz) {
                const end = Math.min(start + batchSz, n);
                const idxBatch = idx.slice(start, end);

                // build a tensor of row indices and gather the batch
                const xb = tf.tidy(() => {
                    const ib = tf.tensor1d(idxBatch, 'int32');
                    const x  = tf.gather(this._X, ib);
                    ib.dispose();
                    return x; // shape [batch, d]
                });

                const batchLoss = this._trainStep(xb, betaNow);     // scalar tensor
                const v = (await batchLoss.data())[0];
                epochLoss += v;
                batches++;

                batchLoss.dispose();
                xb.dispose();
                await tf.nextFrame();
            }

            const avg = epochLoss / Math.max(1, batches);
            if (opts.onEpochEnd) opts.onEpochEnd(epoch, { loss: avg, batches }, betaNow);
        }
    }

    /**
     * Encode to latent space (returns {mu, logVar, zSample} as plain arrays).
     * If you want deterministic embeddings for plots, use mu.
     * @param {number[][]|tf.Tensor2D} X
     */
    encode(X) {
        return tf.tidy(() => {
            const x = (X instanceof tf.Tensor) ? X : tf.tensor2d(X);
            const [mu, logVar] = this.encoder.predict(x);
            const z = this._sampleZ(mu, logVar, x.shape[0]);
            const out = {
                mu: mu.arraySync(),
                logVar: logVar.arraySync(),
                z: z.arraySync(),
            };
            mu.dispose(); logVar.dispose(); z.dispose();
            if (!(X instanceof tf.Tensor)) x.dispose();
            return out;
        });
    }

    /**
     * Decode latent vectors back to X space.
     * @param {number[][]|tf.Tensor2D} Z
     */
    decode(Z) {
        return tf.tidy(() => {
            const z = (Z instanceof tf.Tensor) ? Z : tf.tensor2d(Z);
            const xhat = this.decoder.predict(z);
            const arr = xhat.arraySync();
            xhat.dispose();
            if (!(Z instanceof tf.Tensor)) z.dispose();
            return arr;
        });
    }

    /**
     * Reconstruct inputs via encode->decode.
     * @param {number[][]|tf.Tensor2D} X
     */
    reconstruct(X) {
        return tf.tidy(() => {
            const x = (X instanceof tf.Tensor) ? X : tf.tensor2d(X);
            const [mu, logVar] = this.encoder.predict(x);
            const z = this._sampleZ(mu, logVar, x.shape[0]);
            const xhat = this.decoder.predict(z);
            const arr = xhat.arraySync();
            mu.dispose(); logVar.dispose(); z.dispose(); xhat.dispose();
            if (!(X instanceof tf.Tensor)) x.dispose();
            return arr;
        });
    }

    /**
     * Draw random samples from the prior N(0,I) and decode.
     * @param {number} n
     */
    sample(n=1) {
        if (!this._cfg) throw new Error('Build first to set latentDim.');
        const ld = this._cfg.latentDim;
        return tf.tidy(() => {
            const z = tf.randomNormal([n, ld]);
            const xhat = this.decoder.predict(z);
            const arr = xhat.arraySync();
            z.dispose(); xhat.dispose();
            return arr;
        });
    }

    /**
     * Optional explicit disposal to free GPU/CPU memory.
     */
    dispose() {
        if (this._X) { this._X.dispose(); this._X = null; }
        if (this.encoder) { this.encoder.dispose(); this.encoder = null; }
        if (this.decoder) { this.decoder.dispose(); this.decoder = null; }
        this.optimizer = null;
    }

    /**
     * Quick summary helper.
     */
    summary() {
        console.log('Encoder:'); this.encoder?.summary();
        console.log('Decoder:'); this.decoder?.summary();
    }

    /**
     * Save encoder+decoder + config into a single ZIP and trigger download.
     * Requires window.JSZip to be available.
     * @param {{ filename?: string, metadata?: any }} opts
     */
    async saveZip(opts = {}) {
        if (!this.encoder || !this.decoder) {
            throw new Error('saveZip: build (and optionally train) before saving.');
        }
        if (!window.JSZip) {
            throw new Error('saveZip: JSZip not found. Include it via <script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>');
        }

        const filename = (opts.filename || 'vae-model') + '.zip';

        // ---- capture artifacts for a model via a temporary save handler
        const capture = async (model) => {
            let captured = null;
            const handler = tf.io.withSaveHandler(async (artifacts) => {
                captured = artifacts; // { modelTopology, weightSpecs, weightData, format, ... }
                return {
                    modelArtifactsInfo: {
                        dateSaved: new Date(),
                        modelTopologyType: 'JSON',
                        weightDataBytes: artifacts.weightData ? artifacts.weightData.byteLength : 0,
                    }
                };
            });
            await model.save(handler);
            if (!captured) throw new Error('saveZip: failed to capture model artifacts');
            return captured;
        };

        // ---- capture encoder/decoder
        const enc = await capture(this.encoder);
        const dec = await capture(this.decoder);

        // ---- assemble config payload
        const config = {
            inputDim: this._d,
            nRows: this._n,
            cfg: this._cfg,                 // latentDim, hidden, activations, lr, seed, etc.
            metadata: opts.metadata ?? null // optional user metadata
        };

        // ---- build ZIP
        const zip = new window.JSZip();

        // config.json (human/readable settings)
        zip.file('config.json', JSON.stringify(config, null, 2));

        // helper to write one model's artifacts
        const writeArtifacts = (folderName, arts) => {
            const folder = zip.folder(folderName);
            // store topology + specs as artifacts.json (keeps format stable with tfjs expectations)
            folder.file('artifacts.json', JSON.stringify({
            modelTopology: arts.modelTopology,
            weightSpecs: arts.weightSpecs
            }, null, 2));
            // store raw weight buffer
            if (arts.weightData && arts.weightData.byteLength) {
            folder.file('weights.bin', new Blob([arts.weightData]));
            }
        };

        writeArtifacts('encoder', enc);
        writeArtifacts('decoder', dec);

        // ---- generate and download
        const blob = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
    }


    /**
     * Load encoder+decoder+config from a ZIP (File or Blob).
     * Requires window.JSZip to be available.
     * Restores this.encoder/this.decoder and config fields.
     * @param {File|Blob} zipBlob
     * @returns {Promise<{config:any}>}
     */
    async loadZip(zipBlob) {
        if (!zipBlob) throw new Error('loadZip: no file provided.');
        if (!window.JSZip) {
            throw new Error('loadZip: JSZip not found. Include it via <script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>');
        }

        const zip = await window.JSZip.loadAsync(zipBlob);

        // --- read config ---
        const cfgEntry = zip.file('config.json');
        if (!cfgEntry) throw new Error('config.json not found in zip.');
        const config = JSON.parse(await cfgEntry.async('string'));

        // --- helper: read one model (encoder/decoder) ---
        const loadArtifacts = async (folder) => {
            const artFile = zip.file(`${folder}/artifacts.json`);
            if (!artFile) throw new Error(`${folder}/artifacts.json missing`);
            const arts = JSON.parse(await artFile.async('string'));

            // optional weights.bin
            const wb = zip.file(`${folder}/weights.bin`);
            const weightData = wb ? await wb.async('arraybuffer') : new ArrayBuffer(0);

            // single-argument ModelArtifacts object
            return {
                modelTopology: arts.modelTopology,
                weightSpecs: arts.weightSpecs,
                weightData
            };
        };

        const encArtifacts = await loadArtifacts('encoder');
        const decArtifacts = await loadArtifacts('decoder');

        // --- create models from memory ---
        const encoder = await tf.loadLayersModel(tf.io.fromMemory(encArtifacts));
        const decoder = await tf.loadLayersModel(tf.io.fromMemory(decArtifacts));

        // --- swap into this instance ---
        if (this.encoder) this.encoder.dispose();
        if (this.decoder) this.decoder.dispose();

        this.encoder = encoder;
        this.decoder = decoder;

        // restore config-ish fields
        this._cfg = config.cfg || this._cfg || null;
        this._d   = config.inputDim || this._d || null;
        this._n   = config.nRows || this._n || 0;
        this.latentDim = this._cfg?.latentDim
            ?? this.latentDim
            ?? (this.encoder?.outputs?.[0]?.shape?.[1] || null);
        this.built = true;

        return { config };
    }


}
