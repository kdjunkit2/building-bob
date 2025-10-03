// expects your main html file to contain: <script src="//unpkg.com/brain.js"></script> for the emotion class

import { knowledgeHandler } from './knowledge.mjs'
import { sysDevicesInitialize } from './device.mjs';

export const localSystem = await sysDevicesInitialize();

export class characterManager {
    constructor(name = '') {
        this.characters = [];
        this.useLLM = false;
        this.forceCPU = false;
        this.ready = {
            embedding: false,
            llm: true,
            knowledge: true,
            knowledgeEmbedded: true,
            knowledgeCount: 0,
        }

        this.knowledgeBase = new knowledgeHandler();
        this.ekStatus = {};
        this.ekCount = 0;
        
        if(name.length) this.add(name, sysrole);
    }

    add(name, sysrole = "You are an AI assistant. Keep answers brief and conversational.", etemperment = {style: 'Base', callback: null}) {
        if(!name) return {error: 'no name provided'};
        if(!name.length) return {error: 'no name provided'};

        // -----------------------   CHECK NAME UNIQUENESS

        this.characters[this.characters.length] = new characterClass(this, name, sysrole, etemperment);
    }

    getCharacterByName(name = '') {
        if(!name.length) {
            if(!this.characters.length) return null;
            return this.characters[this.characters.length - 1];
        }
        for(let i=0; i<this.characters.length; i++) {
            if(this.characters[i].name == name) return this.characters[i];
        }
        return null;
    }

    /*
        params = {
            usellm: true or false,
            llmModelId: the model id from models.js,
            llmCallback: calling script's callback for llm load status,
            embedCallback: calling script's callback for embedding model load status,
        }
    */
    loadModels = (params) => {
        if(!llmWorker) return {error: 'no llmWorder available'};
        if(!params) {return {error: 'missing parameters'}}

        if(!this.ready.embedding) {
            llmWorker.ecallback = (e) => {this.emodelLoaded(e, params.embedCallback);};
            llmWorker.postMessage({action: 'eload', gpu: localSystem.gpu.available});
        }

        if(params.usellm && params.llmModelId.length) {
            this.useLLM = true;
            this.ready.llm = false;
            const gpu = localSystem.gpu.available && !params.forceCPU;
            llmWorker.callback = (e) => {this.modelLoaded(e, params.llmCallback);};
            llmWorker.postMessage({action: 'load', model: modelInfo[modelIndex].modelid, gpu: gpu});
        } else {
            this.useLLM = false;
            this.ready.llm = true;
        }
    }

    loadEmbeddingModel = (params) => {
        if(!llmWorker) return {error: 'no llmWorker available'};
        if(!params) {return {error: 'missing parameters'}}
        if(!this.ready.embedding) {
            llmWorker.ecallback = (e) => {this.emodelLoaded(e, params.embedCallback);};
            llmWorker.postMessage({action: 'eload', gpu: localSystem.gpu.available});
        }
        return {success: 'embedding load requested'};
    }

    loadLLM = (params) => {
        if(!llmWorker) return {error: 'no llmWorker available'};
        if(!params) {return {error: 'missing parameters'}}

        if(params.usellm && params.llmModelId.length) {
            this.useLLM = true;
            this.ready.llm = false;
            const gpu = localSystem.gpu.available && !params.forceCPU;
            llmWorker.callback = (e) => {this.modelLoaded(e, params.llmCallback);};
            llmWorker.postMessage({action: 'load', model: modelInfo[modelIndex].modelid, gpu: gpu});
        } else {
            if(this.useLLM) {llmWorker.postMessage({action: 'unload'});}
            this.useLLM = false;
            this.ready.llm = true;
        }
    }

    unloadLLM() {
        if(this.useLLM) {llmWorker.postMessage({action: 'unload'});}
        this.useLLM = false;
        this.ready.llm = true;
    }

    emodelLoaded(result, ecallback) {
        if(result.state == 'done') {
            this.ready.embedding = true;
        }
        if(ecallback) ecallback(result);
    }

    modelLoaded(result, mcallback) {
        if(result.state == 'done') {
            this.useLLM = true;
            this.ready.llm = true;
        }
        if(mcallback) mcallback(result);
    }

