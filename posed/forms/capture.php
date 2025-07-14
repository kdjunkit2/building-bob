<div id='cappanel' style='display: none; background: #374a5c; padding: 5px; border-bottom: 1px solid #1b252e; padding-bottom: 5px; margin-bottom: 5px;'>
    <div class='lmtext' style='position: relative; vertical-align: middle;'><i>Capture</i></div>  
    <img src='../assets/check3.png' id='docapture' class='iconbtn' height=30 title='Capture' />
    <div id='cappose' style='display: none; padding: 10px;'>
        <div class='ltext' style='margin-bottom: 10px;'>Pose: </div>
        <select id='capposelist'></select><br>
        <label class="container">Rendered screen
            <span id='caprend'></span>
            <input type="radio" checked="checked" name="capscreen" value='rendered'>
            <span class="checkmark"></span>
        </label>
        <label class="container">Full HD (1980 x 1080)
            <input type="radio" name="capscreen" value='fullhd'>
            <span class="checkmark"></span>
        </label>
        <label class="container">Square (512x512)
            <input type="radio" name="capscreen" value='square'>
            <span class="checkmark"></span>
        </label>
        <label class="container">Model only
            <input type="radio" name="capscreen" value='model'>
            <span class="checkmark"></span>
        </label>
    </div>

    <div id='capani' style='display: none; padding: 10px;'>
        <div class='ltext' style='margin-bottom: 10px;'>Animation: </div>
        <select id='capanilist'></select><br>
        <label class="container">Key frames (png zipped)
            <span id='caprenda'></span>
            <input type="radio" checked="checked" name="capaniscreen" value='keyframe'>
            <span class="checkmark"></span>
        </label>
        <label class="container">Key frame sprite sheet (256x256)
            <input type="radio" name="capaniscreen" value='sprite'>
            <span class="checkmark"></span>
        </label>
    </div>   
</div>