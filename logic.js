document.getElementById('drop-area').ondragover = function(evt) {
    evt.preventDefault();
};

document.getElementById('drop-area').ondrop = function(evt) {
    evt.preventDefault();

    var file = evt.dataTransfer.files[0];
    var reader = new FileReader();

    reader.onload = function(e) {
        var animationData = JSON.parse(e.target.result);
        lottie.loadAnimation({
            container: document.getElementById('animation'),
            animationData: animationData,
            renderer: 'svg',
            loop: true,
            autoplay: true
        });

        displayColors(animationData);
    };

    reader.readAsText(file);
};

function displayColors(data) {
    var colors = new Set();
    findColors(data, colors);

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
        newHexCell.innerHTML = '<input type="text" id="new-color-input-' + index + '" oninput="updateColor(' + index + ')">';
    });
}

function updateColor(index) {
    var input = document.getElementById('new-color-input-' + index);
    var box = document.getElementById('new-color-box-' + index);
    if (input.value.match(/^#[0-9a-f]{6}$/i)) {
        box.style.backgroundColor = input.value;
    } else {
        box.style.backgroundColor = 'transparent';
    }
}

function findColors(data, colors) {
    if (typeof data === 'object' && data !== null) {
        Object.keys(data).forEach(function(key) {
            if (key === 'c' && data[key].k && Array.isArray(data[key].k)) {
                var rgb = data[key].k.slice(0, 3).map(function(value) { return Math.floor(value * 255); });
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
    rgb = rgb.split(',').map(function(value) { return parseInt(value, 10); });
    return '#' + rgb.map(function(value) {
        return ('0' + value.toString(16)).slice(-2);
    }).join('');
}

