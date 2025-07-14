
const modelParams = {max_new_tokens: 128, temperature: 0.2, top_p: 0.7};//, repetition_penalty: 1.2};
let modelIndex = -1;

const modelStatus = {
    ready: false,
    eready: false,
    isGPU: true,
}

const modelInfo = [
    {
        short: 'Small, SFW',
        name: 'SmolLM2-360M-Instruct-q4f32_1-MLC',
        desc: '360M parameters, small sized (for the browser) generative model that is SFW (safe for work).',
        modelid: 'mlc-ai/SmolLM2-360M-Instruct-q4f32_1-MLC',
        type: 'webllm',
        tech: 'WebLLM, MLC LMM (machine learning compiler)',
        content: 'SFW (safe for work)',
        gpu: 'yes',
        size: '0.58 GB',
        cached: false
    },
    {
        short: 'Moderate, SFW',
        name: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
        desc: '1 billion parameters, moderately sized (for the browser) generative model that is SFW (safe for work).',
        modelid: 'mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC',
        type: 'webllm',
        tech: 'WebLLM, MLC LMM (machine learning compiler)',
        content: 'SFW (safe for work)',
        gpu: 'yes',
        size: '0.88 GB',
        cached: false
    },
    {
        short: 'Moderate, NSFW',
        name: 'Llama-3.2-1B-Instruct-abliterated3-q4f16_1-MLC',
        desc: '1 billion parameters, moderately sized (for the browser) generative model that is NSFW (not safe for work). Model may generate biased or explicit information.',
        modelid: 'kdjunkit2/Llama-3.2-1B-Instruct-abliterated3-q4f16_1-MLC',
        type: 'webllm',
        tech: 'WebLLM, MLC LMM (machine learning compiler)',
        content: 'NSFW (not safe for work)',
        gpu: 'yes',
        size: '0.88 GB',
        cached: false
    },
    {
        short: 'Large, SFW',
        name: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
        desc: '3 billion parameters, large (for the browser) generative model that is SFW (safe for work). Model may generate biased or explicit information.',
        modelid: 'mlc-ai/Llama-3.2-3B-Instruct-q4f16_1-MLC',
        type: 'webllm',
        tech: 'WebLLM, MLC LMM (machine learning compiler)',
        content: 'SFW (safe for work)',
        gpu: 'yes',
        size: '2.26 GB',
        cached: false
    },
    {
        short: 'Large, NSFW',
        name: 'Llama-3.2-3B-Instruct-abliterated-q4f16_1-MLC',
        desc: '3 billion parameters, large (for the browser) generative model that is NSFW (not safe for work). Model may generate biased or explicit information.',
        modelid: 'kdjunkit2/Llama-3.2-3B-Instruct-abliterated-q4f16_1-MLC',
        type: 'webllm',
        tech: 'WebLLM, MLC LMM (machine learning compiler)',
        content: 'NSFW (not safe for work)',
        gpu: 'yes',
        size: '2.26 GB',
        cached: false
    },
    {
        short: 'Very Large, SFW',
        name: 'Llama-3.1-8B-Instruct-q4f16_1-MLC',
        desc: '8 billion parameters, very large (for the browser) generative model that is SFW (safe for work). Model may generate biased or explicit information.',
        modelid: 'mlc-ai/Llama-3.1-8B-Instruct-q4f16_1-MLC',
        type: 'webllm',
        tech: 'WebLLM, MLC LMM (machine learning compiler)',
        content: 'SFW (safe for work)',
        gpu: 'yes',
        size: '4.60 GB',
        cached: false
    },
    {
        short: 'Very Large, NSFW',
        name: 'Meta-Llama-3-8B-Instruct-abliterated-v3-MLC',
        desc: '8 billion parameters, very large (for the browser) generative model that is NSFW (not safe for work). Model may generate biased or explicit information.',
        modelid: 'kdjunkit2/Meta-Llama-3-8B-Instruct-abliterated-v3-MLC',
        type: 'webllm',
        tech: 'WebLLM, MLC LMM (machine learning compiler)',
        content: 'NSFW (not safe for work)',
        gpu: 'yes',
        size: '4.60 GB',
        cached: false
    },
    {
        short: 'Very Small, SFW (cpu, no gpu)',
        name: 'SmolLM2-135M-Instruct',
        desc: '135 million parameters, very small generative model that is SFW (safe for work).  Better for running on the CPU, but may not perform as well.',
        modelid: 'HuggingFaceTB/SmolLM2-135M-Instruct',
        type: 'onnx',
        tech: 'Hugging Face transformers.js',
        content: 'SFW (safe for work)',
        gpu: 'no',
        size: '0.14 GB',
        cached: false
    },
    {
        short: 'Small, SFW (cpu, no gpu)',
        name: 'SmolLM2-360M-Instruct',
        desc: '360 million parameters, small generative model that is SFW (safe for work).  Better for running on the CPU, but may not perform as well.',
        modelid: 'HuggingFaceTB/SmolLM2-360M-Instruct',
        type: 'onnx',
        tech: 'Hugging Face transformers.js',
        content: 'SFW (safe for work)',
        gpu: 'no',
        size: '0.27 GB',
        cached: false
    },
    {
        short: 'Moderate, SFW (cpu, no gpu)',
        name: 'SmolLM2-1.7B-Instruct',
        desc: '1.7 billion parameters, moderate to large sized (for the browser) generative model that is is SFW (safe for work). Runs on the CPU so responses may be slow.',
        modelid: 'HuggingFaceTB/SmolLM2-1.7B-Instruct',
        type: 'onnx',
        tech: 'Hugging Face transformers.js',
        content: 'SFW (Safe for work)',
        gpu: 'no',
        size: '1.27 GB',
        cached: false
    },
    

]

const hfurl = 'https://huggingface.co/';

async function isWebllmModelCached(modelIdx) {
    if(modelIdx < 0 || modelIdx >= modelInfo.length) return false;

    const cache = await caches.open('webllm/model');
    let mdl = `${hfurl}${modelInfo[modelIdx].modelid}/resolve/main/params_shard_0.bin`;

    const response = await cache.match(mdl);
    return response !== undefined;
}


async function listCachedFiles(cacheName = 'webllm/model') {
    if ('caches' in window) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys(); // Retrieve all requests (files) in the cache
    
        const cachedUrls = requests.map(request => request.url);
        console.log("Cached files:", cachedUrls);
    } else {
        console.log("Cache Storage API is not supported in this browser.");
    }
}

//listCachedFiles();