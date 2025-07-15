
// worker for handling interations with the Kokoro TTS model
let kttsWorker = null;
if (window.Worker) {
    kttsWorker = new Worker(`/shared/js/kokoroworker.js`, { type: 'module' });
    if(!kttsWorker) {console.warn('Kokoro worker not found');}
    kttsWorker.callback = null;
    kttsWorker.aistatus = null;
    kttsWorker.onmessage = function (msg) {
        let info = msg.data;
        if(info.action == 'load') {
            switch(info.status) {
                case 'done':
                    if(kttsWorker.aistatus) kttsWorker.aistatus.innerHTML = 'TTS model loaded';
                    if(kttsWorker.callback) {kttsWorker.callback({state: 'done', progress: 100, msg: 'TTS model loaded'});}
                    break;
                case 'prep':
                    if(kttsWorker.aistatus) kttsWorker.aistatus.innerHTML = 'Preparing TTS model...';
                    if(kttsWorker.callback) {kttsWorker.callback({state: 'prep', progress: 100, msg: 'Preparing TTS model...'});}
                    break;
                case 'loading':
                    if(kttsWorker.aistatus) {kttsWorker.aistatus.innerHTML = 'Model: ' + info.progress.toFixed(0) + '%';}
                    if(kttsWorker.callback) {kttsWorker.callback({state: 'loading', progress: info.progress});}
                    break;
            }

        }

        if(info.action == 'voices') {
            switch(info.status) {
                case 'done':
                    if(kttsWorker.callback) {kttsWorker.callback({status: 'voices', data: info.data});}
                    if(kttsWorker.aistatus) kttsWorker.aistatus.innerHTML = '';
                    break;
            }
        }
        
        if(info.action == 'speak') {
            switch(info.status) {
                case 'done':
                    if(kttsWorker.callback) {kttsWorker.callback({status: 'speak', data: info.data, text: info.text, time: info.time});}
                    if(kttsWorker.aistatus) kttsWorker.aistatus.innerHTML = '';
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

//}