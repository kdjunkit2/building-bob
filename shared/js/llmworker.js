import {CreateMLCEngine, modelLibURLPrefix, modelVersion, ModelType} from "https://esm.run/@mlc-ai/web-llm";
import {pipeline} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers";

const llmSystem = {
	llmgpu: false,
	embedgpu: false,
};

onmessage = function(msg) {
		let info = msg.data;
		console.log('llmWorder Message received from main: ', info);
		if(info.action == 'load') {
			if(info.gpu) {
				webllmModel.loadModel(info.model);
				llmSystem.llmgpu = true;
			} else {
				let device = 'wasm';
				if(info.device) device = info.device;
				xenModel.loadModel(info.model, device);
				llmSystem.llmgpu = false;
			}
			return;
		}
		if(info.action == 'generate') {
			if(llmSystem.llmgpu == true) {
				webllmModel.generate(info.messages, info.mparams, info.tag);
			} else {
				xenModel.generate(info.messages, info.mparams, info.tag)
			}
			return;
		}

		if(info.action == 'unload') {
			webllmModel.unload();
			xenModel.unload();
			return;
		}

		if(info.action == 'eload') {
			if(info.gpu) {
				webllmModel.loadEmbed();
				llmSystem.embedgpu = true;
			} else {
				let device = 'wasm';
				if(info.device) device = info.device;
				xenModel.loadEmbed(device);
				llmSystem.embedgpu = false;
			}
			return;
		}
		if(info.action == 'embed') {
			if(llmSystem.embedgpu == true) {
				webllmModel.embed(info.sentences, info.q, info.tag); 
			} else {
				xenModel.embed(info.sentences, info.q, info.tag);
			}
			return;
		}
		console.log('invalid webllm message');
}


//================================================================ WebLLM class

class webllmModelClass {
	constructor() {
		this.model = null;
		this.modelId = 'Llama-3.2-1B-Instruct-abliterated3-q4f16_1-MLC';
		this.emodel = null;
		this.embedId = 'snowflake-arctic-embed-s-q0f32-MLC-b4';
		this.tmstart = 0
		this.tmend = 0;
	}

	async loadEmbed() {
		var self = this;
		this.emodel = await CreateMLCEngine(
			this.embedId,
			{ appConfig: webllmAppConfig,
			initProgressCallback: function(e) {loadStatusWebllm_e(e, self);} 
		});

		let params = {action:'eload', status: 'done', progress: 1};
		postMessage(params);
	}

	loadeStatus(e) {
		let text = e.text;
		// Regular expressions to match the cache ratio and percentage completed
		const cacheRatioMatch = text.match(/\bfrom cache\[(\d+)\/(\d+)\]/);
		const percentCompletedMatch = text.match(/(\d+)% completed/);

		// Calculate cache ratio percentage if both parts of the ratio are found
		let cacheRatioPercent = null;
		if (cacheRatioMatch) {
			const loaded = parseInt(cacheRatioMatch[1]);
			const total = parseInt(cacheRatioMatch[2]);
			cacheRatioPercent = total > 0 ? Math.round((loaded / total) * 100) : 0;
		}

		// Extract the completed percentage
		const percentCompleted = percentCompletedMatch ? parseInt(percentCompletedMatch[1]) : null;
		let w = Math.max(cacheRatioPercent, percentCompleted);
		let params = {action:'eload', status: 'loading', progress: w, time: e.timeElapsed};
		postMessage(params);
	}

	async loadModel(modelId = null) {
		if(this.model) this.model = null;

		if(modelId) {
			let mlen = webllmAppConfig.length
			if(mlen) {
				for(let i=0; i<mlen; i++) {
					if(webllmAppConfig[i].model_id = modelId) {this.modelId = modelId; break;}
				}
			}
		}

		var self = this;
		this.model = await CreateMLCEngine(
			this.modelId,
			{ appConfig: webllmAppConfig,
			initProgressCallback: function(e) {loadStatusWebllm(e, self);} 
		});

		let params = {action:'load', status: 'done', progress: 1};
		postMessage(params);
	}

