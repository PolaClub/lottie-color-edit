var animationData;
var animationDataOrig;
var animationInstance;
var colorMapping = {};
// オリジナルのカラーコードから、何番目に見つかったかどうかの配列を調査
var colorGroup = {};
var foundIndex = 0;

document.getElementById('drop-area').ondragover = function(evt) {
    evt.preventDefault();
};

document.getElementById('drop-area').ondrop = function(evt) {
    evt.preventDefault();

    var file = evt.dataTransfer.files[0];
    var reader = new FileReader();

    reader.onload = function(e) {
        animationData = JSON.parse(e.target.result);
        animationDataOrig = JSON.parse(e.target.result);
        displayColors(animationData);
        loadAnimation();
        // document.getElementById('drop-area').style.display = 'none';
        document.getElementById('color-table').style.display = 'block';
        document.getElementById('animation').style.display = 'block';
    };

    reader.readAsText(file);
};

document.getElementById('reset-button').addEventListener('click', function() {
    // document.getElementById('drop-area').style.display = 'block';
    document.getElementById('color-table').style.display = 'none';
    document.getElementById('animation').style.display = 'none';

    if (animationInstance) {
        animationInstance.destroy();
        animationInstance = null;
    }
});

document.getElementById('save-button').addEventListener('click', function() {
    downloadJson(animationDataOrig, 'animation.json');
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
    foundIndex = 0;
    findColors(animationData, colors);

    var table = document.getElementById('color-table');
    table.innerHTML = '<tr><th>色</th><th>カラーコード</th><th>新しい色</th><th>新しいカラーコード</th></tr>';

    Array.from(colors).forEach(function(hexColor, index) {
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

function updateColorMapping(hexOrigColor, hexNewColor, index) {
    if (hexNewColor.match(/^#[0-9a-f]{6}$/i)) {
        colorMapping[hexOrigColor] = hexToRgbone(hexNewColor);
        document.getElementById('new-color-box-' + index).style.backgroundColor = hexNewColor;
        updateAnimationColors(hexOrigColor);
    } else {
        colorMapping[hexOrigColor] = hexToRgbone(hexOrigColor);
        document.getElementById('new-color-box-' + index).style.backgroundColor = '';
        updateAnimationColors(hexOrigColor);
    }
}

function updateAnimationColors(hexOrigColor) {
    foundIndex = 0;
    replaceColorInAnimationData(animationData, hexOrigColor);
    foundIndex = 0;
    replaceColorInAnimationData(animationDataOrig, hexOrigColor);
    loadAnimation();
}

function replaceColorInAnimationData(data, hexOrigColor) {
    if (typeof data === 'object' && data !== null) {
        Object.keys(data).forEach(function(key) {
            if (key === 'c' && data[key].k && Array.isArray(data[key].k)) {
                if (colorGroup[hexOrigColor].has(foundIndex)) {
                    var newRgb = colorMapping[hexOrigColor];
                    data[key].k = [newRgb[0], newRgb[1], newRgb[2], data[key].k[3]]; // Replace with new color
                }
              foundIndex += 1;
            }
            // Gradient color
            else if (key === 'g' && data[key].k && data[key].k.k && Array.isArray(data[key].k.k) && data[key].k.k.length === 12) {
                [[1,4], [5,8], [9,12]].forEach(function(range){
                    if (colorGroup[hexOrigColor].has(foundIndex)) {
                        var newRgb = colorMapping[hexOrigColor];
                        var oldRgb = data[key].k.k;
                        oldRgb[range[0]] = newRgb[0];
                        oldRgb[range[0]+1] = newRgb[1];
                        oldRgb[range[0]+2] = newRgb[2];
                        data[key].k.k = oldRgb;
                    }
                    foundIndex += 1;
                });
            }
            replaceColorInAnimationData(data[key], hexOrigColor);
        });
    } else if (Array.isArray(data)) {
        data.forEach(function(item) {
            replaceColorInAnimationData(item, hexOrigColor);
        });
    }
}

function findColors(data, colors) {
    if (typeof data === 'object' && data !== null) {
        Object.keys(data).forEach(function(key) {
            if (key === 'c' && data[key].k && Array.isArray(data[key].k)) {
                var hex = rgboneToHex(data[key].k.slice(0, 3));
                if (!colors.has(hex)) {
                    colors.add(hex);
                    colorGroup[hex] = new Set();
                }
                colorGroup[hex].add(foundIndex);
                foundIndex += 1;
            }
            // Gradient color
            else if (key === 'g' && data[key].k && data[key].k.k && Array.isArray(data[key].k.k) && data[key].k.k.length === 12) {
                [[1,4], [5,8], [9,12]].forEach(function(range){
                    var hex = rgboneToHex(data[key].k.k.slice(range[0], range[1]));
                    if (!colors.has(hex)) {
                        colors.add(hex);
                        colorGroup[hex] = new Set();
                    }
                    colorGroup[hex].add(foundIndex);
                    foundIndex += 1;
                })
            }
            findColors(data[key], colors);
        });
    } else if (Array.isArray(data)) {
        data.forEach(function(item) {
            findColors(item, colors);
        });
    }
}

/*
 * 形式
 * 1. rgbten (i.e "255,16,11") 文字列
 * 2. hex (i.e "#FFEEFF") 文字列
 * 3. rgbone (i.e [0.5,0.3,1.0]) 配列
 */
// findColors ... 19

// 0 〜 255 の10進数の3つの数字のカンマ区切り文字列を hex 文字列に
function rgbtenToHex(rgb) {
    rgb = rgb.split(',').map(function(value) { return parseInt(value, 10); });
    return '#' + rgb.map(function(value) {
        return ('0' + value.toString(16)).slice(-2);
    }).join('');
}

// hex 文字列を 0 〜 1 の10進数の数字の配列に
function hexToRgbone(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return [r / 255, g / 255, b / 255];
}

function rgboneToRgbten(rgbone) {
    return rgbone.map(function(value) {
        return Math.floor(value * 255);
    }).join(',');
}

function rgboneToHex(rgbone) {
    return rgbtenToHex(rgboneToRgbten(rgbone));
}

function downloadJson(data, filename) {
    console.log('downloadJson:', data);
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
