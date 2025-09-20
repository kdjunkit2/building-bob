<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>

<SCRIPT language="javascript" src="../../shared/js/window.js"></SCRIPT> <!-- used for system popup windows and dragging windows -->
<SCRIPT language="javascript" src="../../shared/js/general.js"></SCRIPT> <!-- has some useful general functions for array management -->
<SCRIPT language="javascript" src="../../shared/js/local.js"></SCRIPT> <!-- useful functions for loading local files -->

<LINK rel="stylesheet" type="text/css" href="../../shared/css/main.css" />
<LINK rel="stylesheet" type="text/css" href="../../shared/css/ctrls.css" />

<body class='darkmode'>

<?php include '../../shared/forms/header.php';?>

<div style='position:relative;'>
    <?php include 'forms/main.php';?>
    <?php include 'forms/inference.php';?>
    <?php include 'forms/visualizer.php';?>
    <?php include 'forms/train.php';?>
</div>

<?php include '../../shared/forms/mbo.php';?>
</body>

<SCRIPT language="javascript" src="index.js" type="module"></SCRIPT>
<SCRIPT language="javascript" src="js/vae.mjs" type="module"></SCRIPT> <!-- class for Tensorflow.js Variational Autoencoder (VAE) model -->

<script type="module">
    import {appInit} from "./index.js";
    appInit();  // main entry point to the full example app of Bob
</script>