	unload() {
		if(this.model) this.model = null;
	}

	loadStatus(e) {
		const text = e.text;
		// Regular expressions to match the cache ratio and percentage completed
		const cacheRatioMatch = text.match(/\bfrom cache\[(\d+)\/(\d+)\]/);
		const percentCompletedMatch = text.match(/(\d+)% completed/);

		// Calculate cache ratio percentage if both parts of the ratio are found
		let cacheRatioPercent = null;
		if (cacheRatioMatch) {
			const loaded = parseInt(cacheRatioMatch[1]);
			const total = parseInt(cacheRatioMatch[2]);
			cacheRatioPercent = total > 0 ? Math.round((loaded / total) * 100) : 0;
		}

		// Extract the completed percentage
		const percentCompleted = percentCompletedMatch ? parseInt(percentCompletedMatch[1]) : null;
		const w = Math.max(cacheRatioPercent, percentCompleted);
		let params = {action:'load', status: 'loading', progress: w, time: e.timeElapsed};
		postMessage(params);
	}

	async generate(messages, mparams = null, tag = '') {
		if(!this.model) {
			console.log('model not loaded');
			let msg = {action: 'generate', status: 'error', msg: 'Model not loaded'};
			postMessage(msg);
			return;
		}
		this.tmstart = performance.now();

		const output = await this.model.chat.completions.create({
			messages,
			max_tokens: 4096 ?? mparams.max_new_tokens,
			max_new_tokens: 4096 ?? mparams.max_new_tokens,
			temperature: 0.6 ?? mparams.temperature,
			top_p: 0.9 ?? mparams.top_p,
			presence_penalty: 0.0 ?? mparams.presence_penalty,
  			frequency_penalty: 0.0 ?? mparams.frequency_penalty,
			context_window_size: 4096 ?? mparams.context_window_size,

		});
		let result = output.choices[0].message.content;
		
		this.tmend = performance.now();
		let time = (this.tmend - this.tmstart)/1000;

		let params = {action:'generate', status: 'done', result: result, time: time.toFixed(2), tag: tag};
		postMessage(params);
	}

	async embed(sentences, q, tag) {
		if(!this.emodel) {
			console.log('Embed model not loaded'); 
			let msg = {action: 'embed', status: 'error', msg: 'Embed model not loaded'};
			postMessage(msg);
			return;
		}
		this.tmstart = performance.now();
		if(!Array.isArray(sentences)) {
			let temp = sentences;
			sentences = [];
			sentences.push(temp);
		}

		if(!q) q=0;
		if(q < 0) q = 0;
		if(q > 15) q = 15;

		const output = await this.emodel.embeddings.create({ input: sentences });
		let len = output.data.length;
		let embeddings = [];
		for(let i=0; i<len; i++) {
			if(q>0) {
				embeddings.push(output.data[i].embedding.map(function(x) {return +x.toFixed(q);}));
			} else {
				embeddings.push(output.data[i].embedding)
			};
			postMessage({action: 'embed', status: 'embedding', progress: i/len*100, tag: tag});
		}

		let time;
		this.tmend = performance.now();
		time = (this.tmend - this.tmstart)/1000;
		let result = {action: 'embed', status: 'done', data: embeddings, tag: tag, time: time};
		postMessage(result);
	}

}

const loadStatusWebllm = (initProgress, parent) => {
	//console.log(initProgress);
	parent.loadStatus(initProgress);
}

const loadStatusWebllm_e = (initProgress, parent) => {
	//console.log(initProgress);
	parent.loadeStatus(initProgress);
}

const webllmModel = new webllmModelClass();

//================================================================

class xenModelClass {
	constructor() {
		this.model = null;
		this.modelId = 'onnx-community/Llama-3.2-1B-Instruct';
		this.type = 'text-generation';
		this.tmstart = 0;
        this.tmend = 0;
        this.loadFile = [];
        this.loadProg = [];

		this.embedHandler = new xenEmbedModelClass();
	}

