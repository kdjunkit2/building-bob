// poses.js
import * as THREE from 'three';

export const poseLibrary = {};

const boneMirrorMap = {
    leftUpperArm: 'rightUpperArm',
    leftLowerArm: 'rightLowerArm',
    leftHand: 'rightHand',
    leftShoulder: 'rightShoulder',
    leftUpperLeg: 'rightUpperLeg',
    leftLowerLeg: 'rightLowerLeg',
    leftFoot: 'rightFoot',
    leftToes: 'rightToes',

    rightUpperArm: 'leftUpperArm',
    rightLowerArm: 'leftLowerArm',
    rightHand: 'leftHand',
    rightShoulder: 'leftShoulder',
    rightUpperLeg: 'leftUpperLeg',
    rightLowerLeg: 'leftLowerLeg',
    rightFoot: 'leftFoot',
    rightToes: 'leftToes',

    // Optional fingers if you want to support those later
    leftThumbMetacarpal: 'rightThumbMetacarpal',
    // ...
};

//====================================================== POSE MANAGER

export function loadPoses(url) {
    fetch(url)
        .then((res) => res.json())
        .then((data) => {
            for (const pose of data.poses) {
                poseLibrary[pose.name] = pose;
            }
            console.log('Loaded poses:', Object.keys(poseLibrary));
        })
        .catch((err) => console.error('Failed to load poses:', err));
}

export function loadPosesObject(obj) {
    let count = 0;
    for(const pose of obj) {
        poseLibrary[pose.name] = pose;
        count++;
    }
    console.log(`Loaded ${count} poses:`, Object.keys(poseLibrary));
}

