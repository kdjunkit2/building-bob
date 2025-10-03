
<LINK rel="stylesheet" type="text/css" href="./shared/css/main.css" />
<LINK rel="stylesheet" type="text/css" href="./shared/css/ctrls.css" />

<body class='darkmode'>

<?php include './shared/forms/header.php';?>

<!-- ===================================== GENERAL =============================================== -->
<br>
<div id='mpanel1' class='appPanel child'>
    <div id='posed' class='appPanelItem hand' onclick="window.location.href='posed'">
        <img src='/assets/run1.png' style='position:relative; top:5px;' draggable='false' />
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

<div id='mpanel2' class='appPanel child'>
    <div id='bob' class='appPanelItem hand' onclick="window.location.href='bob'">
        <img src='/assets/magic.png' style='position:relative; top:5px;' draggable='false' />
        <span style='position:relative; top:0px;'>FlexiBob</span>
    </div>
    <div style='position:relative; top:10px;'>
        <span class='techmid3l'>Making Bob more dynamic</span><br>
        <ul class='techbasic3m' style="padding-left:30px">
            <li>FAQ and text context knowledge</li>
            <li>Few shot persona context</li>
            <li>Small LLMs with GPU support</li>
        </ul>
    </div>
</div>

<div id='mpanel3' class='appPanel child'>
    <div id='resources' class='appPanelItem hand' onclick="window.location.href='docs'">
        <img src='/assets/books4.png' style='position:relative; top:5px;' draggable='false' />
        <span style='position:relative; top:0px;'>Resources</span>
    </div>
    <div style='position:relative; top:10px;'>
        <span class='techmid3l'>Building Bob</span><br>
        <ul class='techbasic3m' style="padding-left:30px">
            <li>Episode links to videos for Building Bob series</li>
        </ul>
    </div>
</div>
<br><br>
<div class='h2title'><i>Extras</i></div>
<div id='mpanel4' class='appPanel child'>
    <div id='coach' class='appPanelItem hand' onclick="window.location.href='extra/coach'">
        <img src='/assets/football.png' style='position:relative; top:5px;' draggable='false' />
        <span style='position:relative; top:0px;'>Coach</span>
    </div>
    <div style='position:relative; top:10px;'>
        <span class='techmid3l'>Coach Bob & Friends</span><br>
        <ul class='techbasic3m' style="padding-left:30px">
            <li>MLP training</li>
			<li>AI classifier</li>
			<li>Football play calling styles</li>
        </ul>
    </div>
</div>

<div id='mpanel5' class='appPanel child'>
    <div id='coach' class='appPanelItem hand' onclick="window.location.href='extra/players'">
        <img src='/assets/football.png' style='position:relative; top:5px;' draggable='false' />
        <span style='position:relative; top:0px;'>Players</span>
    </div>
    <div style='position:relative; top:10px;'>
        <span class='techmid3l'>Player Generator</span><br>
        <ul class='techbasic3m' style="padding-left:30px">
            <li>Synthetic players from VAE</li>
			<li>VAE training</li>
			<li>VAE Sampling</li>
        </ul>
    </div>
</div>

<div id='mpanel5' class='appPanel child'>
    <div id='coach' class='appPanelItem hand' onclick="window.location.href='extra/classify'">
        <img src='/assets/classify.png' style='position:relative; top:5px;' draggable='false' />
        <span style='position:relative; top:0px;'>Classifier</span>
    </div>
    <div style='position:relative; top:10px;'>
        <span class='techmid3l'>Text Classifier</span><br>
        <ul class='techbasic3m' style="padding-left:30px">
            <li>Multi-layer Perceptrons (MLP)</li>
			<li>Brain.js neural networks</li>
			<li>GPU support</li>
			<li>Text embedding</li>
			<li>Text classification</li>
        </ul>
    </div>
</div>

</body>
<SCRIPT language="javascript" src="index.js"></SCRIPT>
<script>
    appInit();
</script>