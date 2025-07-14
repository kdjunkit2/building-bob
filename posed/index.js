
import { environVRM } from '../shared/js/environvrm.mjs';

const vrmAppState = {
    bones: [],
};

const handPoses = ['default', 'natural', 'fist'];

const loadbtn = document.getElementById('loadvrm');
const loadaniposes = document.getElementById('loadaniposes');
const saveaniposes = document.getElementById('saveaniposes');

const environ = document.getElementById('evironment');
const environset = document.getElementById('environset');
const qse1 = document.getElementById('environ512');
const qse2 = document.getElementById('environ1280');
const qse3 = document.getElementById('environ720');
const qse4 = document.getElementById('environAvail');

const camview = document.getElementById('camview');
const camfront = document.getElementById('viewfront');
const camback = document.getElementById('viewback');
const camleft = document.getElementById('viewleft');
const camright = document.getElementById('viewright');
const camtop = document.getElementById('viewtop');
const cambottom = document.getElementById('viewbottom');
const camhead = document.getElementById('viewhead');

const mdlopts = document.getElementById('mdlopts');

const posebtn = document.getElementById('posing');
const addposeshow = document.getElementById('addposeshow');
const resetmdl = document.getElementById('resetmdl');
const handpos = document.getElementById('handpos');
const selbones = document.getElementById('selbones');
const mirror = document.getElementById('mirror');
const rotxl = document.getElementById('rotxlbl');
const rotyl = document.getElementById('rotylbl');
const rotzl = document.getElementById('rotzlbl');
const rotx = document.getElementById('rotx');
const roty = document.getElementById('roty');
const rotz = document.getElementById('rotz');
const rotxs = document.getElementById('rotxslider');
const rotys = document.getElementById('rotyslider');
const rotzs = document.getElementById('rotzslider');
const grounded = document.getElementById('grounded');
const pnametxt = document.getElementById('posename');
const addpose = document.getElementById('addpose');
const xaddpose = document.getElementById('canceladdpose');
const poselist = document.getElementById('poselist');

const anibtn = document.getElementById('animation');
const anilist = document.getElementById('anilist');
const editani = document.getElementById('editani');
const addani = document.getElementById('addani');
const startani = document.getElementById('startanimation');
const stopani = document.getElementById('stopanimation');
const aniframes = document.getElementById('aniframes');
const addframe = document.getElementById('addaniframe');
const frameloop = document.getElementById('frameloop');
const updateani = document.getElementById('updateani');
const cancelani = document.getElementById('cancelani');

const gridtgl = document.getElementById('grid');
const axestgl = document.getElementById('axes');

const capbtn = document.getElementById('capture');
const capposelist = document.getElementById('capposelist');
const anicapbtn = document.getElementById('anicapture');
const capanilist = document.getElementById('capanilist');

const capture = document.getElementById('docapture');

export function appInit() {
    document.getElementById('pagetitle').innerHTML = 'PosEd';
    initEnvironment();
    loadAniPoseDefault('data/anipose.json');
    addListeners();
}

function initEnvironment() {
    const result = environVRM.new('posed');
    if(result.error) {console.warn(`Error creating environment: ${result.error}`); return;}

    environVRM.addDomListener('pointerdown', onModelClick);
    const dims = environVRM.dimensions();
    document.getElementById('environw').value = dims.width;
    document.getElementById('environh').value = dims.height;
    
    environVRM.animate();
}