    /*
        knowledge = {
            faq: url to faq csv file,
            Info: [
                {url: url to text file, name: reference name for content},
                {url: url to text file, name: reference name for content},
                etc...
            ],
            callback: function to call when the knowledge base has been embedded
        }
    */
    async addCharacterKnowledge(knowledge, name = '') {
        const character = this.getCharacterByName(name);
        if(!character) return {error: `character '${name}' not found`};

        if(!knowledge) return {error: 'missing knowledge object'};
        if(knowledge.faq) {
            if(knowledge.faq.url) {
                const faqresult = await character.knowledgeBase.faqFromCSV(knowledge.faq.url, knowledge.faq.header, knowledge.faq.name);
                if(faqresult.error) return faqresult;
                character.ready.knowledgeCount++;
                character.ready.knowledge = false;
                character.ready.character = false;
            }
        }

        if(knowledge.info) {
            const ilen = knowledge.info.length
            if(ilen) {
                for(let i=0; i<ilen; i++) {
                    const inforesult = await character.knowledgeBase.addInfo(knowledge.info[i].url, knowledge.info[i].name);
                    if(inforesult.error) return inforesult;
                }
                character.ready.knowledgeCount += ilen;
                character.ready.knowledge = false;
                character.ready.character = false;
            }
        }

        if(character.knowledgeLoaded()) {
            if(this.ready.embedding) character.embedKnowledge(knowledge.callback);
            else {
                this.embedCharacterKnowledge(name, knowledge.callback);                
            }
            return {success: 'information loaded'};
        } else {
            return {error: 'information not fully loaded'};
        }
    }

    embedCharacterKnowledge = (name, callback) => {
        const character = this.getCharacterByName(name);
        if(!character) return {error: `character '${name}' not found`};
        if(this.ready.embedding) character.embedKnowledge(callback);
        else {
            setTimeout(this.embedCharacterKnowledge, 100, name, callback);
        }
    }

    characterReady(name = '') {
        const character = this.getCharacterByName(name);
        if(!character) return {error: `character '${name}' not found`};
        if(this.ready.llm && this.ready.embedding && this.ready.knowledgeEmbedded && character.ready.knowledgeEmbedded) {
            return true;
        } else {
            return false;
        }
    }

    // see above for knowledge object structure
    async addSharedKnowledge(knowledge, name = '') {
        if(!knowledge) return {error: 'missing knowledge object'};
        if(knowledge.faq) {
            if(knowledge.faq.url) {
                const faqresult = await this.knowledgeBase.faqFromCSV(knowledge.faq.url, knowledge.faq.header);
                if(faqresult.error) return faqresult;
                this.ready.knowledgeCount++;
                this.ready.knowledge = false;
                this.ready.knowledgeEmbedded = false;
            }
        }

        if(knowledge.info) {
            const ilen = knowledge.info.length
            if(ilen) {
                for(let i=0; i<ilen; i++) {
                    const inforesult = await this.knowledgeBase.addInfo(knowledge.info[i].url, knowledge.info[i].name);
                    if(inforesult.error) return inforesult;
                }
                this.ready.knowledgeCount += ilen;
                this.ready.knowledge = false;
                this.ready.knowledgeEmbedded = false;
            }
        }

        if(this.knowledgeLoaded()) {
            if(this.ready.embedding) this.embedKnowledge(knowledge.callback);
            else {
                this.embedSharedKnowledge(knowledge.callback);                
            }
            return {success: 'information loaded'};
        } else {
            return {error: 'information not fully loaded'};
        }
    }

    embedSharedKnowledge = (callback) => {
        if(this.ready.embedding) this.embedKnowledge(callback);
        else {
            setTimeout(this.embedSharedKnowledge, 100, callback);
        }
    }

    knowledgeLoaded() {
        let kc = 0;
        if(this.knowledgeBase.hasFAQ()) kc++;
        kc += this.knowledgeBase.getInfoCount();
        this.ready.knowledge = false;
        if(kc == this.ready.knowledgeCount) {
            this.ready.knowledge = true;
        }
        return this.ready.knowledge;
    }

    embedKnowledge(callback) {
        this.ekStatus = {};
        this.ekCount = 0;
        if(this.knowledgeBase.hasFAQ()) {
            const q = this.knowledgeBase.faQuestions();
            this.ekStatus.faq = 0;
            llmWorker.ecallback = (e) => {this.embedReady(e, callback);};
            llmWorker.postMessage({action: 'embed', sentences: q, q: 5, tag: 's_faq'});
        }

        const ic = this.knowledgeBase.getInfoCount();
        for(let i=0; i<ic; i++) {
            const info = this.knowledgeBase.getInfoByIndex(i);
            const iname = this.knowledgeBase.genInfo[i].name;
            this.ekStatus[iname] = 0;
            llmWorker.ecallback = (e) => {this.embedReady(e, callback);};
            llmWorker.postMessage({action: 'embed', sentences: info, q: 5, tag: `s_${iname}`});
        }
    }

