<div id='braindlg' class='bobdlg' style="display: none;">
    <div id='gpumsg' class='ltext'></div><br>
    <div class='ltext' style='margin-bottom: 30px;'>The first time you load a model, it may take awhile.  The models are stored in the browser cache which will speed up future loads unless the model has been removed from the cache.</div>
    <div class='ctrl' style='margin-bottom: 15px;'><label class='ltextw' style='position:relative; top:2px;'>Give Bob extra brain power: </label><label class="switch">&nbsp<input id='usellm' type="checkbox"><span class="tswitch"></span></label></div>
    <div class='ltextw'>Select Bob's extra brain power:</div>
    <br>
    <select id='selmdl' disabled style='width:450px; height:50px; vertical-align:top;'></select>
    <div id='mdldesc' class='ltext' style='display:inline-block; position: relative; width:550px; top: -2px;'></div><br>
    <div id='llmprogress' class='progress' style='display: none; margin-bottom: 5px;'></div>

    <div id='brainaction' class='ctextbtn' style='display: block; margin-top: 10px; margin-bottom: 10px;'>Cancel</div>
</div>

<div id='kbdlg' class='bobdlg' style="display: none;">
    <div id='fbasearea' style='margin-bottom: 15px;'>
        <div class='ltext16'>FAQ (*.csv)</div>
        <img src='../assets/rotate1.png' id='faqreplace' class='iconbtn' height=20 title = "Replace FAQ"/>
        <div id='faqlist' class='boblist' style='height: 30px;'></div>
    </div>
    <div id='ibasearea'>
        <div class='ltext16'>Information (*.txt)</div>
        <img src='../assets/add3.png' id='kbaseadd' class='iconbtn' height=20 title = "Add Info"/>
        <img src='../assets/x4.png' id='kbaseremove' class='iconbtn' height=20 title = "Remove Selected Info"/>
        <img src='../assets/cancel3.png' id='kbasewipe' class='iconbtn' height=20 title = "Wipe Info"/>
        <div id='infolist' class='boblist' style='height: 200px;'></div>
    </div>
    <div id='kbdone' class='ctextbtn' style='display: block; margin-top: 10px; margin-bottom: 10px;'>Done</div>
    <div id='kbprogress' class='progress' style='display: none;'></div>
</div>

<div id='voicedlg' class='bobdlg' style="display: none;">
    <div class='ctrli' style='height:30px;'><label class='ltextw' style='position:relative; top:2px;'>Voice: </label><label class="switch">&nbsp<input id='togglevoice' type="checkbox" checked><span class="tswitch"></span></label></div>
    <div id='voice' style='background: #24323d; padding: 10px;'>
        <div class='ltext' id='genderlbl' style='width:50px; display: none;'>Female </div>
        <input type='range' id='gender' class='slider' style='width:50px; display: none;' min='0' max='1' value='1'/>
        <label class='ltext' id='gender2lbl' style='width:40px; text-align:right;  display: none;'>Male</label>

        <div class='ltext' id='langlbl' style='width:40px;'>US </div>
        <input type='range' id='language' class='slider' style='width:50px;' min='0' max='1' value='0'/>
        <label class='ltext' id='lang2lbl' style='width:40px; text-align:right;'>GB</label>

        <select id='voicelist' style='margin-left: 20px;'></select>
    </div>
    <div id='genvoice' style='background: #24323d; padding: 10px; margin-top: 10px;'>
        <div class='ltext' id='fmtlbl' style='width:40px; display: none;'>WAV </div>
        <input type='range' id='format' class='slider' style='width:50px; display: none;' min='0' max='1' value='0'/>
        <label class='ltext' id='fmt2lbl' style='width:40px; text-align:right; display: none;'>MP3</label>
    </div>
    <div id='mouthdone' class='ctextbtn' style='display: block; margin-top: 10px; margin-bottom: 10px;'>Done</div>
</div>