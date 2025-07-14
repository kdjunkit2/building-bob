<div id='anipanel' style='display: none; background: #374a5c; padding: 5px;'>
    <div class='lmtext' style='position: relative; vertical-align: middle;'><i>Animations</i></div>
    <select id='anilist'></select><br>
    <div id='animenu' style='border-top: 1px solid #49637a; margin-top: 10px; padding-top: 10px;'>
        <img src='../assets/pencil.png' id='editani' class='iconbtn' height=30 title='Edit Animation' />
        <img src='../assets/add2.png' id='addani' class='iconbtn' height=30 title='New Animation' />
        <img src='../assets/play2.png' id='startanimation' class='iconbtn' height=30 title='Play Animation' />
        <img src='../assets/stop2.png' id='stopanimation' class='iconbtn' height=30 style='display: none;' title='Stop Animation' />
    </div>
    <div id='aniactioncontainer' style='display: none; margin-top: 5px; margin-bottom: 10px;'>
        <div id='aniaction' class='ltext'></div>
        <input type='text' id='aniname' size=16 maxlength=16 />
    </div>
    <div id='newani' style='display:none;'>
        <div class='ltext'>Frames</div>
        <img src='../assets/add2.png' id='addaniframe' class='iconbtn' height=15 title='Add Frame' />
        <div class='ctrli'><label class='ltext' style='position:relative; top:2px;'>Loop </label><label class="switch">&nbsp<input type="checkbox" id='frameloop'><span class="tswitch"></span></label></div>
        <br>
        <div id='aniframes' style='height: 100px; overflow: auto; border-top: 1px solid #6f899f; margin-top: 5px; padding: 5px;'></div>
        <br>
        <img src='../assets/check3.png' id='updateani' class='iconbtn' height=20 title='Update Animation' />
        <img src='../assets/x2.png' id='cancelani' class='iconbtn' height=20 title='Update Animation' />
    </div>
</div>