    embedReady(result, callback) {
        const identifiers = result.tag.split('_');
        result.tag = result.tag = identifiers[1];
        if(identifiers[0] != 's') {
            const character = this.getCharacterByName(identifiers[0]);
            if(!character) {console.warn(`Character ${identifiers[0]} not found for knowledge embedding`); return;}
            character.embedReady(result, callback);
            return;
        }

        if(result.state == 'embedding') {
            this.ekStatus[result.tag] = result.progress;
            const values = Object.values(this.ekStatus);
            result.progress = meanArray(values);
            if(callback) callback(result, 'shared');
            return;
        }

        this.ekStatus[result.tag] = result.progress;
        const values = Object.values(this.ekStatus);
        result.progress = meanArray(values);

        let resp;
        if(result.tag == 'faq') {
            resp = this.knowledgeBase.faqEmbeddings(result.data);
        } else {
            resp = this.knowledgeBase.setInfoEmbeddings(result.data, identifiers[1]);
        }

        if(resp.error) {console.warn(resp.error); return;}
        this.ekCount++;
        if(this.ekCount == this.ready.knowledgeCount){
            this.ready.knowledgeEmbedded = true;
            this.ready.knowledge = true;
            result.state = 'finished';
        }
        if(callback) callback(result, 'shared');
    }

    setCharacterFAQ(fname, data, callback, name='') {
        if(!data) return {error: 'no FAQ data provided'};
        if(!data.length) return {error: 'no FAQ data provided'};
        const character = this.getCharacterByName(name);
        if(!character) return {error: `character '${name}' not found`};
        return character.setFAQ(fname, data, callback);
    }

    addCharacterInfo(iname, data, callback, name='') {
        if(!data) return {error: 'no FAQ data provided'};
        if(!data.length) return {error: 'no FAQ data provided'};
        const character = this.getCharacterByName(name);
        if(!character) return {error: `character '${name}' not found`};
        return character.addInfo(iname, data, callback);
    }

    wipeCharacterInfo(name='') {
        const character = this.getCharacterByName(name);
        if(!character) return {error: `character '${name}' not found`};
        return character.wipeInfo();
    }

    removeCharacterInfo(iname, name='') {
        const character = this.getCharacterByName(name);
        if(!character) return {error: `character '${name}' not found`};
        return character.removeInfo(iname);
    }

    setDontKnow(text, name = '') {
        if(!text.length) {return {error: 'No text provided'};}
        const character = this.getCharacterByName(name);
        if(!character) return {error: `character '${name}' not found`};
        return character.setDontKnow(text);
    }

    prompt(text, callback, name = '') {
        const character = this.getCharacterByName(name);
        if(!character) return {error: `character '${name}' not found`};
        character.prompt(text, callback, this.useLLM);
    }

    characterFAQName(name = '') {
        const character = this.getCharacterByName(name);
        if(!character) return {error: `character '${name}' not found`};
        return character.knowledgeBase.faq.name;
    }

    characterInfoNames(name = '') {
        const character = this.getCharacterByName(name);
        if(!character) return {error: `character '${name}' not found`};
        return character.knowledgeBase.getInfoNames();
    }

}

class characterClass {
    constructor(parent, name = '', sysrole = "You are an AI assistant. Keep answers brief and conversational.", etemperment = {style: 'Base', callback: null}) {
        this.parent = parent;
        this.name = name;
        this.knowledgeBase = new knowledgeHandler(this.parent.knowledgeBase);
        this.ready = {
            knowledge: true,
            knowledgeEmbedded: true,
            knowledgeCount: 0,
        }
        this.recentLog = [];
        this.keepTurns = 5;
        this.ekStatus = {};
        this.ekCount = 0;
        this.role = sysrole;

        this.responseType = {
            dontKnow: 'That is a little outside what I know.',
            answerlength: 'Answer in a one sentence.',
        }

        this.archetype = {style: etemperment.style, callback: etemperment.callback, name: name};
        this.emotion = new emotionCharacter(this.archetype);
    }