	async loadEmbed(device = 'wasm') {
		await this.embedHandler.loadModel(device);
	}

	async loadModel(modelid = '', device = 'wasm') {
        if(this.model) {
            let params = {action:'load', status: 'done', file:'', progress: 100, time: 0};
            postMessage(params);
            return;
        }

		if(modelid.length) this.modelId = modelid;

        //let dtype = 'q4f16';
		let dtype = 'q8';
        if(device == 'webgpu') dtype = 'fp16';

        this.tmstart = performance.now();
        var self = this;
        this.model = await pipeline(this.type, this.modelId, {device: device, dtype: dtype, progress_callback: function(e) {loadStatusX(e, self);}});
	}

	unload() {
		if(this.model) this.model = null;
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
        //else {if(progress == 100) lstatus = 'prep';}

        let params = {action:'load', status: lstatus, file:e.name, progress: progress, time: time.toFixed(2)};
        postMessage(params);   
    }

	async embed(sentences, q, tag='') {
		await this.embedHandler.embed(sentences, q, tag);
	}

	async generate(messages, mparams = null, tag = '') {
		if(!this.model) {
			console.log('model not loaded');
			let msg = {action: 'generate', status: 'error', msg: 'Model not loaded'};
			postMessage(msg);
			return;
		}
		this.tmstart = performance.now();

		const output = await this.model(messages, {
			max_tokens: 256 ?? mparams.max_new_tokens,
			max_new_tokens: 256 ?? mparams.max_new_tokens,
			temperature: 0.6 ?? mparams.temperature,
			top_p: 0.9 ?? mparams.top_p,
		});

		console.log(output);
		let result = output[0].generated_text[messages.length].content;
		console.log(result);
		
		this.tmend = performance.now();
		let time = (this.tmend - this.tmstart)/1000;

		let params = {action:'generate', status: 'done', result: result, time: time.toFixed(2), tag: tag};
		postMessage(params);
	}

}

class xenEmbedModelClass {
    constructor() {
        this.model = null;
        //this.modelId = 'Xenova/all-MiniLM-L6-v2';
        this.modelId = 'Snowflake/snowflake-arctic-embed-s';
        this.type = 'feature-extraction';
        this.tmstart = 0;
        this.tmend = 0;
        this.loadFile = [];
        this.loadProg = [];
        this.dimensions = 384;
    }

    async loadModel(device = 'wasm') {
        if(this.model) {
            let params = {action:'load', status: 'done', file:'', progress: 100, time: 0};
            postMessage(params);
            return;
        }

        let dtype = 'fp16';
        if(device == 'webgpu') dtype = 'fp16';

        this.tmstart = performance.now();
        var self = this;
        this.model = await pipeline(this.type, this.modelId, {device: device, dtype: dtype, progress_callback: function(e) {loadStatusX(e, self);}});
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
        //else {if(progress == 100) lstatus = 'prep';}

        let params = {action:'eload', status: lstatus, file:e.name, progress: progress, time: time.toFixed(2)};
        postMessage(params);
        
    }

    async embed(sentences, q, tag='') {
        if(!this.model) {
            console.log('Embed model not loaded'); 
            let msg = {action: 'embed', status: 'error', msg: 'Embed model not loaded'};
            postMessage(msg);
            return;
        }
        this.tmstart = performance.now();
        if(!Array.isArray(sentences)) {
            let temp = sentences;
            sentences = [];
            sentences.push(temp);
        }

        if(!q) q=0;
        if(q < 0) q = 0;
        if(q > 15) q = 15;

        let len = sentences.length;
        let count = 0;
        let embeddings = [];
        let time;

        for (let sentence of sentences) {
            let output = await this.model(sentence, { pooling: 'mean', normalize: true });
            let oarray = Array.from(output.data);

            if(q>0) {
                embeddings.push(oarray.map(function(x) { return +x.toFixed(q); }));
            } else {
                embeddings.push(oarray);
            }
            count++;
            let complete = count / len * 100;
            this.tmend = performance.now();
            time = (this.tmend - this.tmstart)/1000;
            let msg = {action: 'embed', status: 'embedding', progress: complete, tag: tag, time: time};
            postMessage(msg);
        }
        this.tmend = performance.now();
        time = (this.tmend - this.tmstart)/1000;
        let result = {action: 'embed', status: 'done', data: embeddings, time: time, tag: tag};
        postMessage(result);
    }
}