function addListeners() {
    if (document.readyState !== 'complete') {
        setTimeout(addListeners, 30);
        return;
    }

    const fileInput = document.getElementById('vrmFileInput');
    loadbtn.addEventListener('click', (event) => {
        fileInput.click();
    });

    // Add a file input listener
    if (fileInput) {
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const arrayBuffer = e.target.result;
                    loadVRMFromBuffer(arrayBuffer);
                };
                reader.readAsArrayBuffer(file);
            }
        });
    }

    panelListeners();
    loadaniposes.addEventListener('click', (event) => {document.getElementById('aniposeLoadFile').click()});
    document.getElementById('aniposeLoadFile').addEventListener('change', (event) =>{loadAniPoseFromFile(event);});
    saveaniposes.addEventListener('click', (event) => {saveAniPoseToFile();});
    environ.addEventListener('click', (event) => {togglePanel('environ')});

    environset.addEventListener('click', (event) => {
        environVRM.resetView(document.getElementById('environw').value, document.getElementById('environh').value);
        togglePanel('environ');
    });
    qse1.addEventListener('click', (event) => {
        document.getElementById('environw').value = 512;
        document.getElementById('environh').value = 512;
        environset.dispatchEvent(new Event('click'));
    });
    qse2.addEventListener('click', (event) => {
        document.getElementById('environw').value = 1280;
        document.getElementById('environh').value = 720;
        environset.dispatchEvent(new Event('click'));
    });
    qse3.addEventListener('click', (event) => {
        document.getElementById('environw').value = 720;
        document.getElementById('environh').value = 1280;
        environset.dispatchEvent(new Event('click'));
    });
    qse4.addEventListener('click', (event) => {
        document.getElementById('environw').value = Math.round(window.innerWidth * window.devicePixelRatio);
        document.getElementById('environh').value = Math.round(window.innerHeight * window.devicePixelRatio);
        environset.dispatchEvent(new Event('click'));
    });

    camview.addEventListener('click', (event) => {togglePanel('camera')});
    camfront.addEventListener('click', (event) => {setCameraView('front');});
    camback.addEventListener('click', (event) => {setCameraView('back');});
    camleft.addEventListener('click', (event) => {setCameraView('left');});
    camright.addEventListener('click', (event) => {setCameraView('right');});
    camtop.addEventListener('click', (event) => {setCameraView('top');});
    cambottom.addEventListener('click', (event) => {setCameraView('bottom');});
    camhead.addEventListener('click', (event) => {setCameraView('head');});

    // ----------------------------------------- POSE ACTIONS
    posebtn.addEventListener('click', (event) => {togglePanel('pose')});

    resetmdl.addEventListener('click', (event) => {
        environVRM.resetPose();
        selbones.dispatchEvent(new Event('change'));
        poselist.value = 'None';
        capposelist.value = 'None';
        grounded.checked = false;
    });

    handpos.addEventListener('click', (event) => {
        let index = handPoses.indexOf(environVRM.handPosed());
        index++;
        if(index >= handPoses.length) index = 0;
        environVRM.setHandPosition(handPoses[index]);
    });

    addposeshow.addEventListener('click', (event) => {
        const app = document.getElementById('addposepanel');
        if(app.style.display == 'none') {
            document.getElementById('applyposepanel').style.display = 'none';
            app.style.display = 'block';
            pnametxt.focus();
        } else {
            app.style.display = 'none';
            document.getElementById('applyposepanel').style.display = 'block';
        }
    });

    selbones.addEventListener('change', (event) => {
        const index = selbones.value;
        const state = environVRM.vrmstate();
        const sign = state.reverseSign ? -1 : 1;
        const part = state.currentVrm.humanoid.getNormalizedBoneNode(vrmAppState.bones[index]);
        if(!part) return;
        
        rotx.value = environVRM.radToDeg(part.rotation.x);
        roty.value = environVRM.radToDeg(part.rotation.y);
        rotz.value = environVRM.radToDeg(part.rotation.z * sign);

        rotxs.value = environVRM.radToDeg(part.rotation.x);
        rotys.value = environVRM.radToDeg(part.rotation.y);
        rotzs.value = environVRM.radToDeg(part.rotation.z * sign);
    });

    mirror.addEventListener('click', (event) => {environVRM.mirror(mirror.checked);});

    rotxl.addEventListener('click', (event) => {rotx.value = 0; rotx.dispatchEvent(new Event('change'));});
    rotyl.addEventListener('click', (event) => {roty.value = 0; roty.dispatchEvent(new Event('change'));});
    rotzl.addEventListener('click', (event) => {rotz.value = 0; rotz.dispatchEvent(new Event('change'));});

    rotx.addEventListener('change', (event) => {
        const xvalue = validateInteger(rotx.value*1, false, 360);
        rotx.value = xvalue;
        rotxs.value = xvalue;
        const index = selbones.value;
        environVRM.rotatePart(vrmAppState.bones[index], xvalue, -1, -1);
    });

    roty.addEventListener('change', (event) => {
        const yvalue = validateInteger(roty.value*1, false, 360);
        roty.value = yvalue;
        rotys.value = yvalue;
        const index = selbones.value;
        environVRM.rotatePart(vrmAppState.bones[index], -1, yvalue, -1);
    });

    rotz.addEventListener('change', (event) => {
        const zvalue = validateInteger(rotz.value*1, false, 360);
        rotz.value = zvalue;
        rotzs.value = zvalue;
        const index = selbones.value;
        environVRM.rotatePart(vrmAppState.bones[index], -1, -1, zvalue);
    });

    rotxs.addEventListener('input', (event) => {rotx.value = rotxs.value;});
    rotys.addEventListener('input', (event) => {roty.value = rotys.value;});
    rotzs.addEventListener('input', (event) => {rotz.value = rotzs.value;});

    rotxs.addEventListener('keyup', (event) => {rotx.dispatchEvent(new Event('change'));});
    rotxs.addEventListener('mouseup', (event) => {rotx.dispatchEvent(new Event('change'));});

    rotys.addEventListener('keyup', (event) => {roty.dispatchEvent(new Event('change'));});
    rotys.addEventListener('mouseup', (event) => {roty.dispatchEvent(new Event('change'));});

    rotzs.addEventListener('keyup', (event) => {rotz.dispatchEvent(new Event('change'));});
    rotzs.addEventListener('mouseup', (event) => {rotz.dispatchEvent(new Event('change'));});

    grounded.addEventListener('click', (event) => {environVRM.grounded(grounded.checked);});

    pnametxt.addEventListener("keypress", function(event) {
		if (event.key === "Enter") {event.preventDefault(); addPosetoLibrary();}
	});
    addpose.addEventListener('click', (event) => {addPosetoLibrary();});
    xaddpose.addEventListener('click', (event) => {addposeshow.dispatchEvent(new Event('click'));});
    poselist.addEventListener('change', (event) => {
        poseListChange();
        capposelist.value = poselist.value;
    });
    capposelist.addEventListener('change', (event) =>{
        poselist.value = capposelist.value;
        poselist.dispatchEvent(new Event('change'));
    });
    setupPoseList();

    //----------------------------------------------------------------------------------

    anibtn.addEventListener('click', (event) => {togglePanel('ani')});

    editani.addEventListener('click', (event) => {editAnimation();});
    addani.addEventListener('click', (event) => {addAnimation();});
    addframe.addEventListener('click', (event) => {addNewFrame();})
    startani.addEventListener('click', (event) => {startAnimation();});
    stopani.addEventListener('click', (event) => {stopAnimation();});
    updateani.addEventListener('click', (event) => {updateAnimation();});
    cancelani.addEventListener('click', (event) => {closeAniUpdate();});
    setupAnimationList();

    //--------------------------------------------------------------------------------------

    gridtgl.addEventListener('click', (event) => {environVRM.toggleGrid();});
    axestgl.addEventListener('click', (event) => {environVRM.toggleAxes();});

    //--------------------------------------------------------------------------------------

    capbtn.addEventListener('click', (event) => {
        togglePanel('cappose');
        const renderer = environVRM.renderer();
        document.getElementById('caprend').textContent = ` (${renderer.domElement.width}x${renderer.domElement.height})`;
    });

    capture.addEventListener('click', (event) => {captureCurrentView()});

    anicapbtn.addEventListener('click', (event) => {
        togglePanel('capani');
        const renderer = environVRM.renderer();
        document.getElementById('caprenda').textContent = ` (512x512)`;
    });

}

