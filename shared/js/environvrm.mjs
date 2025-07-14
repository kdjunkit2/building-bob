import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

import * as Pose from "./pose.mjs";
import * as Anim from "./animation.mjs";

class vrmHandler {
    constructor(index) {
        this.index = index;
        this.state = {
            currentVrm: null,
            reverseSign: false,
            startPoints: {hipsY: Infinity, lowestY: Infinity},
            mirror: false,
            grounded: false,
            handPosed: 'default',
        }

        
    }

    async loadFromBuffer(buffer) {
        if (!buffer) {
            console.warn('No load buffer provided to VRM handler');
            return null;
        }

        const loader = this.createFreshLoader();

        return new Promise((resolve, reject) => {
            loader.parse(
                buffer,
                '',
                (gltf) => {
                    const vrm = gltf.userData.vrm;
                    VRMUtils.removeUnnecessaryVertices(gltf.scene);
                    VRMUtils.combineSkeletons(gltf.scene);
                    VRMUtils.combineMorphs(vrm);

                    // Rotate the model to face forward
                    if (vrm.lookAt.faceFront.z < 0) {
                        vrm.scene.rotation.y = Math.PI;
                        this.state.reverseSign = true;
                    }

                    this.state.currentVrm = vrm;
                    this.setStartPoints();
                    vrm.scene.traverse((obj) => {
                        obj.frustumCulled = false;
                    });

                    resolve(this.state.currentVrm);
                },
                (error) => {
                    console.error('Error parsing VRM:', error);
                    reject(null);
                }
            );
        });
    }

    createFreshLoader() {
        const freshLoader = new GLTFLoader();
        freshLoader.register(parser => new VRMLoaderPlugin(parser));
        return freshLoader;
    }

    setStartPoints() {
        const vrm = this.state.currentVrm;
        if(!vrm) {return;}

        const hips = vrm.humanoid.getNormalizedBoneNode('hips');
        this.state.startPoints.hipsY = hips.position.y;

        let min = Infinity;

        for (const boneKey in vrm.humanoid.humanBones) {
            const boneNode = vrm.humanoid.getNormalizedBoneNode(boneKey);
            if (boneNode) {
                const posy = boneNode.getWorldPosition(new THREE.Vector3()).y;
                min = Math.min(min, posy);
            }
        }

        this.state.startPoints.lowestY = min;
    }

    closeVRM() {
        if(!this.state.currentVrm) return;
        VRMUtils.deepDispose(this.state.currentVrm.scene);

        this.state.currentVrm = null;
        this.state.reverseSign = false;
        this.state.startPoints.hipsY = Infinity;
        this.state.startPoints.lowestY = Infinity;
        this.state.handPosed = 'default';
        //vrmAppState.pose = null;
    }
}

class environment3Class {
    constructor(optparams) {
        this.renderer = null;
        this.camera = null;
        this.controls = null;
        this.scene = null;
        this.light = null;
        this.clock = null;
        this.gridHelper = null;
        this.axesHelper = null;
        this.raycaster = null;
        this.mouse = null;

        this.models = [];
        this.currentModel = null;

        this.params = {
            width: Math.round(window.innerWidth * window.devicePixelRatio),
            height: Math.round(window.innerHeight * window.devicePixelRatio),
            aspect: 0,
            fov: 30,
            near: 0.1,
            far: 20,            
        }

        if(optparams.parentId) {
            const element = document.getElementById(optparams.parentId);
            this.params.width = element.offsetWidth * window.devicePixelRatio;
            this.params.height = element.offsetHeight * window.devicePixelRatio;
        }

        this.options = {
            parentId: optparams.parentId || '',
            singleModel: true,
        }

    }

    initEnvironment() {
        if(this.params.width <= 0 || this.params.height <= 0) {
            this.params.width = Math.round(window.innerWidth * window.devicePixelRatio);
            this.params.height = Math.round(window.innerHeight * window.devicePixelRatio);
        }
    
        this.params.aspect = this.params.width / this.params.height;
    
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.camera = new THREE.PerspectiveCamera(this.params.fov, this.params.aspect, this.params.near, this.params.far);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.scene = new THREE.Scene();
        this.light = new THREE.DirectionalLight(0xffffff, Math.PI);
        this.clock = new THREE.Clock();
        this.gridHelper = new THREE.GridHelper(10, 10);
        this.axesHelper = new THREE.AxesHelper(5);
    
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    
        this.setupEnvironment();
    }

