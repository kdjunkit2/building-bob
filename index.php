
<LINK rel="stylesheet" type="text/css" href="./shared/css/main.css" />
<LINK rel="stylesheet" type="text/css" href="./shared/css/ctrls.css" />

<body class='darkmode'>

<?php include './shared/forms/header.php';?>

<!-- ===================================== GENERAL =============================================== -->
<br>
<div id='mpanel1' class='appPanel child'>
    <div id='posed' class='appPanelItem hand' onclick="window.location.href='posed'">
        <img src='./assets/run1.png' style='position:relative; top:5px;' draggable='false' />
        <span style='position:relative; top:0px;'>PosEd</span>
    </div>
    <div style='position:relative; top:10px;'>
        <span class='techmid3l'>VRM poser & animator</span><br>
        <ul class='techbasic3m' style="padding-left:30px">
            <li>Load VRM models</li>
            <li>Save poses & animations (json)</li>
            <li>Export poses & animations</li>
        </ul>
    </div>
</div>

<div id='mpanel4' class='appPanel child'>
    <div id='mdlbuilder' class='appPanelItem hand' onclick="window.location.href='bob'">
        <img src='./assets/magic.png' style='position:relative; top:5px;' draggable='false' />
        <span style='position:relative; top:0px;'>FlexiBob</span>
    </div>
    <div style='position:relative; top:10px;'>
        <span class='techmid3l'>Making Bob more dynamic</span><br>
        <ul class='techbasic3m' style="padding-left:30px">
            <li>Change knowledge</li>
            <li>Change AI models</li>
            <li>Change voices</li>
        </ul>
    </div>
</div>

</body>
<SCRIPT language="javascript" src="index.js"></SCRIPT>
<script>
    appInit();
</script>