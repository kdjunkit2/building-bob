
function sysWindowB1Handler() {sysWindow.action('b1');}
function sysWindowB2Handler() {sysWindow.action('b2');}

class sysWindowClass {
	constructor() {
		this.win = null;
		this.titleBar = null;
		this.buttonArea = null;
		this.b1 = null;
		this.b2 = null;
		this.modal = false;
		this.self = this;
		this.callback = null;
	}
	
	create() {
		if(this.win) {document.removeChild(this.win); this.win = null;}
		
		this.win = document.createElement('div');
		this.win.id = 'sysWindow';
		this.win.style.display = 'none';
		this.win.style.position = 'absolute';
		this.win.style.left = '100px';
		this.win.style.top = '150px';
		this.win.style.width = '400px';
		document.body.appendChild(this.win);
		
		this.titleBar = document.createElement('div');
		this.titleBar.id = 'sysWindowTitle';
		this.titleBar.className = 'wintitled';
		this.win.appendChild(this.titleBar);
		
		this.clientArea = document.createElement('div');
		this.clientArea.id = 'sysWindowClientArea';
		this.clientArea.className = 'winclient';
		this.win.appendChild(this.clientArea);
		
		this.buttonArea = document.createElement('div');
		this.buttonArea.id = 'sysWindowButtonArea';
		this.buttonArea.className = 'winbuttonbar';
		this.win.appendChild(this.buttonArea);
		
		this.b1 = document.createElement('div');
		this.b1.id = 'sysWindowButton1';
		this.b1.className = 'textbtn';
		this.b1.onclick = sysWindowB1Handler;
		this.buttonArea.appendChild(this.b1);
		
		this.b2 = document.createElement('div');
		this.b2.id = 'sysWindowButton2';
		this.b2.className = 'textbtn';
		this.b2.onclick = sysWindowB2Handler;
		this.buttonArea.appendChild(this.b2);
		
	}
	
	alert(title, msg, callback=null, btn1='ok') {
		if(!this.win) return;
		this.callback = callback;
		this.modal = true;
		document.getElementById('mbomsg').style.visibility = 'hidden';
		document.getElementById('mbo').style.visibility = 'visible';
		
		this.titleBar.innerHTML = title;
		this.clientArea.innerHTML = msg;
		
		this.b1.innerHTML = btn1;
		this.b1.style.display = 'inline-block';
		this.b2.style.display = 'none';
		
		this.win.style.zIndex = '1100';
		this.win.style.display = 'block';
		
		let bound = {left: 0, top: 0, right: document.body.clientWidth, bottom: document.body.clientHeight};
		dragElement(this.win, bound, this.titleBar);		
	}
	
	confirm(title, msg, callback=null, btn1='yes', btn2='no') {
		if(!this.win) return;
		this.callback = callback;
		this.modal = true;
		document.getElementById('mbomsg').style.visibility = 'hidden';
		document.getElementById('mbo').style.visibility = 'visible';
		
		this.titleBar.innerHTML = title;
		this.clientArea.innerHTML = msg;
		
		this.b1.innerHTML = btn1;
		this.b1.style.display = 'inline-block';
		this.b2.innerHTML = btn2;
		this.b2.style.display = 'inline-block';
				
		this.win.style.zIndex = '1100';
		this.win.style.display = 'block';
		
		let bound = {left: 0, top: 0, right: document.body.clientWidth, bottom: document.body.clientHeight};
		dragElement(this.win, bound, this.titleBar);		
	}
	
	action(result) {
		if(!this.win) return;
		if(this.modal) {
			document.getElementById('mbo').style.visibility = 'hidden';
			document.getElementById('mbomsg').style.visibility = 'visible';
		}
		
		this.win.style.display = 'none';
		if(!this.callback) return;
		
		if(result === 'b1') {
			this.callback(1);
			return;
		}
		
		if(result === 'b2') {
			this.callback(2);
			return;
		}
	}
	
}

function createSysWindow() {
	if(document.readyState !== 'complete') {setTimeout(createSysWindow, 100); return;}
	sysWindow.create();
}

const sysWindow = new sysWindowClass();
createSysWindow();

//=================================  DRAG OR SIZE A WINDOW (DIV)

function dragElement(elmnt, bound, hotspot=null, callback = null) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  var minX = bound.left;
  var maxX = bound.right;
  var minY = bound.top;
  var maxY = bound.bottom;
  if(hotspot) {
    hotspot.onmousedown = dragMouseDown;
  } else {
    elmnt.onmousedown = dragMouseDown;
  }
  var callback = callback;

  function dragMouseDown(e) {  
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:

	if(elmnt.offsetLeft - pos1 < minX || elmnt.offsetLeft + elmnt.offsetWidth - pos1 > maxX) pos1 = 0;
    if(elmnt.offsetTop - pos2 < minY || elmnt.offsetTop + elmnt.offsetHeight - pos2 > maxY) pos2 = 0;

	elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
	if(callback) callback((elmnt.offsetLeft - pos1), (elmnt.offsetTop - pos2));
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

//--------------------------------- SIZE ELEMENT

function sizeElement(e, elmnt, parent, bound, minwidth=25, minheight=25, callback=null) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  var maxX = bound.right;
  var maxY = bound.bottom;
  var minWidth = minwidth;
  var minHeight = minheight;
  var parent = parent;
  var callback = callback;

  sizeMouseDown(e);

  function sizeMouseDown(e) {
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeSizeElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementSize;
  }

  function elementSize(e) {
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

	if(parent.offsetLeft + parent.offsetWidth - pos1 > maxX || parent.offsetWidth - pos1 < minWidth) pos1 = 0;
    if(parent.offsetTop + parent.offsetHeight - pos2 > maxY || parent.offsetHeight - pos2 < minHeight) pos2 = 0;
    
    if(pos1 != 0) {
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        parent.style.width = (parent.clientWidth - pos1) + "px";
    }

	if(pos2 != 0) {
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        parent.style.height = (parent.clientHeight - pos2) + "px";
    }

	if((pos1 != 0 || pos2 != 0) && callback) callback((parent.clientWidth - pos1), (parent.clientHeight - pos2));

  }

  function closeSizeElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}