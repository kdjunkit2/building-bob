<script src="//unpkg.com/brain.js"></script>

<SCRIPT language="javascript" src="../../shared/js/window.js"></SCRIPT> <!-- used for system popup windows and dragging windows -->
<SCRIPT language="javascript" src="../../shared/js/general.js"></SCRIPT> <!-- has some useful general functions for array management -->
<SCRIPT language="javascript" src="../../shared/js/local.js"></SCRIPT> <!-- useful functions for loading local files -->

<LINK rel="stylesheet" type="text/css" href="../../shared/css/main.css" />
<LINK rel="stylesheet" type="text/css" href="../../shared/css/ctrls.css" />

<body class='darkmode'>

<?php include '../../shared/forms/header.php';?>

<div style='position:relative;'>
    <div style='width: 500px;'><div id='eprogress' class='progress' style='margin-bottom: 5px;'></div></div>
    <?php include 'forms/main.php';?>
    <?php include 'forms/train.php';?>
    <?php include 'forms/run.php';?>
</div>

<?php include '../../shared/forms/mbo.php';?>
</body>

<SCRIPT language="javascript" src="index.js" type="module"></SCRIPT>
<SCRIPT language="javascript" src="js/workhandler.js"></SCRIPT> <!-- webworker for Brain.js -->
<LINK rel="stylesheet" type="text/css" href="forms/classify.css" />

<script type="module">
    import {appInit} from "./index.js";
    appInit();  // main entry point to the full example app of Bob
</script>