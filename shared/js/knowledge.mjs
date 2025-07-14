import { csvHandler } from './csv.mjs'

class faqHandler {
    constructor() {
        this.name = 'faq';
        this.q = [];
        this.a = [];
        this.type = [];
        this.qe = [];
        this.header = [];
    }

    reset() {
        this.name = 'faq';
        this.q = [];
        this.a = [];
        this.type = [];
        this.qe = [];
        this.header = [];
    }

    async loadfromCSV(url, header = true, name = 'faq') {
        if(!url) return {error: 'No URL provided'};
        if(!url.length) return {error: 'No URL provided'};
        
        const result = await csvHandler.fromURL(url);
        const fields = result[0].length;
        if(fields < 2) {return {error: 'Expected more than 2 columns'};}
        this.reset();
        this.name = name;

        if(header) {this.header = result.shift();}
        for(let i=0; i<result.length; i++) {
            if(!result[i][0].length) continue;
            this.q.push(result[i][0]);
            this.a.push(result[i][1]);
            if(fields > 2) this.type.push(result[i][2]);
        }
        return {success: 'FAQ loaded'};
    }

    loadFromTextBlob(data, header, name) {
        if(!data) return {error: 'no FAQ data provided'};
        if(!data.length) return {error: 'no FAQ data provided'};
        
        const result = csvHandler.toArray(data, ',');
        const fields = result[0].length;
        if(fields < 2) {return {error: 'Expected more than 2 columns'};}
        this.reset();
        this.name = name;

        if(header) {this.header = result.shift();}
        for(let i=0; i<result.length; i++) {
            if(!result[i][0].length) continue;
            this.q.push(result[i][0]);
            this.a.push(result[i][1]);
            if(fields > 2) this.type.push(result[i][2]);
        }
        return {success: 'FAQ loaded'};
    }

    setEmbeddings(e) {
        if(!e) {return {error: 'No embeddings provided'}};
        if(!e.length) {return {error: 'No embeddings provided'}};
        if(e.length != this.q.length) {return {error: `Eembeddings length mismatch (${this.q.length}, ${e.length})`};}
        this.qe = [...e];
        return {success: 'Embeddings set'};
    }

}

class generalInfo {
    constructor() {
        this.name;
        this.info = [];
        this.infoe = [];
        this.topice = []; // average embedding to represent the topic
    }

    async loadFromTxt(url, name) {
        if(!url) return {error: 'No URL provided'};
        if(!url.length) return {error: 'No URL provided'};

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            let textContent = await response.text();
            textContent = textContent.replace(/(?:\r\n|\r|\n)/g, '\n');

            // parse into paragraphs
            let ta = textContent.split("\n");
            let slen = ta.length;
            for(let i=0; i<slen; i++) {
                if(ta[i].length>0) {
                    ta[i] = ta[i].replace(/\s\s+/g, ' ');
                    this.info.push(ta[i]);
                }
            }
            this.name = name;

            return {success: 'file loaded'};
        } catch (error) {
            console.error("Error loading text file:", error);
            return {error: 'failed to load file'};
        }
    }

    addFromText(text, name) {
        let textContent = text.replace(/(?:\r\n|\r|\n)/g, '\n');

        // parse into paragraphs
        let ta = textContent.split("\n");
        let slen = ta.length;
        for(let i=0; i<slen; i++) {
            if(ta[i].length>0) {
                ta[i] = ta[i].replace(/\s\s+/g, ' ');
                this.info.push(ta[i]);
            }
        }
        this.name = name;
        return {success: `${name} added`};
    }

    setEmbeddings(e) {
        if(!e) {return {error: 'No embeddings provided'}};
        if(!e.length) {return {error: 'No embeddings provided'}};
        if(e.length != this.info.length) {return {error: `Eembeddings length mismatch  (${this.info.length}, ${e.length})`}};
        this.infoe = [...e];
        if(!meanPoolArrays) {console.warn('Missing general.js')}
        this.topice = meanPoolArrays(e);
        return {success: 'Embeddings set'};
    }
}

export class knowledgeHandler {
    constructor(sharedk = null) {
        this.faq = new faqHandler();
        this.faqThreshold = 0.90;
        this.genInfo = [];
        this.infoThreshold = 0.80;
        this.shared = sharedk;
    }

    hasKnowledge() {return (this.hasFAQ() || this.getInfoCount()>0);}