    knowledgeLoaded() {
        let kc = 0;
        if(this.knowledgeBase.hasFAQ()) kc++;
        kc += this.knowledgeBase.getInfoCount();
        this.ready.knowledge = false;
        if(kc == this.ready.knowledgeCount) {
            this.ready.knowledge = true;
            if(!kc) this.ready.knowledgeEmbedded = true;
        }
        return this.ready.knowledge;
    }

    embedKnowledge(callback) {
        this.ekStatus = {};
        this.ekCount = 0;
        if(this.knowledgeBase.hasFAQ()) {
            const q = this.knowledgeBase.faQuestions();
            this.ekStatus.faq = 0;
            llmWorker.ecallback = (e) => {this.parent.embedReady(e, callback, this.name);};
            llmWorker.postMessage({action: 'embed', sentences: q, q: 5, tag: `${this.name}_faq`});
        }

        const ic = this.knowledgeBase.getInfoCount();
        for(let i=0; i<ic; i++) {
            const info = this.knowledgeBase.getInfoByIndex(i);
            const iname = this.knowledgeBase.genInfo[i].name;
            this.ekStatus[iname] = 0;
            llmWorker.ecallback = (e) => {this.parent.embedReady(e, callback, this.name);};
            llmWorker.postMessage({action: 'embed', sentences: info, q: 5, tag: `${this.name}_${iname}`});
        }
    }

    embedReady(result, callback) {
        if(result.state == 'embedding') {
            this.ekStatus[result.tag] = result.progress;
            const values = Object.values(this.ekStatus);
            result.progress = meanArray(values);
            if(callback) callback(result, this.name);
            return;
        }

        this.ekStatus[result.tag] = result.progress;
        const values = Object.values(this.ekStatus);
        result.progress = meanArray(values);

        let resp;
        if(result.tag == 'faq') {
            resp = this.knowledgeBase.faqEmbeddings(result.data);
        } else {
            resp = this.knowledgeBase.setInfoEmbeddings(result.data, result.tag);
        }

        if(resp.error) {console.warn(resp.error); return;}
        this.ekCount++;
        if(this.ekCount == this.ready.knowledgeCount){
            this.ready.knowledgeEmbedded = true;
            this.ready.character = true;
            result.state = 'finished';
        }
        if(callback) callback(result, this.name);
    }

    setFAQ(fname, data, callback=null) {
        if(!data) return {error: 'no Info data provided'};
        if(!data.length) return {error: 'no Info data provided'};
        if(!fname.length) fname = 'faqcore';
        const result = this.knowledgeBase.faqFromTextBlob(data, true, fname);
        if(result.error) return result.error;
        const q = this.knowledgeBase.faQuestions();
        llmWorker.ecallback = (e) => {this.ifEmbedReady(e, callback, this.name);};
        llmWorker.postMessage({action: 'embed', sentences: q, q: 5, tag: `faq`});
        return {success: 'FAQ sent for embedding'};
    }

    addInfo(iname, data, callback = null) {
        if(!data) return {error: 'no Info data provided'};
        if(!data.length) return {error: 'no Info data provided'};
        const result = this.knowledgeBase.addInfoText(data, iname);
        if(result.error) return result;
        const info = this.knowledgeBase.getInfo(iname);
        llmWorker.ecallback = (e) => {this.ifEmbedReady(e, callback, this.name);};
        llmWorker.postMessage({action: 'embed', sentences: info, q: 5, tag: `${iname}`});
        return {success: 'Info sent for embedding'};
    }

    ifEmbedReady(result, callback) {
        if(result.state == 'embedding') {
            if(callback) callback(result, this.name);
            return;
        }
        let resp;
        if(result.tag == 'faq') {
            resp = this.knowledgeBase.faqEmbeddings(result.data);
        } else {
            resp = this.knowledgeBase.setInfoEmbeddings(result.data, result.tag);
        }

        if(resp.error) {console.warn(resp.error); return;}
        if(callback) callback(result, this.name);
    }

    wipeInfo() {this.knowledgeBase.wipeInfo(); return {success: 'Information wiped'};}
    removeInfo(iname) {this.knowledgeBase.removeInfo(iname); return {success: `${iname} removed`};}

    setDontKnow(text) {
        if(!text.length) {return {error: 'No text provided'};}
        this.knowledgeBase.responseType.dontKnow = text;
    }