function loadStatusX(e, parent) {parent.loadStatus(e);}

const xenModel = new xenModelClass();

//---------------------------------------------- CONFIG OBJECTS

const webllmAppConfig = {
	model_list: [
		{
			model: "https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC",
			model_id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
			model_lib:
				modelLibURLPrefix +
				modelVersion +
				"/Llama-3.2-1B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
			vram_required_MB: 879.04,
			low_resource_required: true,
			overrides: {
				context_window_size: 4096,
			},
		},
		{
			model: "https://huggingface.co/mlc-ai/Llama-3.2-3B-Instruct-q4f16_1-MLC",
			model_id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
			model_lib:
				modelLibURLPrefix +
				modelVersion +
				"/Llama-3.2-3B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
			vram_required_MB: 2263.69,
			low_resource_required: true,
			overrides: {
				context_window_size: 4096,
			},
		},
		{
			model: "https://huggingface.co/mlc-ai/SmolLM-360M-Instruct-q4f16_1-MLC",
			model_id: "SmolLM-360M-Instruct-q4f16_1-MLC",
			model_lib:
			  modelLibURLPrefix +
			  modelVersion +
			  "/SmolLM-360M-Instruct-q4f16_1-ctx2k_cs1k-webgpu.wasm",
			vram_required_MB: 296.06,
			low_resource_required: true,
			required_features: ["shader-f16"],
			overrides: {
			  context_window_size: 2048,
			},
		},
		{
			model: "https://huggingface.co/mlc-ai/SmolLM2-360M-Instruct-q4f32_1-MLC",
			model_id: "SmolLM2-360M-Instruct-q4f32_1-MLC",
			model_lib:
			modelLibURLPrefix +
			modelVersion +
			"/SmolLM2-360M-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
			vram_required_MB: 579.61,
			low_resource_required: true,
			overrides: {
			context_window_size: 4096,
			},
		},
		{
			model: "https://huggingface.co/mlc-ai/Llama-3.1-8B-Instruct-q4f16_1-MLC",
			model_id: "Llama-3.1-8B-Instruct-q4f16_1-MLC-1k",
			model_lib:
			  modelLibURLPrefix +
			  modelVersion +
			  "/Llama-3_1-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
			vram_required_MB: 4598.34,
			low_resource_required: true,
			overrides: {
			  context_window_size: 1024,
			},
		},
		{
			model:
			  "https://huggingface.co/mlc-ai/Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC",
			model_id: "Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC",
			model_lib:
			  modelLibURLPrefix +
			  modelVersion +
			  "/Qwen2-1.5B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
			low_resource_required: false,
			vram_required_MB: 1629.75,
			overrides: {
			  context_window_size: 4096,
			},
		},
		{
			model:
			  "https://huggingface.co/mlc-ai/Qwen2.5-Coder-3B-Instruct-q4f16_1-MLC",
			model_id: "Qwen2.5-Coder-3B-Instruct-q4f16_1-MLC",
			model_lib:
			  modelLibURLPrefix +
			  modelVersion +
			  "/Qwen2.5-3B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
			low_resource_required: true,
			vram_required_MB: 2504.76,
			overrides: {
			  context_window_size: 4096,
			},
		},
		{
			model:
			  "https://huggingface.co/mlc-ai/Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC",
			model_id: "Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC",
			model_lib:
			  modelLibURLPrefix +
			  modelVersion +
			  "/Qwen2-7B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
			low_resource_required: false,
			vram_required_MB: 5106.67,
			overrides: {
			  context_window_size: 4096,
			},
		},


		// EMBEDDING MODEL
		{
			model: "https://huggingface.co/mlc-ai/snowflake-arctic-embed-s-q0f32-MLC",
			model_id: "snowflake-arctic-embed-s-q0f32-MLC-b4",
			model_lib:
			  modelLibURLPrefix +
			  modelVersion +
			  "/snowflake-arctic-embed-s-q0f32-ctx512_cs512_batch4-webgpu.wasm",
			vram_required_MB: 238.71,
			model_type: ModelType.embedding,
		},

		// CUSTOM MODELS HERE  
		{
			model: "https://huggingface.co/kdjunkit2/Llama-3.2-1B-Instruct-abliterated3-q4f16_1-MLC",
			model_id: "Llama-3.2-1B-Instruct-abliterated3-q4f16_1-MLC",
			model_lib:
				modelLibURLPrefix +
				modelVersion +
				"/Llama-3.2-1B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
			vram_required_MB: 879.04,
			low_resource_required: true,
			overrides: {
				context_window_size: 4096,
			},
		},
		{
			model: "https://huggingface.co/kdjunkit2/Llama-3.2-3B-Instruct-abliterated-q4f16_1-MLC",
			model_id: "Llama-3.2-3B-Instruct-abliterated-q4f16_1-MLC",
			model_lib:
				modelLibURLPrefix +
				modelVersion +
				"/Llama-3.2-3B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
			vram_required_MB: 2263.69,
			low_resource_required: true,
			overrides: {
				context_window_size: 4096,
			},
		},
		{
			model: "https://huggingface.co/kdjunkit2/Meta-Llama-3-8B-Instruct-abliterated-v3-MLC",
			model_id: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
			model_lib:
			  modelLibURLPrefix +
			  modelVersion +
			  "/Llama-3_1-8B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
			vram_required_MB: 5001.0,
			low_resource_required: false,
			overrides: {
			context_window_size: 4096,
			},
		},

		//=====================================	CODE LLAMA MODELS ========================================
		{
			model: "https://huggingface.co/mlc-ai/CodeLlama-7b-hf-q4f16_1-MLC",
			model_id: "CodeLlama-7b-hf-q4f16_1-MLC",
			model_lib:
			  modelLibURLPrefix +
			  modelVersion +
			  "/Llama-2-7b-chat-hf-q4f16_1-ctx4k_cs1k-webgpu.wasm",
			vram_required_MB: 6749.02,
			low_resource_required: false,
			required_features: ["shader-f16"],
			overrides: {
			  context_window_size: 4096,
			},
		  },
		  {
			model: "https://huggingface.co/mlc-ai/CodeLlama-7b-Python-hf-q4f16_1-MLC",
			model_id: "CodeLlama-7b-Python-hf-q4f16_1-MLC",
			model_lib:
			  modelLibURLPrefix +
			  modelVersion +
			  "/Llama-2-7b-chat-hf-q4f16_1-ctx4k_cs1k-webgpu.wasm",
			vram_required_MB: 6749.02,
			low_resource_required: false,
			required_features: ["shader-f16"],
			overrides: {
			  context_window_size: 4096,
			},
		  },
		  {
			model: "https://huggingface.co/mlc-ai/CodeLlama-7b-Instruct-hf-q4f16_1-MLC",
			model_id: "CodeLlama-7b-Instruct-hf-q4f16_1-MLC",
			model_lib:
			  modelLibURLPrefix +
			  modelVersion +
			  "/Llama-2-7b-chat-hf-q4f16_1-ctx4k_cs1k-webgpu.wasm",
			vram_required_MB: 6749.02,
			low_resource_required: false,
			required_features: ["shader-f16"],
			overrides: {
			  context_window_size: 4096,
			},
		  },


	],
};