    async faqFromCSV(url, header = true, name = 'faq') {
        if(!url) return {error: 'No URL provided'};
        if(!url.length) return {error: 'No URL provided'};

        return await this.faq.loadfromCSV(url, header, name);
    }

    faqFromTextBlob(data, header=true, name='faq') {
        return this.faq.loadFromTextBlob(data, header, name);
    }

    faqEmbeddings(e) {return this.faq.setEmbeddings(e);}
    faQuestions() {return this.faq.q;}
    hasFAQ() {if(this.faq.q.length) return true; else return false;}
    
    async addInfo(url, name = '') {
        if(!url) return {error: 'No URL provided'};
        if(!url.length) return {error: 'No URL provided'};
        if(!name.length) name = `topic_${this.genInfo.length}`;

        const gi = new generalInfo();
        const result = await gi.loadFromTxt(url, name);
        if(result.error) return result;
        this.genInfo[this.genInfo.length] = gi;
        return {success: `${name} loaded`};
    }

    addInfoText(data, name = '') {
        if(!data) {return {error: 'No Info data provided'};}
        if(!data.length) {return {error: 'No Info data provided'};}
        const inames = this.getInfoNames();
        if(inames.includes(name)) {return {error: 'Info by that name exists'};}
        if(!name.length) name = `topic_${this.genInfo.length}`;
        const gi = new generalInfo();
        const result = gi.addFromText(data, name);
        if(result.error) return result;
        this.genInfo[this.genInfo.length] = gi;
        return {success: `${name} loaded`};
    }

    setInfoEmbeddings(e, name = '') {
        const gilen = this.genInfo.length;
        if(!gilen) return {error: 'No info to connect the embeddings to'};
        let index = -1;
        for(let i=0; i<gilen; i++) {if(this.genInfo[i].name == name) {index = i; break;}}
        if(index < 0) return {error: `Could not find info named: ${name}`};
        return this.genInfo[index].setEmbeddings(e);
    }

    getInfo(name = '') {
        const gilen = this.genInfo.length;
        if(!gilen) return [];
        let index = -1;
        for(let i=0; i<gilen; i++) {if(this.genInfo[i].name == name) {index = i; break;}}
        if(index < 0) return [];
        return this.genInfo[index].info;
    }

    getInfoByIndex(index) {
        if(index < 0 || index >= this.genInfo.length) {return {error: 'Index out of range'};}
        return this.genInfo[index].info;
    }

    getInfoCount() {
        const gilen = this.genInfo.length;
        if(!gilen) return 0;
        let counter = 0;
        for(let i=0; i<gilen; i++) {
            if(this.genInfo[i].info.length) counter++;
        }
        return counter;
    }

    getInfoNames() {
        const gilen = this.genInfo.length;
        if(!gilen) return [];
        let names = []
        for(let i=0; i<gilen; i++) {
            names.push(this.genInfo[i].name);
        }
        return names;
    }

    wipeInfo() {this.genInfo = null; this.genInfo = [];}

    removeInfo(iname) {
        const gilen = this.genInfo.length;
        if(!gilen) return;
        for(let i=0; i<gilen; i++) {
            if(iname == this.genInfo[i].name) {
                this.genInfo.splice(i, 1);
                return;
            }
        }
    }

    fewShot(e, topk=0) {
        if(!e) return {error: 'No embedding prompt provided'};
        if(!e.length) return {error: 'No embedding prompt provided'};
        if(!isArrayOfNumbers(e)) return {error: 'Embedded prompt should be an array of numbers'};

        let answers = [];
        if(this.faq.qe.length) {
            const cossim = simArray([e], this.faq.qe, topk);            
            for(let i=0; i<cossim.length; i++) {
                answers.push({text: this.faq.a[cossim[i].index], question: this.faq.q[cossim[i].index]});
            }
            return answers;
        }
        return answers;
    }
    