export function savePosesToFile() {
    const dataStr = JSON.stringify({ poses: Object.values(poseLibrary) }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'poses.json';
    link.click();

    URL.revokeObjectURL(url);
}

export function poseExists(name) {return name in poseLibrary;}
export function getPoseList() {return [...Object.keys(poseLibrary)];}

export function addPoseFromCurrent(state, name) {
    const grounded = state.grounded;
    const bones = {};
    const vrm = state.currentVrm;
    if (!vrm) return;

    for (const boneKey in vrm.humanoid.humanBones) {
        const boneNode = vrm.humanoid.getNormalizedBoneNode(boneKey);
        if (boneNode) {
            const rot = boneNode.rotation;
            if(boneKey == 'hips') {
                const pos = boneNode.position;
                bones[boneKey] = {
                    rotation: [THREE.MathUtils.radToDeg(rot.x), THREE.MathUtils.radToDeg(rot.y), THREE.MathUtils.radToDeg(rot.z)],
                    position: [pos.x, pos.y, pos.z]
                };
            } else {
                bones[boneKey] = {
                    rotation: [THREE.MathUtils.radToDeg(rot.x), THREE.MathUtils.radToDeg(rot.y), THREE.MathUtils.radToDeg(rot.z)]
                };
            }
        }
    }

    poseLibrary[name] = { name, grounded, bones };
}

//=============================================== POSE APPLICATION

export function applyPose(state, poseName) {
    const pose = poseLibrary[poseName];
    if (!pose || !state.currentVrm) {
        console.warn('Pose not found or no VRM loaded');
        return;
    }

    for (const boneName in pose.bones) {
        const node = state.currentVrm.humanoid.getNormalizedBoneNode(boneName);
        if (!node) continue;

        const boneData = pose.bones[boneName];

        // Apply rotation
        if (boneData.rotation) {
            const [x, y, z] = boneData.rotation;
            node.rotation.set(
                THREE.MathUtils.degToRad(x),
                THREE.MathUtils.degToRad(y),
                THREE.MathUtils.degToRad(z)
            );
        }

        // Apply position (usually only hips)
        if (boneData.position) {
            const [px, py, pz] = boneData.position;
            node.position.set(px, py, pz);
        }
    }

    state.grounded = pose.grounded;
    autoGroundHips(state);
    state.pose = poseName;
}

export function resetModel(state) {
    const vrm = state.currentVrm;
    const bones = Object.keys(vrm.humanoid.humanBones);

    for(let i=0; i<bones.length; i++) {
        const part = vrm.humanoid.getNormalizedBoneNode(bones[i]);
        if(!part) continue;
        part.rotation.set(0, 0, 0);
    }

    state.grounded = false;
    const hips = vrm.humanoid.getNormalizedBoneNode('hips');
    hips.position.y = state.startPoints.hipsY;
}

export function rotatePart(state, partname, x, y, z) {
    const vrm = state.currentVrm;
    let sign = state.reverseSign ? -1 : 1;

    const part = vrm.humanoid.getNormalizedBoneNode(partname);
    if(!part) return;

    if(x >= 0) part.rotation.x = THREE.MathUtils.degToRad(x);
    if(y >= 0) part.rotation.y = THREE.MathUtils.degToRad(y);
    if(z >= 0) part.rotation.z = THREE.MathUtils.degToRad(sign * z);

    if(state.mirror && boneMirrorMap[partname]) {
        const mpart = vrm.humanoid.getNormalizedBoneNode(boneMirrorMap[partname]);
        if(x >= 0) mpart.rotation.x = THREE.MathUtils.degToRad(x);
        if(y >= 0) mpart.rotation.y = THREE.MathUtils.degToRad(-y);
        if(z >= 0) mpart.rotation.z = THREE.MathUtils.degToRad(sign * -z);
    }

    autoGroundHips(state);
}

export function handPosition(state, position = 'default') {
    switch(position) {
        case 'default':
            handsReset(state);
            break;
        case 'fist':
            fist(state);
            break;
        case 'natural':
            handsNatural(state);
            break;

    }
}

function fist(state) {
    const vrm = state.currentVrm;
    let sign = state.reverseSign ? -1 : 1;
    let tsign = state.reverseSign ? 1 : -1;
    const finger = ['Index', 'Middle', 'Ring', 'Little'];
    let direction  = 'right';
    if(state.handPosed != 'default') handsReset(state);

    for(let j=0; j<2; j++) {
        for(let i=0; i<finger.length; i++) {
            const index1 = vrm.humanoid.getNormalizedBoneNode(`${direction}${finger[i]}Proximal`);
            const index2 = vrm.humanoid.getNormalizedBoneNode(`${direction}${finger[i]}Intermediate`);
            const index3 = vrm.humanoid.getNormalizedBoneNode(`${direction}${finger[i]}Distal`);
            if (index1 && index2 && index3) {            
                index1.rotation.z = THREE.MathUtils.degToRad(sign * 90);
                index2.rotation.z = THREE.MathUtils.degToRad(sign * 90);
                index3.rotation.z = THREE.MathUtils.degToRad(sign * 90);
            }
        }
        const t1 = vrm.humanoid.getNormalizedBoneNode(`${direction}ThumbProximal`);
        const t2 = vrm.humanoid.getNormalizedBoneNode(`${direction}ThumbDistal`);
        const t3 = vrm.humanoid.getNormalizedBoneNode(`${direction}ThumbMetacarpal`);
        if(t1 && t2 && t3) {
            t1.rotation.y = THREE.MathUtils.degToRad(tsign * sign * 65);
            t2.rotation.y = THREE.MathUtils.degToRad(tsign * sign * 65);
            t3.rotation.z = THREE.MathUtils.degToRad(sign * 20);
            t3.rotation.x = THREE.MathUtils.degToRad(tsign * -90);
        }

        direction = 'left'; sign *= -1;
    }
    state.handPosed = 'fist';
}

function handsNatural(state) {
    const vrm = state.currentVrm;
    let sign = state.reverseSign ? -1 : 1;
    let tsign = state.reverseSign ? 1 : -1;
    const finger = ['Index', 'Middle', 'Ring', 'Little'];
    let direction  = 'right';
    if(state.handPosed != 'default') handsReset(state);

    for(let j=0; j<2; j++) {
        for(let i=0; i<finger.length; i++) {
            const index1 = vrm.humanoid.getNormalizedBoneNode(`${direction}${finger[i]}Proximal`);
            const index2 = vrm.humanoid.getNormalizedBoneNode(`${direction}${finger[i]}Intermediate`);
            const index3 = vrm.humanoid.getNormalizedBoneNode(`${direction}${finger[i]}Distal`);
            if (index1 && index2 && index3) {            
                index1.rotation.z = THREE.MathUtils.degToRad(sign * 20);
                index2.rotation.z = THREE.MathUtils.degToRad(sign * 20);
                index3.rotation.z = THREE.MathUtils.degToRad(sign * 20);
            }
        }
        const t1 = vrm.humanoid.getNormalizedBoneNode(`${direction}ThumbProximal`);
        const t2 = vrm.humanoid.getNormalizedBoneNode(`${direction}ThumbDistal`);
        const t3 = vrm.humanoid.getNormalizedBoneNode(`${direction}ThumbMetacarpal`);
        if(t1 && t2 && t3) {
            t3.rotation.x = THREE.MathUtils.degToRad(tsign * -40);
            t3.rotation.y = THREE.MathUtils.degToRad(tsign * sign * 20);
            t3.rotation.z = THREE.MathUtils.degToRad(sign * 10);
        }
        
        direction = 'left'; sign *= -1;
    }
    state.handPosed = 'natural';
}

function handsReset(state) {
    if(state.handPosed == 'default') return;
    const vrm = state.currentVrm;
    let sign = state.reverseSign ? -1 : 1;
    const finger = ['Index', 'Middle', 'Ring', 'Little'];
    let direction  = 'right';

    for(let j=0; j<2; j++) {
        for(let i=0; i<finger.length; i++) {
            const index1 = vrm.humanoid.getNormalizedBoneNode(`${direction}${finger[i]}Proximal`);
            const index2 = vrm.humanoid.getNormalizedBoneNode(`${direction}${finger[i]}Intermediate`);
            const index3 = vrm.humanoid.getNormalizedBoneNode(`${direction}${finger[i]}Distal`);
            if (index1 && index2 && index3) {            
                index1.rotation.set(0, 0, 0);
                index2.rotation.set(0, 0, 0);
                index3.rotation.set(0, 0, 0);;
            }
        }
        
        const t1 = vrm.humanoid.getNormalizedBoneNode(`${direction}ThumbProximal`);
        const t2 = vrm.humanoid.getNormalizedBoneNode(`${direction}ThumbDistal`);
        const t3 = vrm.humanoid.getNormalizedBoneNode(`${direction}ThumbMetacarpal`);
        if(t1 && t2 && t3) {
            t1.rotation.set(0, 0, 0);
            t2.rotation.set(0, 0, 0);
            t3.rotation.set(0, 0, 0);
        }
        
        direction = 'left'; sign *= -1;
    }
    state.handPosed = 'default';
}

export function autoGroundHips(state) {
    if(!state.grounded) return;
    const vrm = state.currentVrm;
    
    const hips = vrm.humanoid.getNormalizedBoneNode('hips');
    let min = Infinity;

    for (const boneKey in vrm.humanoid.humanBones) {
        const boneNode = vrm.humanoid.getNormalizedBoneNode(boneKey);
        if (boneNode) {
            const posy = boneNode.getWorldPosition(new THREE.Vector3()).y;
            min = Math.min(min, posy);
        }
    }
    hips.position.y -= min - 0.07;
}