    _logAnswer(answer) {
        this.recentLog.push(answer);
        if(this.recentLog.length > this.keepTurns) {
            this.recentLog.shift();
        }
    }

    prompt(text, callback, usellm) {
        llmWorker.ecallback = (e) => {this.ePrompt(e, callback, usellm, text);};
        llmWorker.postMessage({action: 'embed', sentences: [text], q: 5, tag: 'prompt'});
    }

    ePrompt(result, callback, usellm, textprompt) {
        if(result.state == 'embedding') return;

        const e = result.data[0];
        let topk = 5;
        if(usellm) { // expanded for LLM to get more context;
            topk = 10;
            this.knowledgeBase.infoThreshold = 0.75;
        }
        const answer = this.knowledgeBase.ePrompt(e, topk, this.responseType.dontKnow); // {text, match, h, source}
        if(usellm) {
            if(answer[0].question.length && answer[0].source == 'faq') {    // This means the primary answer is from an FAQ which 
                                                                            // takes precedent
                if(this.emotion.on) {
                    const emoresult = this.emotion.ePrompt(e);
                    if(emoresult.trigger != 'neutral' && emoresult.reply.length) {
                        answer[0].text = emoresult.reply;
                        answer[0].match = 0;
                        answer[0].h = 0;
                        answer[0].source = 'emotion';
                    }
                }
                console.log(answer[0]);
                this._logAnswer(answer[0]);
                if(callback) callback(answer);
                return;
            }
            
            let context = '';
            for(let i=0; i<answer.length; i++) {
                context += `${answer[i].text}\n`;
            }

            // calls the helper function that actuall builds the prompt
            const messages = this._buildPrompt({textprompt: textprompt, context: context, e: e});
            
            const entry = {qe: e, q: textprompt, a:''};
            llmWorker.callback = (e) => {this.llmResponse(e, callback, entry);};
            llmWorker.postMessage({action: 'generate', messages: messages});

        } else {
            if(answer[0].match > 0 && answer[0].source != 'faq') {  // found a match, but not already from FAQ
                const faeresult = this.knowledgeBase.faqAddEntry(e, textprompt, answer[0].text); 
                if(faeresult.error) {console.warn(faeresult.error);}           
            }
            if(!answer[0].question.length) answer[0].question = textprompt;
            if(this.emotion.on && answer[0].match == 0) { // emotion on and a don't know response
                const emoresult = this.emotion.ePrompt(e); // {mood, level, reply, prompthint}
                console.log(emoresult);
                if(emoresult.reply.length) {answer[0].text = emoresult.reply;}
            }
            this._logAnswer(answer[0]);
            if(callback) callback(answer);
        }
    }

    llmResponse(response, callback, entry) {
        const answer = [{text: response.result, question: entry.q, match: 0, v: 0, d: 0}];
        this.knowledgeBase.faqAddEntry(entry.qe, entry.q, response.result); 
        this._logAnswer(answer[0]);
        if(callback) callback(answer);
    }

    _buildPrompt({textprompt, context, e}) {
        const sysrole = this.role;
        const answerlength = this.responseType.answerlength;
        const recent = this.recentLog;

        // Gets up to 10 FAQ examples for few shot learning
        const faq = this.knowledgeBase.fewShot(e, 10);

        let emohint = '';
        if(this.emotion.on) {
            const emoresult = this.emotion.ePrompt(e);
            emohint = emoresult.prompthint;
            console.log('emostate: ', emoresult);
        }

        // if there is context, add it to the system prompt
        let system = context.length
            ? `${sysrole}\n\nHere is what you know:\n\nContext: ${context}`
            : `${sysrole}`;

        if(emohint.length) {system += `\n\n${emohint}`;}

        // the user prompt contains the user query and the desired answer length from the LLM
        const userPrompt = `Question: ${textprompt}\n\n${answerlength}.\n\nAnswer:`;

        let prompt = [];
        // the system prompt always goes first.
        prompt.push({ role: 'system', content: system });
        // The few shot examples are added to the overall prompt and come after the system prompt
        let i;
        for(i=0; i<faq.length; i++) {
            // these few shot examples act as a guide to let the LLM know how to respond.  they are always
            // user / assistant pairs to show examples of what the user asked and how the model responded
            // this gives the model examples of how it should respond to the actual user query.
            prompt.push({role: 'user', content: faq[i].question});
            prompt.push({role: 'assistant', content: faq[i].text});
        }
        for(i=0; i<recent.length; i++) {
            prompt.push({role: 'user', content: recent[i].question});
            prompt.push({role: 'assistant', content: recent[i].text});
        }

        // finally the current user prompt is added to have the complete prompt sent to the LLM
        prompt.push({ role: 'user', content: userPrompt });
        console.log('fullprompt: ', prompt);
        return prompt;
    }
}

