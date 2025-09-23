<div id='train' style='display: none; vertical-align: top;'>
    <div id='trainsteps' class='menublock'>
        <div style='border-bottom: 2px solid #abc0d1; padding-bottom: 10px;'>
            <img src='/assets/left.png' id='mainfromtrain' class='iconbtn' title="Back to Main Menu" />
            <img src='/assets/rotate1.png' id='restarttrain' class='iconbtn' title="Restart from Load" />
        </div>
        <br>
        <div id='sdata' class='step' style='border: 3px solid #abc0d1;'>
            <img src='assets/data.png' style='position:relative; top:5px; width: 40px;' draggable='false' />
            <div style='margin-top: 3px; color: #abc0d1;'>1: Data</div>
        </div>
        <div id='strain' class='step'>
            <img src='assets/trainl.png' style='position:relative; top:5px; width: 40px;' draggable='false' />
            <div style='margin-top: 3px; color: #abc0d1;'>2: Train</div>
        </div>
    </div>
    <div id='datapanel' class='cpanel'>
        <div class='ctrli' style='height:30px;'><label class='ltextw' style='position:relative; top:2px;'>Has headers: </label><label class="switch">&nbsp<input id='hasheaders' type="checkbox"><span class="tswitch"></span></label></div>
        <br><br>
        <div class='ltext'>Data should be two columns with text strings in column 1 and the labels in column 2</div>
        <br><br>
        <img src='assets/open.png' id='loaddata' class='iconbtn' width=70 title="Open CSV"/>
        <div style='display: inline-block; vertical-align: top;'>
            <div id='filename' class='ltext'></div><br>
            <div id='records' class='ltext'></div><br>
            <div id='fields' class='ltext'></div>
        </div>
        <div id='embeddata' class='ctextbtn' style='display: none;'>Embed Data</div>
        <div id='embedprogress' class='progress' style='margin-top: 10px;'></div>
    </div>
    <div id='trainpanel' class='cpanel' style='display: none;'>
        <div class='ltext' style='width: 200px; margin-top: 5px;'>Iterations:</div><input type='number' id='iterations' step=1000 style='width: 100px;' /><br>
        <div class='ltext' style='width: 200px; margin-top: 5px;'>Error Threshold:</div><input type='number' id='errort' step=0.001 style='width: 100px;' /><br>
        <div class='ltext' style='width: 200px; margin-top: 5px;'>Learning Rate:</div><input type='number' id='learnr' step=0.01 style='width: 100px;' /><br>
        <div class='ltext' style='width: 200px; margin-top: 5px;'>Hidden Layers (comma separated):</div><input type='text' id='hidden' style='width: 100px;' /><br>
        <div id='traindefaults' class='ctextbtn' style='margin-top: 10px;'>Reset Defaults</div>
        <br><br>
        <img src='assets/train.png' id='trainmodel' class='iconbtn' width=70 title="Train Model"/>
        <div id='tstatus' class='ltext' style='width: 250px; margin-top: 10px;' ></div>
        <br><br>
        <div id='modelopts' style='display: none; padding: 5px; background-color: #49637a;'>
            <img src='/assets/save.png' class='iconbtn' id='savemdl' title='Save Model' />
            <img src='/assets/run1.png' class='iconbtn' id='runmdl' title='Run Model'/>
        </div>
    </div>
</div>