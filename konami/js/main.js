var trackUrl = 'https://soundcloud.com/dreamperfectregime/eung-freestyle-live-sik-k-punchnello-owen-ovadoz-flowsik';

var Visualizer = function() {
    var city;
    var sixSize;
    var audioSource;
    var containerId = 'wavy';
    var cityId = 'city';
    var fgCanvas;
    var fgCtx;
    var bgCanvas;
    var bgCtx;
    var sixes = [];

    function Six(sixSize, ctx, index) {
        this.sixSize = sixSize;
        this.high = 0; // the highest colour value, which then fades out
        this.index = index;
        this.decay = this.index > 20 ? 1.5 : 4;
        this.ctx = ctx;
    }
    Six.prototype.draw = function() {
        var bucket = Math.ceil(audioSource.streamData.length/sixes.length*this.index);
        var val = Math.pow((audioSource.streamData[bucket]/255),2)*255;
        val *= this.index > 42 ? 1.1 : 1;
        // establish the value for this six
        if (val > this.high) {
            this.high = val;
        } else {
            this.high -= this.decay;
            val = this.high;
        }

        // if (this.index == Math.round(sixes.length * (7 / 10))) {
        //     city.style.opacity = 0.02 + (0.8 * (val / 255));
        //     console.log(val);
        // }

        // figure out what colour to fill it and then draw the six
        var r, g, b, a;
        if (val > 0) {
            if (val > 128) {
                r = (val-128)*2;
                g = ((Math.cos((2*val/128*Math.PI/2)- 4*Math.PI/3)+1)*128);
                b = (val-105)*3;
            }
            else if (val > 175) {
                r = (val-128)*2;
                g = 255;
                b = (val-105)*3;
            }
            else {
                r = ((Math.cos((2*val/128*Math.PI/2))+1)*128);
                g = ((Math.cos((2*val/128*Math.PI/2)- 4*Math.PI/3)+1)*128);
                b = ((Math.cos((2.4*val/128*Math.PI/2)- 2*Math.PI/3)+1)*128);
            }
            // if (val > 210) {
            //     this.cubed = val; // add the cube effect if it's really loud
            // }
            // if (val > 120) {
            //     this.highlight = 100; // add the highlight effect if it's pretty loud
            // }

            // set the alpha
            var e = 2.7182;
            a = (0.5/(1 + 40 * Math.pow(e, -val/8))) + (0.5/(1 + 40 * Math.pow(e, -val/20)));

            var minSize = 6;
            var increment = 15;
            var size = minSize+ (increment * val / 255);
            this.ctx.font = size + "em Courier New";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = 'middle';
            this.ctx.strokeStyle = "rgba(" +
                Math.round(r) + ", " +
                Math.round(g) + ", " +
                Math.round(b) + ", " +
                a + ")";
            this.ctx.strokeText("6farer", 0, 0);
        }
    };

    var drawBg = function() {
        var val = audioSource.volume / 100;
        // The below shit needs to be exponential. Linear contrast looks bad. Random values
        city.style.opacity = 0.02 + (0.9 * (val * val / 24000));
        console.log(val);
    };

    this.resizeCanvas = function() {
        if (fgCanvas) {
            // resize the foreground canvas
            fgCanvas.width = window.innerWidth;
            fgCanvas.height = window.innerHeight;
            fgCtx.translate(fgCanvas.width/2,fgCanvas.height/2);

            // resize the bg canvas
            bgCanvas.width = window.innerWidth;
            bgCanvas.height = window.innerHeight;

            sixSize = fgCanvas.width > fgCanvas.height ? fgCanvas.width / 25 : fgCanvas.height / 25;

            makeSixes();
        }
    };

    var draw = function() {
        fgCtx.clearRect(-fgCanvas.width, -fgCanvas.height, fgCanvas.width * 2, fgCanvas.height * 2);

        sixes.forEach(function(six) {
            six.draw();
        });
        drawBg();
        requestAnimationFrame(draw);
    };

    var makeSixes = function() {
        sixes = [];
        for (var index = 0; index < 50; index++) {
            sixes.push(new Six(sixSize, fgCtx, index));;
        }
    }

    this.init = function(options) {
        audioSource = options.audioSource;
        var container = document.getElementById(containerId);
        city = document.getElementById(cityId);

        // foreground
        fgCanvas = document.createElement('canvas');
        fgCanvas.setAttribute('style', 'position: absolute; z-index: 10');
        fgCtx = fgCanvas.getContext("2d");
        container.appendChild(fgCanvas);

        // background image layer
        bgCanvas = document.createElement('canvas');
        bgCtx = bgCanvas.getContext("2d");
        container.appendChild(bgCanvas);

        this.resizeCanvas();
        draw();

        // resize the canvas to fill browser window dynamically
        window.addEventListener('resize', this.resizeCanvas, false);
    }
}