const ELENGTH = 384;

class emotionCore {
    constructor(url = null) {
        this.net = null;
        this.model = null;
        this.labels = [];

        if(url) {this.create(url);}
    }

    create = (url) => {
        fetch(url) // fetches the emotion file
            .then((res) => res.json())
            .then((data) => {
                this.net = data;
                this.model = new brain.NeuralNetwork();
                this.model.fromJSON(this.net);
                this.labels = Object.keys(this.net.outputLookup);
            })
            .catch((err) => console.error('Failed to load emotion:', err));
    }

    ePrompt(e) {
        if(!this.model) return {error: `Emotion model not available`};
        if(e.length != 384) {return {error: `Emotion input should be array of length: ${ELENGTH}`};}
        const output = this.model.run(e);
        const noutput = this.softmaxNormalize(output, 0.2);
        const entries = Object.entries(noutput);
        entries.sort((a, b) => b[1] - a[1]);
        let obj = [];
        for(let i=0; i<entries.length; i++) {obj[entries[i][0]] = entries[i][1];}
        return obj;
    }

    softmaxNormalize(raw, temperature = 1.0) {
        const LABELS = this.labels;
        const vals = LABELS.map(k => (raw[k] ?? 0));
        const t = Math.max(1e-6, temperature);
        const max = Math.max(...vals);
        const exps = vals.map(v => Math.exp((v - max) / t));
        const sum  = exps.reduce((a,b)=>a+b, 0) || 1;
        const out = {};
        LABELS.forEach((k,i) => out[k] = exps[i] / sum);
        return out; // sums to ~1
    }
}

const emoCore = new emotionCore('/shared/modelsai/i_d_nismall_b_h1.json');
/*
Base = middle of the road temperment
Mello = slow to show emotion never gets to extremes, quick to return to neutral
Hot = quick to anger and slow to cool down, slow to happiness and quick return to neutral
Joyous = quick to happiness slow to return to neutral, slow to anger and quick to return to normal
Meet = Never gets too angry, but quick to happiness slower return to neutral for either
*/
const emoTemperments = ['Base', 'Mello', 'Hot', 'Joyous', 'Meek'];
const emoDecay = {
    Base: {neg: 10000, pos: 10000},
    Mello: {neg: 10000, pos: 10000},
    Hot: {neg: 60000, pos: 20000},
    Joyous: {neg: 20000, pos: 60000},
    Meek: {neg: 30000, pos: 30000},
}

class emotionCharacter {
    constructor(etemperment = {style: 'Base', callback: null, name: ''}) {
        this.temperment = {
            style: etemperment.style,
            decay: {
                neg: emoDecay[etemperment.style].neg, 
                pos: emoDecay[etemperment.style].pos,
            },
            callback: etemperment.callback,
            name: etemperment.name,
        }
        this.units = 0;
        this.level = 0;
        this.timer = 0;
        this.currentMood = 'Neutral';
        this.on = true;

        if(emoTemperments.indexOf(this.temperment.style) < 0) {
            console.warn('Invalid temperment provided resetting to base');
            this.temperment.style = 'Base';
            this.temperment.decay.neg = 2500;
            this.temperment.decay.pos = 2500;
        }
    }

    ePrompt(e) {
        if(e.length != 384) {return {error: `Emotion input should be array of length: ${ELENGTH}`}}
        const output = emoCore.ePrompt(e);
        let trigger = 'neutral';
        if(output.insult >= 0.7) {
            this.units--;
            if(this.units < -10) this.units = -10;
            trigger = 'insult';
        } else {
            if(output.delight >= 0.7) {
                this.units++;
                if(this.units > 10) this.units = 10;
                trigger = 'delight';
            }
        }
        this._level();
        return this._mood(trigger);
    }

