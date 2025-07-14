<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>

<SCRIPT language="javascript" src="../shared/js/window.js"></SCRIPT>
<SCRIPT language="javascript" src="../shared/js/local.js"></SCRIPT>
<SCRIPT language="javascript" src="../shared/js/general.js"></SCRIPT>

<LINK rel="stylesheet" type="text/css" href="../shared/css/main.css" />
<LINK rel="stylesheet" type="text/css" href="../shared/css/ctrls.css" />

<body class='darkmode'>
<?php
$host = $_SERVER['HTTP_HOST'];
$ROOT_URL = (str_contains($host, '127.0.0.1')) ? '/bobhub/' : '/';
?>
<?php include '../shared/forms/header.php';?>

<div style='position:relative;'>
    <div id='mstatus' class='ltext'></div>
    <br>
    <div id='loadvrm' class='textbtn2'>Load VRM</div>
    <img src='../assets/folder.png' id='loadaniposes' class='iconbtn' title='Load Poses & Animations' />
    <img src='../assets/save.png' id='saveaniposes' class='iconbtn' title='Save Poses & Animations' />
    <img src='../assets/3d.png' id='evironment' class='iconbtn' title='Evironment' style='margin-left: 10px;' />
    <div id='mdlopts' style='display: none;'>
        <img src='../assets/video.png' id='camview' class='iconbtn' title='Set Camera Position' />
        <img src='../assets/run1.png' id='posing' class='iconbtn' title='Posing' />
        <img src='../assets/run2.png' id='animation' class='iconbtn' title='Animation' />
        <img src='../assets/grid1.png' id='grid' class='iconbtn' title='Toggle Grid' />
        <img src='../assets/cube2.png' id='axes' class='iconbtn' title='Toggle Axes' />
        <img src='../assets/camera.png' id='capture' class='iconbtn' title='Pose Capture' />
        <img src='../assets/action.png' id='anicapture' class='iconbtn' title='Animation Capture' />
    </div>
    <?php include 'forms/panels.php';?>
</div>

<input type="file" id="vrmFileInput" accept=".vrm" style='display: none;' />
<input type="file" id="aniposeLoadFile" accept=".json" style="display:none;" />
<?php include $_SERVER['DOCUMENT_ROOT'].'/sys/forms/mbo.php';?>
</body>

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
<SCRIPT language="javascript" src="js/panels.js"></SCRIPT>

<script type="module">
    import {appInit} from "./index.js";
    appInit();
</script>
