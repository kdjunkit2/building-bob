<!-- <script src="https://cdn.jsdelivr.net/npm/lamejs/lame.min.js"></script>  for mp3 encoding -->
<!-- <script src="https://cdn.jsdelivr.net/npm/howler/dist/howler.min.js"></script> -->

<SCRIPT language="javascript" src="../shared/js/window.js"></SCRIPT>
<SCRIPT language="javascript" src="../shared/js/general.js"></SCRIPT>
<SCRIPT language="javascript" src="../shared/js/local.js"></SCRIPT>

<LINK rel="stylesheet" type="text/css" href="../shared/css/main.css" />
<LINK rel="stylesheet" type="text/css" href="../shared/css/ctrls.css" />

<body class='darkmode'>
<?php
$host = $_SERVER['HTTP_HOST'];
$ROOT_URL = (str_contains($host, '127.0.0.1')) ? '/bobhub/' : '/';
?>
<?php include '../shared/forms/header.php';?>

<div style='position:relative;'>
    <?php include 'forms/init.php';?>
    <?php include 'forms/generate.php';?>
</div>

<?php include $_SERVER['DOCUMENT_ROOT'].'/bobhub/shared/forms/mbo.php';?>
<?php include 'forms/dlg.php';?>
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
<SCRIPT language="javascript" src="js/workhandler.js"></SCRIPT>
<SCRIPT language="javascript" src="js/model.js"></SCRIPT>

<LINK rel="stylesheet" type="text/css" href="forms/bob.css" />

<script type="module">
    import {appInit} from "./index.js";
    appInit();
</script>