
var synthObj = window.speechSynthesis;

class readitObject {
	constructor() {
		this.availss=false;
		this.availsr=false;
		this.msg=null;
		this.state=0;
		
		this.init();
	}

	init() {
		if('speechSynthesis' in window) this.availss=true; else this.availss=false;
		if('SpeechRecognition' in window) this.availsr=true; else this.availsr=false;
		
		if(!this.availss) return;
		this.msg = new SpeechSynthesisUtterance();
		synthObj.onvoiceschanged = voicesLoaded;
	}
	
	consoleVoices()
	{
		if(!this.availss) {console.log('Speech Synthesis not available'); return;}
		var voices = synthObj.getVoices();
		var defv="";
		console.log(voices.length+" voices available");
		var i; for(i=0; i<voices.length; i++) {if(voices[i].default) defv=" (default)"; else defv=""; console.log(i+"-"+voices[i].name + defv);}
	}
	
	getVoiceList()
	{
		if(!this.availss) return null;
		var voices = synthObj.getVoices();
		return voices;
	}

	setOnStart(func) {
		if(!this.msg) return;
		this.msg.onstart = func;
	}
	
	setOnEnd(func)
	{
		if(!this.msg) return;
		this.msg.onend = func;
	}
	
	setErrorHandler(func)
	{
		if(!this.msg) return;
		this.msg.onerror = func;
		//this.msg.onerror = function(event) {console.log('An error has occurred with the speech synthesis: ' + event.error);}
	}
	
	pause()
	{
		if(!this.msg) return;
		this.state = 2;
		synthObj.pause();
	}
	
	resume()
	{
		if(!this.msg) return;
		if(this.state != 2) return;
		this.state = 1;
		synthObj.resume();
	}
	
	stop()
	{
		if(!this.msg) return;
		synthObj.cancel();
		this.state = 0;
		this.msg.text = '';
	}
	
	speak(phrase, callback = null)
	{
		if(!this.availss) return;
		synthObj.cancel();
		if(!phrase) return; if(phrase.length<1) return;
		this.state = 1;
		this.msg.text = phrase;
		synthObj.speak(this.msg);
		if(callback) this.setOnStart(callback);
	}
	
	setVoicei(idx)
	{
		var voices = synthObj.getVoices();
		if(voices.length<1) return;
		if(idx<0) idx=0;
		if(idx>=voices.length) idx=voices.length-1;
		if(!this.msg) return;
		this.msg.voice = voices[idx];
	}
	
	setVoice(name, rate, pitch)
	{
		var voices = synthObj.getVoices();
		if(idx<0||idx>=voices.length) return;
		if(!this.msg) return;
		var i, idx=-1;
		for(i=0; i<voices.length; i++) {if(voices[i].name==name) {idx=i; break;}}
		if(idx<0) return;
		this.msg.voice = voices[idx];
		if(rate<0.1) rate=0.1; if(rate>10) rate=10;
		if(pitch<0) pitch=0; if(pitch>2) pitch=2;
		this.msg.rate=rate;
		this.msg.pitch=pitch;
		
	}
   
}

class dictateObject {
	constructor() {
		this.availspk=false;
		this.recog=null;
		this.dictatecallback=null;
		this.interim=false;
		
		this.init();
	}

	init()
	{
		if(('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window)) this.availspk=true; else this.availspk=false;
		if(!this.availspk) return;
		this.recog = new webkitSpeechRecognition();
		this.recog.continuous = true;
		this.recog.interimResults = this.interim;
		this.recog.onresult=dictateResults;
		this.recog.onerror=speakError;
	}
	
	setInterim(i) {this.interim=i; if(this.recog) this.recog.interimResults = this.interim;}
	
	speak()
	{
		if(!this.recog) this.init();
		if(!this.recog) return;
		this.recog.continuous = true;
		this.recog.interimResults = this.interim;
		this.recog.onresult=dictateResults;
		this.recog.onerror=speakError;
		console.log("2: "+this.recog);
		this.recog.start();
	}
	
	speakStream(startcallback, endcallback)
	{
		if(!this.recog) return;
		this.recog.continuous = true;
		this.recog.interimResults = true;
		if(startcallback) this.recog.onstart=startcallback;
		if(endcallback) this.recog.onend = endcallback;
		this.recog.onresult=dictateResults;
		this.recog.onerror=speakError;
		this.recog.start();
	}
	
	interpret(result, interim)
	{
		if(!this.recog) return;
		if(this.recog.interimResults==false && interim) return;
		result=result.trim();
		if(this.dictatecallback) this.dictatecallback(result, interim);
	}
	
	stop() {this.recog=null;}
   
}

export const readIt = new readitObject();
export const dictate = new dictateObject();

// -------------------------------------- HELPER FUNCTIONS FOR EVENTS

function voicesLoaded() {window.speechSynthesis.onvoiceschanged = null;}

function dictateResults(event)
{
	if(!dictate) return;
	
	var i, txt="";
	var interim = false;
	for(i=event.resultIndex; i<event.results.length; ++i) 
	{
		if (event.results[i].isFinal) {txt += event.results[i][0].transcript;}
		else {txt += event.results[i][0].transcript; interim=true;}
	}
	
	if(txt.length<1) return;
	dictate.interpret(txt, interim);
}

function speakError()
{
	if(!dictate) return;
	console.log('speech error');
}



