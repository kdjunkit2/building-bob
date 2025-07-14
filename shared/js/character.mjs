import { knowledgeHandler } from './knowledge.mjs'
import { sysDevicesInitialize } from './device.mjs';

export const localSystem = await sysDevicesInitialize();

const Collector = {};
let collectorCounter = 0;

export class characterManager {
    constructor(name = '') {
        this.characters = [];
        this.useLLM = false;
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

    add(name, sysrole = "You are an AI assistant. Keep answers brief and conversational.") {
        if(!name) return {error: 'no name provided'};
        if(!name.length) return {error: 'no name provided'};

        // -----------------------   CHECK NAME UNIQUENESS

        this.characters[this.characters.length] = new characterClass(this, name, sysrole);
    }

    getCharacterByName(name) {
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
            llmWorker.callback = (e) => {this.modelLoaded(e, params.llmCallback);};
            llmWorker.postMessage({action: 'load', model: modelInfo[modelIndex].modelid, gpu: localSystem.gpu.available});
        } else {
            this.useLLM = false;
            this.ready.llm = true;
        }
    }

    loadEmbeddingModel = (params) => {
        if(!llmWorker) return {error: 'no llmWorder available'};
        if(!params) {return {error: 'missing parameters'}}
        if(!this.ready.embedding) {
            llmWorker.ecallback = (e) => {this.emodelLoaded(e, params.embedCallback);};
            llmWorker.postMessage({action: 'eload', gpu: localSystem.gpu.available});
        }
    }

    loadLLM = (params) => {
        if(!llmWorker) return {error: 'no llmWorder available'};
        if(!params) {return {error: 'missing parameters'}}

        if(params.usellm && params.llmModelId.length) {
            this.useLLM = true;
            this.ready.llm = false;
            llmWorker.callback = (e) => {this.modelLoaded(e, params.llmCallback);};
            llmWorker.postMessage({action: 'load', model: modelInfo[modelIndex].modelid, gpu: localSystem.gpu.available});
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
    constructor(parent, name = '', sysrole = "You are an AI assistant. Keep answers brief and conversational.") {
        this.parent = parent;
        this.name = name;
        this.knowledgeBase = new knowledgeHandler(this.parent.knowledgeBase);
        this.ready = {
            knowledge: true,
            knowledgeEmbedded: true,
            knowledgeCount: 0,
        }
        this.ekStatus = {};
        this.ekCount = 0;
        this.role = sysrole;
        this.dontKnow = 'That question is a little outside what I know.';
        this.answerlength = 'Answer in a one sentence.';
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
        this.knowledgeBase.dontKnow = text;
    }

    prompt(text, callback, usellm) {
        llmWorker.ecallback = (e) => {this.ePrompt(e, callback, usellm, text);};
        llmWorker.postMessage({action: 'embed', sentences: [text], q: 5, tag: 'prompt'});
    }

    ePrompt(result, callback, usellm, textprompt) {
        if(result.state == 'embedding') return;
        let topk = 5;
        if(usellm) { // expanded for LLM to get more context;
            topk = 10;
            this.knowledgeBase.infoThreshold = 0.75;
        }
        const answer = this.knowledgeBase.ePrompt(result.data[0], topk, this.dontKnow);
        if(usellm) {
            if(answer[0].question.length && answer[0].source == 'faq') {   // This means the primary answer is from an FAQ which takes precedent
                if(callback) callback(answer);
                return;
            }
            
            let context = '';
            for(let i=0; i<answer.length; i++) {
                context += `${answer[i].text}\n`;
            }

            const fsFAQ = this.knowledgeBase.fewShot(result.data[0], 10);
            const messages = buildPrompt({textprompt: textprompt, context: context, sysrole: this.role,  answerlength: this.answerlength, faq: fsFAQ});
            Collector[`input_${collectorCounter}`] = {prompt: textprompt, rag: answer, messages: messages};

            llmWorker.callback = (e) => {this.llmResponse(e, callback);};
            llmWorker.postMessage({action: 'generate', messages: messages});

        } else {
            if(callback) callback(answer);
        }
    }

    llmResponse(response, callback) {
        const answer = [{text: response.result, question: 'llm response', match: 0, v: 0, d: 0}];
        Collector[`output_${collectorCounter}`] = {response: response.result};
        collectorCounter++;
        if(callback) callback(answer);
    }
}

function buildPrompt({textprompt, context, sysrole, answerlength, faq}) {
    const system = context.length
        ? `${sysrole}\n\nHere is what you know:\n\nContext: ${context}`
        : `${sysrole}`;

    const userPrompt = `Question: ${textprompt}\n\n${answerlength}.\n\nAnswer:`;

    let prompt = [];
    prompt.push({ role: 'system', content: system });
    for(let i=0; i<faq.length; i++) {
        prompt.push({role: 'user', content: faq[i].question});
        prompt.push({role: 'assistant', content: faq[i].text});
    }
    prompt.push({ role: 'user', content: userPrompt });
    console.log('fullprompt: ', prompt);
    return prompt
}


export function collectorToConsole() {
    console.log(JSON.stringify(Collector));
}