async function loadVRMFromBuffer(buffer) {
    document.getElementById('environpanel').style.display = 'none';
    const vrm = await environVRM.loadVRMFromBuffer(buffer);
    if(!vrm) return;
    setBones(vrm);
    mdlopts.style.display = 'inline-block';
    poselist.value = 'None';
    capposelist.value = 'None';
}

function loadAniPoseDefault(url) {
    fetch(url)
        .then((res) => res.json())
        .then((data) => {
            environVRM.setPoses(data.poses);
            environVRM.setAnimations(data.animations);
        })
        .catch((err) => console.error('Failed to load poses and animations:', err));
}

function loadAniPoseFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if(vrmAppState.currentVrm) Pose.resetModel(vrmAppState);

            // Load poses
            if (data.poses) {
                environVRM.setPoses(data.poses);
                setupPoseList();
            }

            // Load animations
            if (data.animations) {
                environVRM.setAnimations(data.animations);
                setupAnimationList();
            }

        } catch (err) {
            console.error('Failed to parse file:', err);
        }
    };
    reader.readAsText(file);
}

function saveAniPoseToFile() {
    const anipose = {poses: Object.values(Pose.poseLibrary), animations: Object.values(Anim.animationLibrary)};
    const dataStr = JSON.stringify(anipose, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'anipose.json';
    link.click();

    URL.revokeObjectURL(url);
}

// ------------------------------------------------------------- Pose UI funcitons

function setBones(vrm) {
    if(!vrm) {
        selbones.innerHTML = '';
        console.log('no VRM');
        return;
    }

    vrmAppState.bones = [];
    const bones = Object.keys(vrm.humanoid.humanBones);
    const exclude = ['Index', 'Middle', 'Ring', 'Little', 'Thumb', 'Toes'];
    let digit, i, j;
    for(i=0; i<bones.length; i++) {
        digit = false;
        for(j=0; j<exclude.length; j++) {
            if(bones[i].includes(exclude[j])) {
                digit = true; 
                break;
            }
        }
        if(!digit) vrmAppState.bones.push(bones[i]);
    }

    selbones.innerHTML = '';
    for(i=0; i<vrmAppState.bones.length; i++) {
        var opt = document.createElement('option');
        opt.value = i;
        opt.innerHTML = vrmAppState.bones[i];
        selbones.appendChild(opt);
    }

    selbones.value = 0;
    rotx.value = 0;
    roty.value = 0;
    rotz.value = 0;
    rotxs.value = 0;
    rotys.value = 0;
    rotzs.value = 0;
    grounded.checked = false;
}

function onModelClick(event) {
    const vrm = environVRM.vrm();
    if (!vrm) return;

    const renderer = environVRM.renderer();
    const raycaster = environVRM.raycaster();
    const camera = environVRM.camera();

    const mouse = getNormalizedMousePosition(event, renderer.domElement);
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(vrm.scene, true);

    if (intersects.length === 0) {
        //console.warn('No intersection');
        return;
    }

    const hit = intersects[0];
    const boneKey = findNearestBoneToHit(hit, vrm);

    if (boneKey && vrmAppState.bones.includes(boneKey)) {
        const index = vrmAppState.bones.indexOf(boneKey);
        selbones.value = index;
        selbones.dispatchEvent(new Event('change'));
    }
}

function getNormalizedMousePosition(event, domElement) {
    const rect = domElement.getBoundingClientRect();
    return {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
    };
}

function findNearestBoneToHit(intersect, vrm) {
    const hitPoint = intersect.point;
    let closestBone = null;
    let closestDistance = Infinity;

    for (const key in vrm.humanoid.humanBones) {
        const bone = vrm.humanoid.getNormalizedBoneNode(key);
        if (!bone) continue;

        const boneWorldPos = environVRM.vector3();
        bone.getWorldPosition(boneWorldPos);

        const distance = boneWorldPos.distanceTo(hitPoint);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestBone = bone;
        }
    }

    // ignore bones if click is too far away (e.g. over 0.2 units)
    if (closestDistance > 0.2) return null;

    const decodedBone = closestBone.name.split('_');
    switch(decodedBone[3]) {
        case 'C':
            return decodedBone[4].toLowerCase();
        case 'L':
            return 'left' + decodedBone[4];
        case 'R':
             return 'right' + decodedBone[4];

    }

    return null;
}

