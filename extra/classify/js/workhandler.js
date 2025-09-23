
let brainWorker = null;
if (window.Worker) {
    brainWorker = new Worker("js/brainworker.js");
    brainWorker.callback = null;
    brainWorker.bstatus = null;
    brainWorker.onmessage = function (msg) {
        let info = msg.data;
        if(info.action == 'train') {
            switch(info.status) {
                case 'done':
                    if(brainWorker.callback) {
                        brainWorker.callback(info.json);
                    }
                    if(brainWorker.bstatus) {
                        if(info.accuracy >= 0) brainWorker.bstatus.innerHTML = `Done: ${info.iterations} iterations with ${info.error.toFixed(6)} error and ${info.accuracy.toFixed()}% accuracy (${info.time.toFixed(2)} seconds)`;
                        else brainWorker.bstatus.innerHTML = `Done: ${info.iterations} iterations with ${info.error.toFixed(6)} error (${info.time.toFixed(2)} seconds)`;
                    }
                    break;
                case 'training':
                    if(brainWorker.bstatus) {
                        brainWorker.bstatus.innerHTML = `Training | Iterations: ${info.iterations} (max: ${info.maxi}), Error: ${info.error.toFixed(6)}`;
                    }
                    break;
                case 'validating':
                    if(brainWorker.bstatus) {
                        brainWorker.bstatus.innerHTML = `Validating | Complete: ${info.complete.toFixed()}% `;
                    }
                    break;
            }
        }
    }
} else {
  console.log('Your browser doesn\'t support web workers.');
}

// worker for handling interactions with llm and embed models either via webllm or transformers.js
let llmWorker = null;
if (window.Worker) {
    llmWorker = new Worker(`/shared/js/llmworker.js`, { type: 'module' });
    llmWorker.callback = null;
    llmWorker.aistatus = null;
    llmWorker.ecallback = null;
    llmWorker.onmessage = function (msg) {
        let info = msg.data;
        if(info.action == 'load') {
            switch(info.status) {
                case 'done':
                    if(llmWorker.aistatus) llmWorker.aistatus.innerHTML = 'Model loaded';
                    if(llmWorker.callback) {llmWorker.callback({state: 'done', progress: 100});}
                    break;
                case 'loading':
                    if(llmWorker.aistatus) {llmWorker.aistatus.innerHTML = info.text;}
                    if(llmWorker.callback) {
                        llmWorker.callback({state: 'loading', progress: info.progress});
                    }
                    break;
            }
        }

        if(info.action == 'eload') {
            switch(info.status) {
                case 'done':
                    if(llmWorker.ecallback) {llmWorker.ecallback({state: 'done', progress: 100, msg: 'Embedding model loaded'});}
                    break;
                case 'prep':
                    if(llmWorker.aistatus) eWorker.aistatus.innerHTML = 'Preparing embed model...';
                    if(llmWorker.ecallback) {
                        llmWorker.callback({state: 'done', progress: 100, msg: 'Preparing embedding model'});
                    }
                    break;
                case 'loading':
                    if(llmWorker.ecallback) {llmWorker.ecallback({state: 'loading', progress: info.progress});}
                    break;
            }
        }

        if(info.action == 'generate') {
            switch(info.status) {
                case 'done':
                    if(llmWorker.callback) {
                        llmWorker.callback({status: 'generate', result: info.result, time: info.time, tag: info.tag});
                    }
                    if(llmWorker.aistatus) llmWorker.aistatus.innerHTML = '';
                    break;
                case 'error':
                    if(llmWorker.aistatus) {
                        llmWorker.aistatus.innerHTML = 'Generation error: ' + info.msg;
                    }
                    break;
            }
        }

        if(info.action == 'embed') {
            switch(info.status) {
                case 'done':
                    if(llmWorker.ecallback) {
                        llmWorker.ecallback({status: 'embed', state: 'done', data: info.data, progress: 100, tag: info.tag, time: info.time});
                    }
                    break;
                case 'embedding':
                    if(llmWorker.aistatus) {llmWorker.aistatus.innerHTML = 'Embedding: ' + info.progress.toFixed(0) + '%'}
                    if(llmWorker.ecallback) {
                        llmWorker.ecallback({status: 'embed', state: 'embedding', progress: info.progress, tag: info.tag});
                    }
                    break;
                case 'error':
                    console.log(info.msg);
                    break;
            }
        }
    }
} else {
  console.log('Your browser doesn\'t support web workers.');
}
