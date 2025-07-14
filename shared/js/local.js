
let localFileCtrl = null;

//===================================  OPEN A LOCAL FILE

function openLocalText(accept, callback) {openLocalFile(accept, callback, 'text');}
function openLocalImage(accept, callback) {openLocalFile(accept, callback, 'image');}

function openLocalFile(accept, callback, type) {
	if(!localFileCtrl) {doCreateLocalCtrl();}
	localFileCtrl.accept = accept;
	localFileCtrl.callback = callback;
	localFileCtrl.onchange = function(fe) {openLocalReady(fe, type)};
    localFileCtrl.click();
}

function openLocalReady(e, type) {
	if(type !== 'text' && type !== 'image') {
		console.log("Invalid file request type."); 
		return;
	}
	let localFile = e.target.files[0];
	if(!localFile) {
		console.log("Could not obtain file name."); 
		return;
	}
	
	if(type === 'text') {
		//console.log('type', localFile.type);
		if (localFile.type != 'text/plain' && localFile.type != 'text/csv' && localFile.type !='') {
			if(sysWindow) {sysWindow.alert('File Error', 'File is not text.');}
			else {alert('File is not text.');}
			return;
		}
	}
	
	if(type === 'image') {
		if (localFile.type && localFile.type.indexOf('image') === -1) {
			if(sysWindow) {sysWindow.alert('File Error', 'File is not an image.');}
			else {alert('File is not an image.'); }
			return;
		}
	}	
	
	let reader = new FileReader();
	if(!reader) {
		textFile=null; 
		if(sysWindow) {sysWindow.alert('Could not access FileReader');}
		else {alert('Could not access FileReader');}
	}
	reader.addEventListener('load', function(fe) {readerLocalFileReady(fe, e.target.files[0].name)});
	if(type === 'text') reader.readAsText(localFile);
	if(type === 'image') reader.readAsDataURL(localFile);
}

function readerLocalFileReady(e, name)   // Done reader is ready to load
{
	if(e.target.result.length < 1) {
		console.log("file is empty"); 
		localFileCtrl.value = '';
		return;
	} 
    localFileCtrl.callback({name: name, data: e.target.result});
	localFileCtrl.value = '';
}

//=========================== CREATE THE DOM ELEMENT

function createLocalCtrl() {
	if(!document.body) return;
	localFileCtrl = document.createElement('input');
	localFileCtrl.type = 'file';
	localFileCtrl.id = 'localfile';
	localFileCtrl.accept = '.txt';
	localFileCtrl.style.visibility = 'hidden';
	localFileCtrl.callback = null;
	document.body.appendChild(localFileCtrl);
}

function doCreateLocalCtrl() {
	if(document.readyState !== 'complete') {setTimeout(doCreateLocalCtrl, 100); return;}
	createLocalCtrl();
}
doCreateLocalCtrl();

//=========================== SAVE LOCAL

function saveLocalTextFile(content, name='') {
    if(!content) {console.log('No content to save'); return;}
	if(content.length < 0) {console.log('No content to save'); return;}
	//console.log(content.length);
	let econtent = 'data:text/plain;charset=utf-8,';
	econtent += content;
	//econtent += encodeURIComponent(content);
	saveLocalFile(econtent, name);
}

function saveLocalFile(content, name='') {
    if(!content) {console.log('No content to save'); return;}
	if(content.length < 0) {console.log('No content to save'); return;}
	
	let localFileSaveCtrl = document.createElement('a');
	localFileSaveCtrl.style.display = 'none';
    document.body.appendChild(localFileSaveCtrl);
	
	localFileSaveCtrl.setAttribute('href', content);
	localFileSaveCtrl.setAttribute("download", name);
    localFileSaveCtrl.click();
    document.body.removeChild(localFileSaveCtrl);
}