function setCameraView(direction, distance = 5) {
    const target = environVRM.cloneTarget();
    if(!target) return;

    switch (direction) {
        case 'front':
            environVRM.setCameraPosition(target.x, target.y, target.z + distance);
            break;
        case 'back':
            environVRM.setCameraPosition(target.x, target.y, target.z - distance);
            break;
        case 'left':
            environVRM.setCameraPosition(target.x + distance, target.y, target.z);
            break;
        case 'right':
            environVRM.setCameraPosition(target.x - distance, target.y, target.z);
            break;
        case 'top':
            environVRM.setCameraPosition(target.x, target.y + distance, target.z);
            break;
        case 'bottom':
            environVRM.setCameraPosition(target.x, target.y - distance, target.z);
            break;
        case 'head':
            const boneNode = environVRM.head();
            if(!boneNode) return;
            const adj = 0.075;
            target.y = boneNode.getWorldPosition(environVRM.vector3()).y + adj;
            if(environVRM.aspect() < 1) environVRM.setCameraPosition(target.x, target.y - (1*adj), 0.8);
            else environVRM.setCameraPosition(target.x, target.y - (1*adj), 0.6);
            
            break;
        default:
            console.warn('Unknown camera view:', direction);
            return;
    }
    environVRM.setTarget(target);
}