    setupEnvironment() {
        this.renderer.setSize(this.params.width / window.devicePixelRatio, this.params.height / window.devicePixelRatio);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        if(this.options.parentId.length) {
            document.getElementById(this.options.parentId).appendChild(this.renderer.domElement);
        } else {
            document.body.appendChild(this.renderer.domElement);
        }

        this.camera.position.set(0.0, 1.0, 5.0);

        this.controls.screenSpacePanning = true;
        this.controls.target.set(0.0, 1.0, 0.0);
        this.controls.update();
        this.controls.saveState();

        this.light.position.set(1.0, 1.0, 1.0).normalize();
        this.scene.add(this.light);
        this.scene.add(this.gridHelper);
        this.scene.add(this.axesHelper);
        this.clock.start();
    }

    killEnvironment() {
        this.renderer.forceContextLoss?.();
        this.renderer.dispose?.();

        if(this.options.parentId.length) {
            document.getElementById(this.options.parentId).removeChild(this.renderer.domElement);
        } else {
            document.body.removeChild(this.renderer.domElement);
        }

        this.renderer = null;
        this.camera = null;
        this.controls = null;
        this.scene = null;
        this.light = null;
        this.clock = null;
        if(this.gridHelper) this.gridHelper.dispose();
        this.gridHelper = null;
        if(this.axesHelper) this.axesHelper.dispose();
        this.axesHelper = null;
        this.raycaster = null;
        this.mouse = null;
    }

    toggleGrid(active = null) {
        if (active === null) {
            this.gridHelper.visible = !this.gridHelper.visible;
        } else {
            this.gridHelper.visible = active;
        }
    }

    toggleAxes(active = null) {
        if (active === null) {
            this.axesHelper.visible = !this.axesHelper.visible;
        } else {
            this.axesHelper.visible = active;
        }
    }

    toggleControls(active = null) {
    if (active === null) {
        this.controls.enabled = !this.controls.enabled;
    } else {
        this.controls.enabled = active;
    }
}


    async loadVRMFromURL(url) {
        try {
            const response = await fetch(url);
            const buffer = await response.arrayBuffer();
            const vrm = await this.loadVRMFromBuffer(buffer);
            return vrm;
            
        } catch (err) {
            console.error("Failed to load VRM from URL:", err);
            return null;
        }
    }

    async loadVRMFromBuffer(buffer) {
        if (this.options.singleModel && this.currentModel) {
            if(this.currentModel.state.currentVrm) {
                this.scene.remove(this.currentModel.state.currentVrm.scene);
                this.currentModel.closeVRM();
                this.models.splice(this.currentModel.index, 1);
                this.currentModel = null;
            }
        }

        this.currentModel = new vrmHandler(this.models.length);
        this.models.push(this.currentModel);

        try {
            const vrm = await this.currentModel.loadFromBuffer(buffer);
            this.scene.add(vrm.scene);
            return vrm;
        } catch (err) {
            console.error("Failed to load VRM:", err);
            this.models.pop();
            this.currentModel = null;
            return null;
        }
    }

    captureView(w, h) {
        const gridstate = this.gridHelper.visible;
        const axesstate = this.axesHelper.visible;

        this.gridHelper.visible = false;
        this.axesHelper.visible = false;

        const owidth = this.renderer.domElement.width;
        const oheight = this.renderer.domElement.height;

        this.renderer.setSize(w / window.devicePixelRatio, h / window.devicePixelRatio, false);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();

        this.renderer.render(this.scene, this.camera); // make sure it’s freshly rendered
        const dataURL = this.renderer.domElement.toDataURL('image/png');

        this.renderer.setSize(owidth, oheight, false);
        this.camera.aspect = owidth / oheight;
        this.camera.updateProjectionMatrix();

        this.gridHelper.visible = gridstate;
        this.axesHelper.visible = axesstate;

        return dataURL;
    }