    ePrompt(e, topk = 0, idk = `I'm not sure about that.`) {
        if(!e) return {error: 'No embedding prompt provided'};
        if(!e.length) return {error: 'No embedding prompt provided'};
        if(!isArrayOfNumbers(e)) return {error: 'Embedded prompt should be an array of numbers'};

        let i;
        let answers = [];
        if(this.faq.qe.length) {
            const cossim = simArray([e], this.faq.qe, topk);
            if(cossim[0].value >= this.faqThreshold) {
                for(i=0; i<cossim.length; i++) {
                    if(cossim[i].value < this.faqThreshold) break;
                    answers.push({text: this.faq.a[cossim[i].index], question: this.faq.q[cossim[i].index], match: cossim[i].value.toFixed(3) * 100, h: cossim[i].h.toFixed(3) * 100, source: 'faq'});
                }
                return answers;
            }
        }

        if(this.genInfo.length) {
            const icossim = this.infoMatch(e, topk);
            if(icossim[0].value >= this.infoThreshold) {
                for(i=0; i<icossim.length; i++) {
                    if(icossim[i].value < this.infoThreshold) break;
                    answers.push({text: this.genInfo[icossim[i].topicIndex].info[icossim[i].index], question: '', match: icossim[i].value.toFixed(3) * 100, h: icossim[i].h.toFixed(3) * 100, source: 'geninfo'});
                }
            }
        }

        if(this.shared) {
            if(this.shared.hasKnowledge()) {
                const sa = this.shared.ePrompt(e, topk, idk);
                if(!answers.length) {
                    answers = [...sa];
                } else {
                    if(sa[0].match > answers[0]) {
                        answers.concat(sa);
                        answers.sort(function(a, b) {
                            return ((a.value < b.value) ? 1 : ((a.value == b.value) ? 0 : -1));
                        });
                        let count = Math.min(topk, answers.length);
	                    answers.slice(0, count);
                    }
                }
            }
        }

        if(answers.length) {
            answers.sort(function(a, b) {
                return ((a.h < b.h) ? 1 : ((a.h == b.h) ? 0 : -1));
            });
        } else {
            answers.push({text: idk, question: '', match: 0});
        }
        return answers;
    }

    infoMatch(e, topk = 0, method = 'topic') {
        const gilen = this.genInfo.length;
        let i;
        if(method == 'topic') {
            const topic = [];
            for(i=0; i<gilen; i++) {topic[i] = [...this.genInfo[i].topice];} // put topic embeddings into single array
            const simt = simArray([e], topic);
            //console.log(simt);
            const simi = simArray([e], this.genInfo[simt[0].index].infoe, topk);
            for(i=0; i<simi.length; i++) {
                simi[i].topicIndex = simt[0].index;
                simi[i].topicMatch = simt[0].value;
            }
            return simi;
        } else {
            const simi = [];
            for(i=0; i<gilen; i++) {
                const simt = simArray([e], this.genInfo[i].infoe, topk);
                simt.topicIndex = i;
                simi.concat(simt);
            }
            simi.sort(function(a, b) {return ((a.value < b.value) ? 1 : ((a.value == b.value) ? 0 : -1));});
            if(topk < 1) return simi;
            let count = Math.min(topk, simi.length);
	        return simi.slice(0, count);
        }

    }
}

function isArrayOfNumbers(arr) {return Array.isArray(arr) && arr.every(element => typeof element === 'number');}

const dot = (a,b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);

function cosSimilarity(a, b) {
	var magA = Math.sqrt(dot(a, a)); // Computes magnitude of vector a
	var magB = Math.sqrt(dot(b, b)); // Computes magnitude of vector b
	if (magA && magB) return dot(a, b) / (magA * magB); // Computes cosine similarity
	  else return -1;
}

function simArray(a, b, topk=0) { // where 'a' is an array of 1 and b is the full array to compare to
	let blen = b.length;
	let simresults = [];
	if(blen < 1) {return simresults;}
	let i;
	for(i=0; i<blen; i++) {
        const v = cosSimilarity(a[0], b[i]);
        const h = hybridDistanceScore(v, euclideanDistance(a[0], b[i]), 0);
		simresults.push({index: i, value: v, h: h});
	}
	simresults.sort(function(a, b) {
		return ((a.value < b.value) ? 1 : ((a.value == b.value) ? 0 : -1));
	});
  
	if(topk < 1) return simresults;
	let count = Math.min(topk, simresults.length);
	return simresults.slice(0, count);
}

function euclideanDistance(vec1, vec2) {
    let sum = 0;
    for (let i = 0; i < vec1.length; i++) {
        const diff = vec1[i] - vec2[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

function hybridDistanceScore(cosine, distance, weight = 0.8) {
    return weight * cosine + (1 - weight) * (1 / (1 + distance));
}