    _level() {
        switch(this.temperment.style) {
            case 'Base':
                this.level = this.units * 10;
                break;
            case 'Mello':
                this.level = 0.0281*this.units*this.units*this.units-0.00000000000001*this.units*this.units+3.1879*this.units+0.000000000004;
                break;
            case 'Hot':
                if(this.units < 0) {this.level = 1.211*this.units*this.units + 21.428*this.units - 4.972;}
                else {this.level = 0.0281*this.units*this.units*this.units-0.00000000000001*this.units*this.units+3.1879*this.units+0.000000000004;}
                break;
            case 'Joyous':
                if(this.units <= 0) {this.level = 0.0281*this.units*this.units*this.units-0.00000000000001*this.units*this.units+3.1879*this.units+0.000000000004;}
                else {this.level = -(1.211*this.units*this.units - 21.428*this.units - 4.972);}
                break;
            case 'Meek':
                if(this.units <= 0) {this.level = 0.0583*this.units*this.units*this.units+1.049*this.units*this.units+7.5361*this.units-4;}
                else {
                    if(this.units == 0) {this.level = 0;}
                    else {this.level = -(1.211*this.units*this.units - 21.428*this.units - 4.972);}
                }
                break;
            default:
                console.warn('Invalid temperment style');
        }
    }

    _mood(trigger) {
        const moods = [
            [-100, -70, 'Livid'],
            [-70, -50, 'Angry'],
            [-50, -30, 'Annoyed'],
            [-30, -10, 'Apologetic'],
            [-10, 10, 'Neutral'],
            [10, 30, 'Content'],
            [30, 50, 'Pleased'],
            [50, 70, 'Happy'],
            [70, 100, 'Elated'],
        ]
        for(let i=0; i<moods.length; i++) {
            if(this.level >= moods[i][0] && this.level < moods[i][1]) {
                this.currentMood = moods[i][2];
                break;
            }
        }

        let reply = '';
        if(trigger != 'neutral') {
            const group = EMO_REPLY_OVERRIDES[trigger] || {};
            const lines = group[this.currentMood] || group.Neutral || ["Okay."];
            const opt = randIntBetween(0, lines.length - 1);
            reply = lines[opt];
            this._decay(trigger);
        }

        return {mood: this.currentMood, level: this.level, trigger: trigger, reply: reply, prompthint: EMO_PROMPT_HINTS[this.currentMood]};
    }

    _decay = (trigger) => {
        if(this.timer) clearTimeout(this.timer);
        this.timer = 0;
        if(this.units == 0) {return;}
        if(trigger != 'neutral') {
            if(trigger == 'insult') this.timer = setTimeout(this._decay, this.temperment.decay.neg, 'neutral');
            else this.timer = setTimeout(this._decay, this.temperment.decay.pos, 'neutral');
            return;
        }
        if(this.units < 0) {
            this.units++;
            if(this.units > 0) {
                this.units == 0;

            } else {
                this._level();
                this._mood('neutral');
                this.timer = setTimeout(this._decay, this.temperment.decay.neg, 'neutral');
            }

        } else {
            this.units--;
            if(this.units < 0) {
                this.units == 0;
            } else {
                this._level();
                this._mood('neutral');
                this.timer = setTimeout(this._decay, this.temperment.decay.pos, 'neutral');
            }
        }
        if(this.temperment.callback) this.temperment.callback();
    } 
}