    captureModelOnly() {
        if(!this.currentModel) return null;
        if(!this.currentModel.state.currentVrm) return null;

        const gridstate = this.gridHelper.visible;
        const axesstate = this.axesHelper.visible;

        this.gridHelper.visible = false;
        this.axesHelper.visible = false;

        const vrmScene = this.currentModel.state.currentVrm.scene;
        // 1. Compute bounding box of model
        const bbox = new THREE.Box3().setFromObject(vrmScene);

        const corners = [
            new THREE.Vector3(bbox.min.x, bbox.min.y, bbox.min.z),
            new THREE.Vector3(bbox.min.x, bbox.min.y, bbox.max.z),
            new THREE.Vector3(bbox.min.x, bbox.max.y, bbox.min.z),
            new THREE.Vector3(bbox.min.x, bbox.max.y, bbox.max.z),
            new THREE.Vector3(bbox.max.x, bbox.min.y, bbox.min.z),
            new THREE.Vector3(bbox.max.x, bbox.min.y, bbox.max.z),
            new THREE.Vector3(bbox.max.x, bbox.max.y, bbox.min.z),
            new THREE.Vector3(bbox.max.x, bbox.max.y, bbox.max.z),
        ];

        // 2. Project to screen space
        const projectToScreen = (vec3) => {
            const projected = vec3.clone().project(this.camera);
            const widthHalf = this.renderer.domElement.width / 2;
            const heightHalf = this.renderer.domElement.height / 2;
            return {
                x: (projected.x * widthHalf) + widthHalf,
                y: -(projected.y * heightHalf) + heightHalf,
            };
        };


        const projected = corners.map(projectToScreen);

        const minX = Math.floor(Math.min(...projected.map(p => p.x)));
        const maxX = Math.ceil(Math.max(...projected.map(p => p.x)));
        const minY = Math.floor(Math.min(...projected.map(p => p.y)));
        const maxY = Math.ceil(Math.max(...projected.map(p => p.y)));

        const pad = 10;
        const cropX = Math.max(0, minX - pad);
        const cropY = Math.max(0, minY - pad);
        const cropW = Math.min(this.renderer.domElement.width, maxX - minX + pad * 2);
        const cropH = Math.min(this.renderer.domElement.height, maxY - minY + pad * 2);

        // 3. Render and crop
        this.renderer.render(this.scene, this.camera);

        const srcCanvas = this.renderer.domElement;
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = cropW;
        croppedCanvas.height = cropH;

        const ctx = croppedCanvas.getContext('2d');
        ctx.drawImage(
            srcCanvas,
            cropX, cropY, cropW, cropH, // source
            0, 0, cropW, cropH          // destination
        );

        this.gridHelper.visible = gridstate;
        this.axesHelper.visible = axesstate;

        const dataURL = croppedCanvas.toDataURL('image/png');
        return dataURL;
    }

    async captureKeyFrames(aname, w, h) {
        if(!this.currentModel) return null;
        if(!this.currentModel.state.currentVrm) return null;

        const frames = Anim.getAnimationFrames(aname);
        if(!frames) return null;

        const gridstate = this.gridHelper.visible;
        const axesstate = this.axesHelper.visible;
        const owidth = this.renderer.domElement.width;
        const oheight = this.renderer.domElement.height;
        const state = this.currentModel.state;
        
        this.renderer.setSize(w / window.devicePixelRatio, h / window.devicePixelRatio, false);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();

        this.gridHelper.visible = false;
        this.axesHelper.visible = false;

        const zip = new JSZip();
        for(let i=0; i<frames.length; i++) {
            Pose.applyPose(state, frames[i].pose);
            state.currentVrm.scene.updateMatrixWorld(true);
            await nextFrame();
            this.renderer.render(this.scene, this.camera);
            const dataURL = this.renderer.domElement.toDataURL('image/png');

            const filename = `frame_${i}.png`;
            zip.file(filename, dataURL.split(',')[1], { base64: true });
            await nextFrame();
        }

        this.renderer.setSize(owidth, oheight, false);
        this.camera.aspect = owidth / oheight;
        this.camera.updateProjectionMatrix();
        this.gridHelper.visible = gridstate;
        this.axesHelper.visible = axesstate;

        const blob = await zip.generateAsync({ type: 'blob' });
        return blob;
    }

