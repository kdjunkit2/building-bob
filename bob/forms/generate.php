
<div id='bobarea' style='display: none; width: 440px; height: 440px;' >
    <div id='bobviewer' style='width: 440px; height: 440px;' ></div>
    <div id='menubar'>
        <img src='../assets/mouth.png' id='mouth' class='iconbtn' height=30 title = "Voice"/>
        <img src='../assets/brain.png' id='brain' class='iconbtn' height=30 title = "Brain"/>
        <img src='../assets/books4.png' id='kbase' class='iconbtn' height=30 title = "Knowledge"/>
    </div>
</div>
<div id='genarea' style='display: none; vertical-align: top;'>
    <div id='stext' style='width: 445px; height: 440px; background-color: #52708a; padding: 5px; overflow: auto;'></div>

    <div id='genvoice' style='background: #24323d; padding: 10px; margin-top: 10px;'>
        <input type='text' id='uprompt' style="width: 325px;"  placeholder="Enter question here..." />
        <div id='generate' class='textbtn' style='margin-left: 20px;'>Enter</div>
    </div>

    <?php include 'forms/listen.php';?>
</div>