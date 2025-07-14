# 🧠 Building Bob

**Building Bob** is a modular, browser-based AI character platform that brings virtual avatars to life without relying on Unity, cloud APIs, or heavy infrastructure. It combines lightweight local models, VRM avatar rendering, and a flexible architecture to explore expressive AI interaction — all in your browser.

This project is an evolving personal journey in building approachable, local-first AI systems with a creative twist. Bob isn’t just a character — he’s a demonstration of what’s possible when you combine local inference, real-time visuals, and smart fallback logic into a cohesive personality engine.

---

## 🎯 Project Goals

- **Modular**: Support different tools (posing, animation, chat) in loosely coupled ways
- **Local-first**: All core logic runs in the browser — no servers required
- **Creative**: Encourage playful interaction with avatars as expressive agents
- **Lightweight**: Run on mid-spec devices with fallback options for lower performance setups

---

## 🗂️ Included Components

### [`posed/`](posed/)
**PosEd**: A VRM pose editor supporting:
- Bone manipulation (click + rotate)
- Pose saving/loading
- Sprite sheet or frame capture
- Fixed-frame and centered capture modes for 2D use

### [`bob/`](bob/)
**FlexiBob**: The latest version of the interactive avatar system. It includes:
- Character-specific FAQ and personality fallback
- Few-shot prompting with similarity-based example selection
- Optional TTS using [Kokoro.js]([https://github.com/teticio/kokoro](https://github.com/hexgrad/kokoro)) (via CDN)
- Support for both GPU and CPU LLM inference
    - WebLLM (GPU/WebGPU) or
    - Transformers.js (ONNX, CPU fallback)

### [`shared/`](shared/)
Core modules shared between apps:
- VRM environment and animation logic
- Pose and animation handling
- Embedding and LLM glue code with webworkers for non-thread blocking inference

---

## 🚀 Running Locally

1. Clone this repo or download the ZIP
2. Place it under your local server root (e.g., `C:\xampp\htdocs\building-bob\`)
3. Open a browser and navigate to:  
   `http://localhost/building-bob/`

> No install scripts required — just open and go.

---

## ⚙️ Requirements

- A modern browser (Chrome has been the testing environment)
- WebGPU support **optional**  
  - Fallback to [transformers.js](https://huggingface.co/docs/transformers.js/index) allows CPU-only use

---

## 📦 Features Summary

| Feature             | Description                                         |
|---------------------|-----------------------------------------------------|
| VRM Support         | Loads `.vrm` models using Three.js + three-vrm     |
| Posing              | Drag, rotate, and mirror bones in PosEd            |
| Sprite Export       | Capture sprite sheets or frame sequences           |
| LLM Chat            | GPU (WebLLM) or CPU (Transformers.js) inference    |
| Personality System  | Few-shot prompting with embedded FAQ knowledge     |
| TTS (Optional)      | Kokoro.js speech synthesis (uses WebAudio)         |
| No Cloud Required   | 100% local browser operation — no backend          |

---

## 🔗 Credits & Libraries

- [three.js](https://threejs.org/) & [three-vrm](https://github.com/pixiv/three-vrm)
- [WebLLM](https://github.com/mlc-ai/web-llm)
- [Transformers.js](https://huggingface.co/docs/transformers.js/index)
- [Kokoro.js]([https://github.com/teticio/kokoro](https://github.com/hexgrad/kokoro)) (via CDN: `jsdelivr`)
- [ONNX Runtime Web](https://onnxruntime.ai/docs/build/web.html)
- [JSZip](https://stuk.github.io/jszip/) for export packaging

---

## 📅 Project Status

This is an active and evolving project. Future improvements may include:
- Expression editor (per-frame and triggered)
- Emotion-aware responses and animation
- Lightweight NPC system for embedding in games
- Command system for in app AI avatar help assistance

---

## 🔐 License

This project is licensed under the [MIT License](LICENSE).

Model, voice, and VRM files may have separate licenses — please check the `assets/` folder or model source before redistribution.

---

## 🙋 Want to Contribute or Fork?

Feel free! While this is a personal hobby project, you're welcome to reuse any part of it. PRs and forks are encouraged — especially if you’re building your own expressive agents or improving local model workflows.  Please share any improvements or projects related to this repository.

