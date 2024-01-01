var animationData;
var animationInstance;
var colorMapping = {};

document.getElementById('drop-area').ondragover = function(evt) {
    evt.preventDefault();
};

document.getElementById('drop-area').ondrop = function(evt) {
    evt.preventDefault();

    var file = evt.dataTransfer.files[0];
    var reader = new FileReader();

    reader.onload = function(e) {
        animationData = JSON.parse(e.target.result);
        loadAnimation();
        displayColors(animationData);

        document.getElementById('drop-area').style.display = 'none';
        document.getElementById('color-table').style.display = 'block';
        document.getElementById('animation').style.display = 'block';
    };

    reader.readAsText(file);
};

document.getElementById('reset-button').addEventListener('click', function() {
    document.getElementById('drop-area').style.display = 'block';
    document.getElementById('color-table').style.display = 'none';
    document.getElementById('animation').style.display = 'none';

    if (animationInstance) {
        animationInstance.destroy();
        animationInstance = null;
    }
});

document.getElementById('save-button').addEventListener('click', function() {
    downloadJson(animationData, 'animation.json');
});



function loadAnimation() {
    if (animationInstance) {
        animationInstance.destroy();
    }

    animationInstance = lottie.loadAnimation({
        container: document.getElementById('animation'),
        animationData: animationData,
        renderer: 'svg',
        loop: true,
        autoplay: true
    });
}

function displayColors() {
    var colors = new Set();
    findColors(animationData, colors);

    var table = document.getElementById('color-table');
    table.innerHTML = '<tr><th>色</th><th>カラーコード</th><th>新しい色</th><th>新しいカラーコード</th></tr>';

    Array.from(colors).forEach(function(rgb, index) {
        var hexColor = rgbToHex(rgb);
        var row = table.insertRow();
        var colorCell = row.insertCell();
        var hexCell = row.insertCell();
        var newColorCell = row.insertCell();
        var newHexCell = row.insertCell();

        colorCell.innerHTML = '<div class="color-box" style="background-color: ' + hexColor + ';"></div>';
        hexCell.textContent = hexColor;
        newColorCell.innerHTML = '<div id="new-color-box-' + index + '" class="color-box"></div>';
        newHexCell.innerHTML = '<input type="text" id="new-color-input-' + index + '" oninput="updateColorMapping(\'' + hexColor + '\', this.value, ' + index + ')">';
    });
}

function updateColorMapping(oldColor, newColor, index) {
    if (newColor.match(/^#[0-9a-f]{6}$/i)) {
        colorMapping[oldColor] = newColor;
        document.getElementById('new-color-box-' + index).style.backgroundColor = newColor;
        updateAnimationColors();
    }
}

function updateAnimationColors() {
    for (var oldColor in colorMapping) {
        var newColor = colorMapping[oldColor];
        replaceColorInAnimationData(animationData, oldColor, newColor);
    }
    loadAnimation(); // Reload the animation with updated colors
}

function replaceColorInAnimationData(data, oldColor, newColor) {
    if (typeof data === 'object' && data !== null) {
        Object.keys(data).forEach(function(key) {
            if (key === 'c' && data[key].k && Array.isArray(data[key].k)) {
                var hexColor = rgbToHex(data[key].k.slice(0, 3).map(function(value) {
                  return Math.floor(value * 255);
                }).join(','));
                if (hexColor === oldColor) {
                    var newRgb = hexToRgb(newColor);
                    data[key].k = [newRgb[0], newRgb[1], newRgb[2], data[key].k[3]]; // Replace with new color
                }
            }
            replaceColorInAnimationData(data[key], oldColor, newColor);
        });
    } else if (Array.isArray(data)) {
        data.forEach(function(item) {
            replaceColorInAnimationData(item, oldColor, newColor);
        });
    }
}

function findColors(data, colors) {
    if (typeof data === 'object' && data !== null) {
        Object.keys(data).forEach(function(key) {
            if (key === 'c' && data[key].k && Array.isArray(data[key].k)) {
                var rgb = data[key].k.slice(0, 3).map(function(value) {
                  return Math.floor(value * 255);
                });
                colors.add(rgb.join(','));
            }
            findColors(data[key], colors);
        });
    } else if (Array.isArray(data)) {
        data.forEach(function(item) {
            findColors(item, colors);
        });
    }
}

function rgbToHex(rgb) {
    console.log('rgb:', rgb);
    rgb = rgb.split(',').map(function(value) { return parseInt(value, 10); });
    return '#' + rgb.map(function(value) {
        return ('0' + value.toString(16)).slice(-2);
    }).join('');
}

function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return [r / 255, g / 255, b / 255];
}

function downloadJson(data, filename) {
    var blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    var url = URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
