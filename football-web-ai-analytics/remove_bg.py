from PIL import Image

input_path = "image/image.png"
output_path = "image/image.png"

img = Image.open(input_path).convert("RGBA")
datas = img.getdata()

# Assuming the top-left pixel is the background color
bg_color = datas[0]

new_data = []
for item in datas:
    # Check if pixel is similar to background (tolerance of 10)
    if abs(item[0] - bg_color[0]) < 20 and abs(item[1] - bg_color[1]) < 20 and abs(item[2] - bg_color[2]) < 20:
        # Transparent pixel
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)

img.putdata(new_data)
img.save(output_path, "PNG")
print("Background removed via PIL!")