function addPosetoLibrary() {
    const pname = pnametxt.value;
    if(pname.length < 1 || pname.length > 16) return;

    if(pname.toLowerCase() == 'none') {
        sysWindow.alert(`"${pname}" is a reserved name and cannot be used for a pose.`);
        return;
    }

    if(environVRM.poseExists(pname)) {
        sysWindow.confirm('Pose Exists', `The pose "${pname}" already exists.  Do you want to overwrite it?`, overwritePose);
    } else {
        environVRM.addPoseFromCurrent(pname);
        pnametxt.value = '';
        document.getElementById('addposepanel').style.display = 'none';
        document.getElementById('applyposepanel').style.display = 'block';
        setupPoseList();
        poselist.value = pname;
        capposelist.value = pname;
    }
}

function overwritePose(result) {
    if(result == 2) return;
    const pname = pnametxt.value;
    environVRM.addPoseFromCurrent(pname);
    pnametxt.value = '';
    document.getElementById('addposepanel').style.display = 'none';
    document.getElementById('applyposepanel').style.display = 'block';
}

function setupPoseList() {
    poselist.innerHTML = '';
    capposelist.innerHTML = '';

    const pl = environVRM.poseList();
    if(!pl) return;

    if(pl.length) pl.sort();
    pl.unshift('None');
    for(let i=0; i<pl.length; i++) {
        var opt = document.createElement('option');
        opt.value = pl[i];
        opt.innerHTML = pl[i];
        poselist.appendChild(opt);

        var opt2 = document.createElement('option');
        opt2.value = pl[i];
        opt2.innerHTML = pl[i];
        capposelist.appendChild(opt2);
    }
}

function poseListChange() {
    const posename = poselist.value;
    if(posename == 'None') {
        environVRM.resetPose();
    } else {
        environVRM.applyPose(posename);
        pnametxt.value = posename;
    }

    grounded.checked = vrmAppState.grounded;
    selbones.dispatchEvent(new Event('change'));
}