/**
 * Makes a request to the Soundcloud API and returns the JSON data.
 */
var SoundcloudLoader = function(player) {
    var self = this;
    var client_id = "01d9f6cd79fc314dc85a6c8b949267e5"; // to get an ID go to http://developers.soundcloud.com/
    this.sound = {};
    this.streamUrl = "";
    this.errorMessage = "";
    this.player = player;

    /**
     * Loads the JSON stream data object from the URL of the track (as given in the location bar of the browser when browsing Soundcloud),
     * and on success it calls the callback passed to it (for example, used to then send the stream_url to the audiosource object).
     * @param track_url
     * @param callback
     */
    this.loadStream = function(track_url, successCallback, errorCallback) {
        SC.initialize({
            client_id: client_id
        });
        SC.get('/resolve', { url: track_url }, function(sound) {
            if (sound.errors) {
                self.errorMessage = "";
                for (var i = 0; i < sound.errors.length; i++) {
                    self.errorMessage += sound.errors[i].error_message + '<br>';
                }
                self.errorMessage += 'Make sure the URL has the correct format: https://soundcloud.com/user/title-of-the-track';
                errorCallback();
            } else {

                if(sound.kind=="playlist"){
                    self.sound = sound;
                    self.streamPlaylistIndex = 0;
                    self.streamUrl = function(){
                        return sound.tracks[self.streamPlaylistIndex].stream_url + '?client_id=' + client_id;
                    };
                    successCallback();
                }else{
                    self.sound = sound;
                    self.streamUrl = function(){ return sound.stream_url + '?client_id=' + client_id; };
                    successCallback();
                }
            }
        });
    };

    this.directStream = function(direction){
        if(direction=='toggle'){
            if (this.player.paused) {
                this.player.play();
            } else {
                this.player.pause();
            }
        }
        else if(this.sound.kind=="playlist"){
            if(direction=='coasting') {
                this.streamPlaylistIndex++;
            }else if(direction=='forward') {
                if(this.streamPlaylistIndex>=this.sound.track_count-1) this.streamPlaylistIndex = 0;
                else this.streamPlaylistIndex++;
            }else{
                if(this.streamPlaylistIndex<=0) this.streamPlaylistIndex = this.sound.track_count-1;
                else this.streamPlaylistIndex--;
            }
            if(this.streamPlaylistIndex>=0 && this.streamPlaylistIndex<=this.sound.track_count-1) {
               this.player.setAttribute('src',this.streamUrl());
               this.player.play();
            }
        }
    }
};

var SoundCloudAudioSource = function(player) {
    var self = this;
    var analyser;
    var audioCtx = new (window.AudioContext || window.webkitAudioContext);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    player.crossOrigin = "anonymous";
    var source = audioCtx.createMediaElementSource(player);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    var sampleAudioStream = function() {
        analyser.getByteFrequencyData(self.streamData);
        // calculate an overall volume value
        var total = 0;
        for (var i = 0; i < 80; i++) { // get the volume from the first 80 bins, else it gets too loud with treble
            total += self.streamData[i];
        }
        self.volume = total;
    };
    setInterval(sampleAudioStream, 20);
    // public properties and methods
    this.volume = 0;
    this.streamData = new Uint8Array(128);
    this.playStream = function(streamUrl) {
        // get the input stream from the audio element
        player.addEventListener('ended', function(){
            self.directStream('coasting');
        });
        player.setAttribute('src', streamUrl);
        player.play();
    }
};

window.onload = function init() {
    var visualizer = new Visualizer();
    var player =  document.getElementById('player');
    var loader = new SoundcloudLoader(player);
    var audioSource = new SoundCloudAudioSource(player);

    loader.loadStream(trackUrl,
        function() {
            audioSource.playStream(loader.streamUrl());
        },
        function() {
            console.log("Error: " + loader.errorMessage);
        });
    visualizer.init({ audioSource: audioSource });

    window.addEventListener("keydown", keyControls, false);
    function keyControls(e) {
        switch(e.keyCode) {
            case 32:
                // spacebar pressed
                loader.directStream('toggle');
                break;
            case 37:
                // left key pressed
                loader.directStream('backward');
                break;
            case 39:
                // right key pressed
                loader.directStream('forward');
                break;
        }
    }
};