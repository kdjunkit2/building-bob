
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
                        brainWorker.bstatus.innerHTML = `Training | Iterations: ${info.iterations} iterations (max: ${info.maxi}), Error: ${info.error.toFixed(6)}`;
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
