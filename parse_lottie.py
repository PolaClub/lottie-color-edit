import json

def find_colors(data, colors):
    if isinstance(data, dict):
        for key, value in data.items():
            if key == 'c' and isinstance(value, dict) and 'k' in value and isinstance(value['k'], list):
                colors.add(tuple(value['k']))
            else:
                find_colors(value, colors)
    elif isinstance(data, list):
        for item in data:
            find_colors(item, colors)

def rgb_to_hex(rgb):
    """Converts an RGB color value to HEX format."""
    return '#{:02x}{:02x}{:02x}'.format(int(rgb[0] * 255), int(rgb[1] * 255), int(rgb[2] * 255))

def main():
    with open('./finish_animation.json', 'r') as file:
        data = json.load(file)

    colors = set()
    find_colors(data, colors)

    for color in colors:
        print(rgb_to_hex(color))

if __name__ == "__main__":
    main()
