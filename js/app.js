$(document).foundation();

var delay = 300;
var logoSrc = 'http://www.quantummob.com/wp-content/uploads/2016/03/cropped-qm-logo-white-512px.png';
var overlaySrcs = [
    'img/camping.jpg',
    'img/hiking.jpg',
    'img/lion.jpg',
    'img/music.jpg',
    'img/scotch.jpg',
    'img/skiing.jpg',
    'img/space.jpg',
    'img/toronto.jpg'
];

var logo = new Image();
var overlayIndex = 0;
var overlays = [];
var imgsLoaded = 0;

// Start when loading is done
var imgLoaded = function() {
    imgsLoaded++;
    console.log('Loaded ' + imgsLoaded);
    if (imgsLoaded === overlaySrcs.length + 1) {
        initRender();
        setInterval(render, delay);
    }
}

function init() {
    loadLogo();
    loadOverlays();
}

function loadLogo() {
    logo.onload = imgLoaded;
    logo.src = logoSrc;
}

function loadOverlays() {
    for (overlaySrc of overlaySrcs) {
        var overlay = new Image();
        overlay.onload = imgLoaded;
        overlay.src = overlaySrc;
        overlays.push(overlay);
    }
}

var $canvas = $('.cover-logo');
$canvas.click(function() {open('http://www.quantummob.com')});
var canvas = $canvas[0];
var ctx = canvas.getContext('2d');

function initRender() {
    canvas.width = logo.width;
    canvas.height = logo.height;
    canvas.style.width = logo.width / 2 + 'px';
    canvas.style.height = logo.height / 2 + 'px';
    render();
}

function render() {
    var dims = findDimensions(overlays[overlayIndex]);
    ctx.save();
    ctx.drawImage(overlays[overlayIndex], dims.x, dims.y, dims.w, dims.h);
    ctx.globalCompositeOperation="source-in";
    ctx.globalCompositeOperation="destination-atop";
    ctx.drawImage(logo, 0, 0);
    ctx.restore();
    overlayIndex += (overlayIndex + 1) % overlaySrcs.length === 0 ? overlayIndex * -1 : 1;
}

function findDimensions(img) {
    var dims = { x: 0, y: 0 };
    var w = img.width;
    var h = img.height;

    // Find proportions
    if (w / canvas.width > h / canvas.height) {
        // Wider -> Height restricted
        dims.h = canvas.height;
        dims.w = (canvas.height / h) * w;
        // Center x
        dims.x = (canvas.width - dims.w) / 2;
    } else {
        // Taller -> Width restricted
        dims.w = canvas.width;
        dims.h = (canvas.width / w) * h;
        // Center y
        dims.y = (canvas.height - dims.h) / 2;
    }
    return dims;
}

init();