    async captureSpriteSheet(aname, w, h) {
        if(!this.currentModel) return null;
        if(!this.currentModel.state.currentVrm) return null;

        const frames = Anim.getAnimationFrames(aname);
        if(!frames) return null;

        const gridstate = this.gridHelper.visible;
        const axesstate = this.axesHelper.visible;
        const owidth = this.renderer.domElement.width;
        const oheight = this.renderer.domElement.height;
        const state = this.currentModel.state;

        const spriteCanvas = document.createElement('canvas');
        const spriteDims = calcSpriteDimensions(frames.length, w, h);
        spriteCanvas.width = spriteDims.width;
        spriteCanvas.height = spriteDims.height;
        
        this.renderer.setSize(w / window.devicePixelRatio, h / window.devicePixelRatio, false);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();

        this.gridHelper.visible = false;
        this.axesHelper.visible = false;

        let x = 0, y = 0;
        for(let i=0; i<frames.length; i++) {
            Pose.applyPose(state, frames[i].pose);
            state.currentVrm.scene.updateMatrixWorld(true);
            await nextFrame();
            this.renderer.render(this.scene, this.camera);
            const ctx = spriteCanvas.getContext('2d');
            ctx.drawImage(
                this.renderer.domElement,
                0, 0, w, h, // source
                x, y, w, h  // destination
            );
            x += w;
            if(x >= spriteCanvas.width - 1) {
                x = 0;
                y += h;
            }

            await nextFrame();
        }

        this.renderer.setSize(owidth, oheight, false);
        this.camera.aspect = owidth / oheight;
        this.camera.updateProjectionMatrix();
        this.gridHelper.visible = gridstate;
        this.axesHelper.visible = axesstate;
        const dataURL = spriteCanvas.toDataURL('image/png');
        return dataURL;
    }

}