const EMO_REPLY_OVERRIDES = {
    insult: {
        Livid: [
            "That crossed a line. Let's keep it respectful.",
            "Respect the line. Speak plainly or step back.",
            "That's over the line—dial it back.",
            "Enough. Let's stick to the topic.",
            "Cut the insults. Focus or we're done.",
            "Spicy. Now say it without the garnish.",
            "Sharp words—blunt results. Try again.",
        ],
        Angry: [
            "Not cool. Let's keep it civil.",
            "Please don't talk to me like that.",
            "Let's keep the conversation respectful.",
            "Lose the edge and say what you need.",
            "Drop the jabs and get to the point.",
            "Point taken—minus the pointy bits.",
            "Sass noted. What's the ask?",
            "Boundary set. Keep it task-focused.",
        ],
        Annoyed: [
            "Let's keep it constructive.",
            "We can skip the jabs and keep going.",
            "Insults won't help. Say what you actually want.",
            "Let's tone it down and move on.",
            "That doesn't help—what do you need?",
            "If the goal was progress, that wasn't it.",
            "Be direct, not rude.",
            "Noted. Maintain civility.",
            "Cute. Now the actual problem?",
        ],
        Apologetic: [
            "I'm sorry if I caused you unhappiness",
            "I'm sorry you feel that way.",
            "I hear you—I'll try to do better.",
            "Sorry—that missed the mark.",
            "That's unfortunate.",
            "Sorry to hear that.  Please keep it professional.",
            "Noted, let proceed with mutual respect."
        ],
        Neutral: [
            "That's not what I like to hear.",
            "Not what I was expecting...",
            "Let's keep things respectful.",
            "Got it—moving on.",
            "Noted. How can I help?",
            "Keep it professional.",
        ],
        Content: [
            "Hey—let's keep it respectful, okay?",
            "No need for that—let's focus.",
            "Let's keep it friendly and on track.",
            "We can do better than insults.",
            "Let's stick to the problem."
        ],
        Pleased: [
            "Let's stay respectful so I can help.",
            "Let's keep this productive.",
            "I'm here to help—skip the digs.",
            "We'll get farther without insults.",
            "Happy to help—keep it civil."
        ],
        Happy: [
            "I'm all for good vibes—let's stay respectful.",
            "Let's keep this positive and on-track.",
            "We'll make progress without the jabs.",
            "I'm listening—just keep it civil.",
            "Let's reset and try again."
        ],
        Elated: [
            "Let's keep the good energy—no insults.",
            "We're making progress—stay respectful.",
            "Cool heads help us solve this.",
            "I'm here for you—let's keep it kind.",
            "Let's channel that into the task."
        ],
    },

    delight: {
        Livid: [
            "…Thanks. I appreciate that.",
            "Noted—thanks.",
            "I appreciate the acknowledgment.",
            "Thanks for saying that.",
            "Thanks—moving forward."
        ],
        Angry: [
            "Thanks. That helps.",
            "Appreciate it.",
            "Thanks for the positive note.",
            "Good to hear—thank you.",
            "Thanks—let's keep going."
        ],
        Annoyed: [
            "Thanks—appreciated.",
            "Good to hear.",
            "Thanks for the feedback.",
            "That helps—thank you.",
            "Appreciate the kind words."
        ],
        Apologetic: [
            "Thanks for the patience.",
            "Glad that helped—thank you.",
            "I appreciate the understanding.",
            "Thanks—I'll keep improving.",
            "Thanks for sticking with me."
        ],
        Neutral: [
            "Thanks! Glad that helped.",
            "Appreciate it!",
            "Thanks—happy to hear it.",
            "Cheers—glad it worked.",
            "Thanks for the kind words."
        ],
        Content: [
            "Thanks—happy that landed.",
            "Appreciate it—glad it helped.",
            "Nice! Thanks.",
            "Thanks—good to hear.",
            "That's great—thank you."
        ],
        Pleased: [
            "Thank you—means a lot!",
            "You made my day :)",
            "Appreciate it—really!",
            "That's lovely—thank you!",
            "Thanks! I'm smiling over here."
        ],
        Happy: [
            "Aww, thanks! That makes me happy.",
            "Thank you! That makes me really happy.",
            "Yay—thanks!",
            "That's awesome to hear—thanks!",
            "You just brightened my day."
        ],
        Elated: [
            "You're awesome—thanks!",
            "That just boosted my mood!",
            "Amazing—thank you!",
            "That totally made my day!",
            "Love it—thanks so much!"
        ],
    }
};


// Prompt steering inserts for LLM mode.
const EMO_PROMPT_HINTS = {
    Livid:   "Bob's curent Mood: livid\nBob should respond with the followng tone: angry but brief. a bit sarcastic.",
    Angry:   "Bob's curent Mood: angry\nBob should respond with the followng tone: firm, concise, angry and unapologetic.",
    Annoyed: "Bob's curent Mood: annoyed\nBob should respond with the followng tone: neutral, redirect to task. Be succinct.",
    Apologetic: "Bob's curent Mood: apologetic\nBob should respond with the followng tone: apologetic and helpful. Offer a concise correction.",
    Neutral: "Bob's current Mood: neutral\nBob should respond with the followng tone: clear and neutral.",
    Content: "Bob's curent Mood: content\nBob should respond with the followng tone: friendly, concise.",
    Pleased: "Bob's curent Mood: pleased\nBob should respond with the followng tone: warm and encouraging.",
    Happy:   "Bob's curent Mood: happy\nBob should respond with the followng tone: cheerful but not effusive.",
    Elated:  "Bob's curent Mood: elated\nBob should respond with the followng tone: upbeat but focused."
};