<div id='inference' style='background-color: #2e3e4d; margin-top: 20px;'>
    <div id='playpanel' style='display: inline-block; vertical-align: top; padding: 10px; padding-bottom: 15px; width: 500px; border: 1px solid white; vertical-align: top;'>
        <div id='scoreboard' style='background-color: #628378; width: 500px;'>
            <div class='sbtitle' style='border: 1px solid white;'>BOB MEMORIAL FIELD</div>
            <div class='panel'>
                <div class='subpanel' style='border-right: 1px solid white; padding-right: 30px;'><div class='group'>
                    <div class='sbtitle'>HOME</div>
                    <select id='homescore' class=big></select>
                </div></div>
                <div class='subpanel' style='margin: 10px;'>
                    <select id='clockmin' class='huge'></select>
                    <div class='sblabel'>:</div>
                    <select id='clocksec' class='huge'></select>
                </div>
                <div class='subpanel' style='border-left: 1px solid white; padding-left: 30px;'><div class='group'>
                    <div class='sbtitle'>OPP</div>
                    <select id='oppscore' class=big></select>
                </div></div>
            </div>
        
            <div class='panel'>
                <div class='subpanel'>
                    <div class='group'>
                        <div class='sblabel'>DOWN</div>
                        <select id='down' class='small'>
                            <option value=1>1st</option>
                            <option value=2>2nd</option>
                            <option value=3>3rd</option>
                            <option value=4>4th</option>
                        </select>
                    </div>
                </div>
                <div class='subpanel'>
                    <div class='group'>
                        <div class='sblabel'>TO GO</div>
                        <select id='distance' class='small'></select>
                    </div>
                </div>
                <div class='subpanel' style='margin-left: 30px; margin-top: 10px; margin-right: 30px;'>
                    <img src='images/football_c.png' height=50 />
                </div>
                <div class='subpanel'>
                    <div class='group'>
                        <div class='sblabel'>BALL ON</div>
                        <div id='ballon' class='lights'>20</div>
                    </div>
                </div>
                <div class='subpanel'>
                    <div class='group'>
                        <div class='sblabel'>QTR</div>
                        <select id='quarter' class='small'>
                            <option value=1>1</option>
                            <option value=2>2</option>
                            <option value=3>3</option>
                            <option value=4>4</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
        <div style='position: relative;'>
            <img src='images/field_s2.png' id='fieldimg' />
            <div id='ballpos' style='position: absolute; left: 132px; top: 110px;'><img src='images/ball_football.png' /></div>
            <div id='callplay' class='hand' style='position: absolute; left: 400; top: 175px;'><img src='images/callplay.png' height=64 title='Call Play' /></div>
        </div>
        <img src='images/train.png' id='gototrain' class='iconbtn' width=30 style='position: absolute; top: 10px; left: 10px;' title='Train Model' />
    </div>

    <div id='coachpanel' style='display: inline-block; vertical-align: top;'>
        <div class='paneltight'>
            <img src='images/sal-coach.png' height=125 />
            <div class='subpanel'>
                <div id='rhresult' class='result'></div>
                <div id='rhcall' class='call'></div>
            </div>
            <div class='tagline' style='postion: absolute;'><i>Coach Sal: Three yards and a cloud of dust — that's real football.</i></div>
        </div>
        <div class='paneltight'>
            <img src='images/bob-coach.png' height=125 />
            <div class='subpanel'>
                <div id='balresult' class='result'></div>
                <div id='balcall' class='call'></div>
            </div>
            <div class='tagline' style='postion: absolute;'><i>Coach Bob: It's all about balance — mix it up, keep 'em guessing.</i></div>
        </div>
        <div class='paneltight'>
            <img src='images/rob-coach.png' height=125 />
            <div class='subpanel'>
                <div id='phresult' class='result'></div>
                <div id='phcall' class='call'></div>
            </div>
            <div class='tagline' style='postion: absolute;'><i>Air Raid Rob: Why run when you can throw it all over the yard?</i></div>
        </div>
    </div>
</div>