
const sysDevices = {
    initialized: false,
    gpu: {available: false, adapter: null, gl2: false},
    cpu: {logicalCores: 0},

}

// ------------------------------------- SUPPORTING FUNCTIONS

async function getGPU() {
    sysDevices.gpu.available = false;
    if(!navigator.gpu) return true;

    try {
        let gpuadapter = await navigator.gpu.requestAdapter();
        if(gpuadapter) {
            sysDevices.gpu.available = true;
            sysDevices.gpu.adapter = gpuadapter;
        }
        return true;
    } catch (e) {
        sysDevices.gpu.available = false; 
        sysDevices.gpu.adapter = null;
        console.log('adapter error');
    }
    return false;
}

export async function sysDevicesInitialize() {
    await getGPU();
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) {sysDevices.gpu.gl2 = false;} 
    else {sysDevices.gpu.gl2 = true;}
    sysDevices.cpu.logicalCores = navigator.hardwareConcurrency;
    sysDevices.initialized = true;
    return sysDevices;
}