// environment helper functions -------------------------------------------------------
function nextFrame() {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function calcSpriteDimensions(numframes, sw, sh) {
    const scol = Math.ceil(Math.sqrt(numframes));
    let accum = 0, srow = 0;
    for(let i=0; i<numframes; i++) {
        accum += scol;
        srow++;
        if(accum >= numframes) break;
    }

    return {columns: scol, rows: srow, width: scol * sw, height: srow * sh}
}

//-------------------------------------------------------------------------------------

class environmentManager {
    constructor() {
        this.environments = [];
        this.active = null;
        this.poser = Pose;
        this.anim = Anim;
    }

    new(name, options = {}) {
        if(!name) {return {error: 'No name provided.  An environment name is required.'};}
        if(!name.length)  {return {error: 'No name provided.  An environment name is required.'};}
        if(this.environments.find(obj => obj.name === name)) {return {error: `Name ${name} already in use.`};}

        const environ = new environment3Class(options);
        environ.initEnvironment();
        this.environments.push({name: name, three: environ});
        this.active = this.environments[this.environments.length - 1].three;

        return {sucess: `${name} environment created.`};
    }

    getEnvironment(name = '') {
        let environ = this.active;
        if(name.length) {
            const index = this.environments.find(obj => obj.name === name);
            if(!index) {console.warn(`${name} environment not found`); return {width: 0, height: 0};}
            environ = this.environments[index].three;
        }
        return environ;
    }

    animate() {animate();}
    toggleGrid(active = null, name = '') {
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return;}
        environ.toggleGrid(active);
    }
    toggleAxes(active = null, name = '') {
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return;}
        environ.toggleAxes(active);
    }
    toggleControls(active = null, name = '') {
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return;}
        environ.toggleControls(active);
    }
    dimensions(name = '') {
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return {error: 'could not get environment', width: 0, height: 0};}
        return {width: environ.params.width, height: environ.params.height};
    }
    resetView(width, height, name = '') {
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return {error: 'could not get environment'};}
        environ.params.width = width;
        environ.params.height = height;
        environ.killEnvironment();
        environ.initEnvironment();
    }
    addDomListener(action, callback, name = '') {
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return {error: 'could not get environment'};}
        environ.renderer.domElement.addEventListener(action, callback);
        return {success: 'listener added'};
    }
    renderer(name = '') {
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return null;}
        return environ.renderer;
    }
    raycaster(name = '') {
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return null;}
        return environ.raycaster;
    }
    camera(name = '') {
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return null;}
        return environ.camera;
    }
    setCameraPosition(x, y, z, name = '') {
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return;}
        environ.controls.reset();
        environ.controls.update();
        environ.camera.position.set(x, y, z);
    }
    setTarget(target, name = '') {
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return;}
        environ.controls.target.set(target.x, target.y, target.z);
        environ.camera.lookAt(target);
        environ.controls.update();
    }
    cloneTarget(name = '') {
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return null;}
        return environ.controls.target.clone();
    }
    aspect(name = '') {
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return null;}
        return environ.params.aspect;
    }
    captureView(w, h, name = '') {
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return null;}
        return environ.captureView(w, h);
    }
    captureModelOnly(name = '') {
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return null;}
        return environ.captureModelOnly();
    }
    async captureKeyFrames(aname, w, h, name = '') {
        if(!Anim.animationExists(aname)) return null;
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return null;}
        const data = await environ.captureKeyFrames(aname, w, h);
        return data;
    }
    async captureSpriteSheet(aname, w, h, name = '') {
        if(!Anim.animationExists(aname)) return null;
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return null;}
        const data = await environ.captureSpriteSheet(aname, w, h);
        return data;
    }

    async loadVRMFromURL(url, name = '') {
        if(!url) {console.warn('no load url provided'); return null;}
        if(!url.length) {console.warn('no load url provided'); return null;}
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return null;}
        const vrm = await environ.loadVRMFromURL(url);
        return vrm;
    }

    async loadVRMFromBuffer(buffer, name = '') {
        if(!buffer) {console.warn('no load buffer provided'); return null;}
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return null;}
        const vrm = await environ.loadVRMFromBuffer(buffer);
        return vrm;
    }
    vrm(name = '') {
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return null;}
        if(!environ.currentModel) return null;
        return environ.currentModel.state.currentVrm;
    }
    vrmstate(name = '') {
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return null;}
        if(!environ.currentModel) return null;
        return environ.currentModel.state;
    }
    mirror(value, name = '') {
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return;}
        if(!environ.currentModel) return null;
        environ.currentModel.state.mirror = value;
    }
    grounded(value, name = '') {
        const environ = this.getEnvironment(name);
        if(!environ) {console.warn('Could not get environment'); return;}
        if(!environ.currentModel) return null;
        environ.currentModel.state.grounded = value;
        const vrmstate = this.vrmstate(name);
        if(!vrmstate) return;
        Pose.autoGroundHips(vrmstate);
    }
    head(name = '') {
        const vrm = this.vrm(name);
        if(!vrm) return null;
        return vrm.humanoid.getNormalizedBoneNode('head')
    }



    setPoses(data) {
        if(!data) {console.warn('No pose data provided'); return {error: 'no pose data provided'};}
        Pose.loadPosesObject(data);
    }
    poseList() {return Pose.getPoseList();}
    poseExists(pname) {return Pose.poseExists(pname);}
    addPoseFromCurrent(pname) {
        const state = this.vrmstate();
        if(!state) return;
        Pose.addPoseFromCurrent(state, pname);
    }
    rotatePart(bone, x, y, z, name = '') {
        const vrmstate = this.vrmstate(name);
        if(!vrmstate) return;
        Pose.rotatePart(vrmstate, bone, x, y, z);
    }
    resetPose(name = '') {
        const state = this.vrmstate(name);
        if(!state) return;
        Pose.resetModel(state);
    }
    applyPose(pname, name = '') {
        const state = this.vrmstate(name);
        if(!state) return;
        Pose.applyPose(state, pname);
    }
    setHandPosition(hpose, name = '') {
        const state = this.vrmstate(name);
        if(!state) return;
        Pose.handPosition(state, hpose);
    }
    handPosed(name = '') {
        const state = this.vrmstate(name);
        if(!state) return;
        return state.handPosed;
    }

    setAnimations(data) {
        if(!data) {console.warn('No animation data provided'); return {error: 'no animation data provided'};}
        Anim.loadAnimationsObject(data);
    }
    animationList() {return Anim.getAnimationList();}
    animationLoop(index) {return Anim.getAnimationLoop(index);}
    animationFrames(index) {return Anim.getAnimationFrames(index);}
    playAnimation(ani, name = '') {
        const state = this.vrmstate(name);
        if(!state) return;
        return Anim.playPoseAnimation(state, ani);
    }
    stopAnimation() {
        const state = this.vrmstate(name);
        if(!state) return;
        Anim.stopPoseAnimation(state);
    }

    vector3() {return new THREE.Vector3();}
    radToDeg(rad) {return THREE.MathUtils.radToDeg(rad);}

}


export const environVRM = new environmentManager(); 



function animate() {
    if(!environVRM.environments.length) return;
    requestAnimationFrame(animate);

    for(let i=0; i<environVRM.environments.length; i++) {
        const environ = environVRM.environments[i].three;
        if(!environ) continue;
        if(!environ.renderer || !environ.scene || !environ.camera) continue;

        if(environ.currentModel) {
            const vrm = environ.currentModel.state.currentVrm;
            if(vrm) {
                const delta = environ.clock.getDelta();
                vrm.update(delta);
                if(Anim.animationMixer) Anim.animationMixer.update(delta);
            }
        }
        environ.renderer.render(environ.scene, environ.camera);
    }
    
}