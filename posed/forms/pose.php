<div id='posepanel' style='display: none; background: #374a5c; padding: 5px;'>
    <div class='lmtext' style='position: relative; vertical-align: middle;'><i>Poses</i></div>
    <img src='../assets/undo.png' id='resetmdl' class='iconbtn' height=30 title='Reset Model' />
    <img src='../assets/hand.png' id='handpos' class='iconbtn' height=30 title='Toggle Hand Positions' />
    <img src='../assets/add2.png' id='addposeshow' class='iconbtn' height=30 title='Add to Poses' />
    <div style='border-top: 1px solid #49637a; margin-top: 10px; padding-top: 10px;'>
        <div class='ltext'>Bones:</div>
        <select id='selbones'></select>
        <div class='ctrli'><label class='ltext' style='position:relative; top:2px;'>Mirror </label><label class="switch">&nbsp<input type="checkbox" id='mirror'><span class="tswitch"></span></label></div>
    </div>
    <div class='ltext'>Rotation</div><br>
    <div style='margin-bottom: 5px;'>
        <div id='rotxlbl' class='ltext hand' style='color: #ff0000;'>X:</div>
        <INPUT TYPE="NUMBER" id='rotx' MIN="0" MAX="359" VALUE="0" SIZE="3">
        <div class='ctrli' style='width:150px; margin-left: 5px;'>
            <input type='range' id='rotxslider' class='slider' min='0' max='359' value='0' />
        </div>
    </div>
    <div style='margin-bottom: 5px;'>
        <div id='rotylbl' class='ltext hand' style='color: #00ff00;'>Y:</div>
        <INPUT TYPE="NUMBER" id='roty' MIN="0" MAX="359" VALUE="0" SIZE="3">
        <div class='ctrli' style='width:150px; margin-left: 5px;'>
            <input type='range' id='rotyslider' class='slider' min='0' max='359' value='0' /> 
        </div>
    </div>
    <div style='margin-bottom: 5px;'>
        <div id='rotzlbl' class='ltext hand' style='color: #0000ff;'>Z:</div>
        <INPUT TYPE="NUMBER" id='rotz' MIN="0" MAX="359" VALUE="0" SIZE="3">
        <div class='ctrli' style='width:150px; margin-left: 5px;'>
            <input type='range' id='rotzslider' class='slider' min='0' max='359' value='0' />
        </div>
    </div>
    <div class='ctrl'><label class='ltext' style='position:relative; top:2px;'>Grounded </label><label class="switch">&nbsp<input type="checkbox" id='grounded'><span class="tswitch"></span></label></div>
    <div id='addposepanel' style='display: none; margin-top: 5px; margin-bottom: 10px;'>
        <div class='ltext' style='position: relative; vertical-align: middle;'><i>Pose Name:</i></div>
        <input type='text' id='posename' maxlength=16 style='width: 150px;' />
        <img src='../assets/check3.png' id='addpose' class='iconbtn' height=20 title='Add Pose' />
        <img src='../assets/x2.png' id='canceladdpose' class='iconbtn' height=20 title='Cancel Add' />
    </div>
    <div id='applyposepanel' style='margin-top: 5px; margin-bottom: 10px;'>
        <div class='ltext' style='position: relative; vertical-align: middle;'><i>Apply Pose:</i></div>
        <select id='poselist' style='width: 200px;'></select>
    </div>
</div>