//===================================================  ANIMATIONS

function setupAnimationList() {
    anilist.innerHTML = '';
    capanilist.innerHTML = '';

    const al = environVRM.animationList();
    if(!al) return;

    if(al.length) al.sort();
    anilist.innerHTML = '';
    for(let i=0; i<al.length; i++) {
        var opt = document.createElement('option');
        opt.value = al[i];
        opt.innerHTML = al[i];
        anilist.appendChild(opt);

        var opt2 = document.createElement('option');
        opt2.value = al[i];
        opt2.innerHTML = al[i];
        capanilist.appendChild(opt2);
    }
}

let frameIndex = 0;
function editAnimation() {
    document.getElementById('animenu').style.display = 'none';
    document.getElementById('aniaction').textContent = `Editing:`;
    document.getElementById('aniname').value =  anilist.value;
    document.getElementById('aniname').disabled = true;
    document.getElementById('aniactioncontainer').style.display = 'block';
    document.getElementById('newani').style.display = 'block';
    frameIndex = 0;
    showFrames(anilist.value);
}

function addAnimation() {
    document.getElementById('animenu').style.display = 'none';
    document.getElementById('aniaction').textContent = `New:`;
    document.getElementById('aniname').value =  '';
    document.getElementById('aniname').disabled = false;
    frameloop.checked = false;
    document.getElementById('aniactioncontainer').style.display = 'block';
    document.getElementById('newani').style.display = 'block';
    document.getElementById('aniname').focus();
    frameIndex = 0;
}

function showFrames(aniname = '') {
    if(!aniname.length) {return;}
    aniframes.innerHTML = '';
    frameloop.checked = environVRM.animationLoop(anilist.value);
    const frames = environVRM.animationFrames(anilist.value);
    for(let i=0; i<frames.length; i++) {
        addFrameRow(i, frames[i].time, frames[i].pose);
        frameIndex++;
    }
}

function addNewFrame() {
    const childElements = aniframes.children;
    const frames = [];
    for (const child of childElements) {
        const parts = child.id.split('_');
        if(parts[0] == 'frame') {
            frames.push({time: document.getElementById('frametime_'+parts[1]).value*1, pose: document.getElementById('framepose_'+parts[1]).value});
        }
    }

    const pl = environVRM.poseList();
    if(pl.length) pl.sort();

    let time = 0;
    if(frames.length) time = frames[frames.length-1].time + 0.5;
    addFrameRow(frameIndex, time, pl[0]);

    frameIndex++;
}

function addFrameRow(index, time, pose) {
    const fdiv = document.createElement('div');
    fdiv.id = 'frame_'+index;

    const tlbl = document.createElement('span');
    tlbl.style.fontFamily = "Xolonium-Regular";
    tlbl.style.color = '#6f899f';
    tlbl.innerHTML = 'Time: ';
    fdiv.appendChild(tlbl);

    const tinput = document.createElement('input');
    tinput.type = 'number';
    tinput.id = 'frametime_'+index;
    tinput.min = 0;
    tinput.step = 0.5;
    tinput.value = time.toFixed(1);
    tinput.style.width = '75px';
    fdiv.appendChild(tinput);

    const plbl = document.createElement('span');
    plbl.style.fontFamily = "Xolonium-Regular";
    plbl.style.color = '#6f899f';
    plbl.style.marginLeft = '8px';
    plbl.innerHTML = 'Pose: ';
    fdiv.appendChild(plbl);

    const fselect = document.createElement('select');
    fselect.id = 'framepose_'+index;
    fdiv.appendChild(fselect);

    if(!fselect) {console.warn(`${fid} select not available`); return;}
    const pl = environVRM.poseList();
    if(pl.length) pl.sort();
    for(let i=0; i<pl.length; i++) {
        var opt = document.createElement('option');
        opt.value = pl[i];
        opt.innerHTML = pl[i];
        fselect.appendChild(opt);
    }
    fselect.value = pose;

    const del = document.createElement('img');
    del.src = '/sys/icons/x2.png';
    del.id = 'framedelete_'+index;
    del.height = 15;
    del.className = 'iconbtn';
    del.title = 'Remove Frame';
    fdiv.appendChild(del);

    del.addEventListener('click', (event) => {removeFrame(event)});

    aniframes.appendChild(fdiv);
}

