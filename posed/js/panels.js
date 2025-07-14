const panels = document.getElementById('panels');
const environpanel = document.getElementById('environpanel');
const campanel = document.getElementById('campanel');
const posepanel = document.getElementById('posepanel');
const anipanel = document.getElementById('anipanel');
const cappanel = document.getElementById('cappanel');
const cappose = document.getElementById('cappose');
const capani = document.getElementById('capani');

const panelState = [
    {name: 'environ', index: 0, ele: environpanel, state: false, ostate: [1, 0, 0, 0, 0, 0, 0]},
    {name: 'camera', index: 1, ele: campanel, state: false, ostate: [0, 1, 1, 1, 1, 1, 1]},
    {name: 'pose', index: 2, ele: posepanel, state: false, ostate: [0, 1, 1, 0, 0, 0, 0]},
    {name: 'ani', index: 3, ele: anipanel, state: false, ostate: [0, 1, 0, 1, 0, 0, 0]},
    {name: 'capture', index: 4, ele: cappanel, state: false, ostate: [0, 1, 0, 0, 1, 1, 1]},
    {name: 'cappose', index: 5, ele: cappose, state: false, ostate: [0, 1, 0, 0, -1, 1, 0]},
    {name: 'capani', index: 6, ele: capani, state: false, ostate: [0, 1, 0, 0, -1, 0, 1]},
];

function panelListeners() {
    const prect = panels.parentElement.getBoundingClientRect();
    const bound = {
        left: Math.round(prect.x),
        right: window.innerWidth,
        top: Math.round(prect.y),
        bottom: window.innerHeight,
    }
    dragElement(panels, bound, document.getElementById('ptitlebar'));

}

function togglePanel(pname) {
    const index = panelState.findIndex(obj => obj['name'] === pname);
    if(index < 0) {
        console.warn(`Invalid panel: ${pname}`);
        return;
    }

    if(panelState[index].state) {
        panelState[index].state = false;
        panelState[index].ele.style.display = 'none';
        for(i=0; i<panelState[index].ostate.length; i++) {
            if(panelState[index].ostate[i] == -1) {
                panelState[i].state = false;
                panelState[i].ele.style.display = 'none';
            }
        }
    } else {
        panelState[index].state = true;
        panelState[index].ele.style.display = 'block';
        for(i=0; i<panelState[index].ostate.length; i++) {
            if(panelState[index].ostate[i] == 0) {
                panelState[i].state = false;
                panelState[i].ele.style.display = 'none';
            }
            if(panelState[index].ostate[i] == -1) {
                panelState[i].state = true;
                panelState[i].ele.style.display = 'block';
            }
        }
    }

    if(anyVisible()) {panels.style.display = 'block';}
    else {panels.style.display = 'none';}
}

function anyVisible() {
    result = false;
    for(let i=0; i<panelState.length; i++) {
        if(panelState[i].state) result = true;
    }
    return result;
}