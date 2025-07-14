import * as THREE from 'three';

import { poseLibrary } from "./pose.mjs";

export const animationLibrary = {};
export let animationMixer = null;
export let currentAction = null;

export function animationExists(name) {return name in animationLibrary;}
export function getAnimationList() {return [...Object.keys(animationLibrary)];}

export function loadAnimationsObject(obj) {
    let count = 0;
    for(const animation of obj) {
        animationLibrary[animation.name] = animation;
        count++;
    }
    console.log(`Loaded ${count} animations:`, Object.keys(animationLibrary));
}

export function getAnimationLoop(name) {
    if(!animationExists(name)) return false;
    return animationLibrary[name].loop;
}

export function getAnimationFrames(name) {
    if(!animationExists(name)) return [];
    return animationLibrary[name].frames;
}

export function addAnimationToLibrary(name, loop, frames) {
    if(!name) return;
    if(!name.length) return;

    animationLibrary[name].loop = loop;
    animationLibrary[name].frames = frames;

    console.log(animationLibrary);
}

export function playPoseAnimation(state, aniName) {
    const timeline = animationLibrary[aniName];
    const vrm = state.currentVrm;
    if (!timeline || !vrm) {
        console.warn('Animation not found or no VRM loaded');
        return false;
    }

    const clip = createAnimationClipFromPoseTimeline(state, timeline, poseLibrary);

    if (!animationMixer) animationMixer = new THREE.AnimationMixer(vrm.scene);
    if (currentAction) currentAction.stop();

    currentAction = animationMixer.clipAction(clip);
    currentAction.play();
    return timeline.loop;
}

export function stopPoseAnimation(state) {
    const vrm = state.currentVrm;
    if (currentAction) {
    currentAction.stop();
    currentAction = null;
    }
    if (animationMixer) {
        animationMixer.uncacheRoot(vrm.scene);
        animationMixer = null;
    }
}

function createAnimationClipFromPoseTimeline(state, timeline) {
    const vrm = state.currentVrm;
    const tracks = [];

    const boneKeys = Object.keys(vrm.humanoid.humanBones);

    for (const boneKey of boneKeys) {
        const bone = vrm.humanoid.getNormalizedBoneNode(boneKey);
        if (!bone) continue;

        const times = [];
        const values = [];

        for (const frame of timeline.frames) {
            const pose = poseLibrary[frame.pose];
            if (!pose || !pose.bones[boneKey]) continue;

            const [x, y, z] = pose.bones[boneKey].rotation.map(THREE.MathUtils.degToRad);
            const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));

            times.push(frame.time);
            values.push(q.x, q.y, q.z, q.w);
        }

        if (times.length > 1) {
            tracks.push(new THREE.QuaternionKeyframeTrack(
                `${bone.name}.quaternion`,
                times,
                values
            ));
        }

        // Add this block specifically for hips.position
        if (boneKey === 'hips') {
            const posTimes = [];
            const posValues = [];

            for (const frame of timeline.frames) {
                const pose = poseLibrary[frame.pose];
                if (!pose || !pose.bones[boneKey] || !pose.bones[boneKey].position) continue;

                const [px, py, pz] = pose.bones[boneKey].position;

                posTimes.push(frame.time);
                posValues.push(px, py, pz);
            }

            if (posTimes.length > 1) {
                tracks.push(new THREE.VectorKeyframeTrack(
                    `${bone.name}.position`,
                    posTimes,
                    posValues
                ));
            }
        }
    }

    const clip = new THREE.AnimationClip(timeline.name || 'Unnamed', -1, tracks);
    clip.loop = timeline.loop ? THREE.LoopRepeat : THREE.LoopOnce;

    return clip;
}