function removeFrame(e) {
    const index = e.target.id.split('_');
    const fdiv = document.getElementById('frame_'+index[1]);
    if(!fdiv) return;
    aniframes.removeChild(fdiv);
}

function updateAnimation() {
    const name = document.getElementById('aniname').value;
    if(!name) return;
    if(!name.length) return;

    const childElements = aniframes.children;
    const frames = [];
    for (const child of childElements) {
        const parts = child.id.split('_');
        if(parts[0] == 'frame') {
            frames.push({time: document.getElementById('frametime_'+parts[1]).value*1, pose: document.getElementById('framepose_'+parts[1]).value});
        }
    }

    Anim.addAnimationToLibrary(name, document.getElementById('frameloop').checked, frames);
    closeAniUpdate();
    setupAnimationList();
}

function closeAniUpdate() {
    document.getElementById('aniaction').textContent = '';
    document.getElementById('newani').style.display = 'none';
    aniframes.innerHTML = '';
    document.getElementById('aniactioncontainer').style.display = 'none';
    document.getElementById('animenu').style.display = 'block';
}

function startAnimation() {
    let ani = anilist.value;
    const loop = environVRM.playAnimation(ani);
    if(loop) stopani.style.display = 'inline-block';
}

function stopAnimation() {
    environVRM.stopAnimation();
    stopani.style.display = 'none';
}

//================================================ CAPTURE FUNCTIONS

function captureCurrentView() {
    if(cappose.style.display == 'block' && capani.style.display == 'none') {captureCurrentPoseView();}
    if(cappose.style.display == 'none' && capani.style.display == 'block') {captureCurrentAniView();}
}

function captureCurrentPoseView(filename = 'pose.png') {
    
    const selectedRadioButton = document.querySelector('input[name="capscreen"]:checked');
    if (!selectedRadioButton) return;
    const selectedValue = selectedRadioButton.value;

    let dataURL = null;
    switch(selectedValue) {
        case 'fullhd':
            dataURL = environVRM.captureView(1920, 1080);
            break;
        case 'square':
            dataURL = environVRM.captureView(512, 512);
            break;
        case 'model':
            dataURL = environVRM.captureModelOnly();
            break;
    }

    if(!dataURL) return;
    downloadImage(dataURL, filename);
}

function downloadImage(dataURL, filename = 'screenshot.png') {
    if(!dataURL) return;
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

async function captureCurrentAniView() {
    const selectedRadioButton = document.querySelector('input[name="capaniscreen"]:checked');
    if (!selectedRadioButton) return;
    const selectedValue = selectedRadioButton.value;
    const aname = capanilist.value;

    const frames = environVRM.animationFrames(aname);
    if(!frames) return;
    if(!frames.length) return;

    let data = null;
    switch(selectedValue) {
        case 'keyframe':
            data = await environVRM.captureKeyFrames(aname, 512, 512);
            break;
        case 'sprite':
            data = await environVRM.captureSpriteSheet(aname, 256, 256);
            break;
    }

    if(!data) return;
    poselist.dispatchEvent(new Event('change'));

    switch(selectedValue) {
        case 'keyframe':
            const link = document.createElement('a');
            link.href = URL.createObjectURL(data);
            link.download = `${aname}_frames.zip`;
            link.click();
            break;
        case 'sprite':
            downloadImage(data, `${aname}.png`);
            break;
    }
}
