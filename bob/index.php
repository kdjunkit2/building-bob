<!-- <script src="https://cdn.jsdelivr.net/npm/lamejs/lame.min.js"></script>  for mp3 encoding -->
<!-- <script src="https://cdn.jsdelivr.net/npm/howler/dist/howler.min.js"></script> -->

<SCRIPT language="javascript" src="../shared/js/window.js"></SCRIPT> <!-- used for system popup windows and dragging windows -->
<SCRIPT language="javascript" src="../shared/js/general.js"></SCRIPT> <!-- has some useful general functions for array management -->
<SCRIPT language="javascript" src="../shared/js/local.js"></SCRIPT> <!-- useful functions for loading local files -->

<LINK rel="stylesheet" type="text/css" href="../shared/css/main.css" />
<LINK rel="stylesheet" type="text/css" href="../shared/css/ctrls.css" />

<body class='darkmode'>

<?php include '../shared/forms/header.php';?>

<div style='position:relative;'>
    <?php include 'forms/init.php';?>
    <?php include 'forms/generate.php';?>
</div>

<?php include '../shared/forms/mbo.php';?>
<?php include 'forms/dlg.php';?>
</body>

<!-- the import map in this format is requred for the three-vrm library to load from cdn -->
<script type="importmap">
    {
        "imports": {
            "three": "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
            "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/",
            "@pixiv/three-vrm": "https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@3/lib/three-vrm.module.min.js"
        }
    }
</script>

<SCRIPT language="javascript" src="index.js" type="module"></SCRIPT>
<SCRIPT language="javascript" src="js/workhandler.js"></SCRIPT> <!-- webworkers for AI models -->
<SCRIPT language="javascript" src="js/model.js"></SCRIPT> <!-- Model information used for selecting the main LLM brain -->

<LINK rel="stylesheet" type="text/css" href="forms/bob.css" />



<script type="module">
    import {appInit} from "./index.js";
    appInit();  // main entry point to the full example app of Bob
</script>