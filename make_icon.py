from PIL import Image, ImageDraw

# Skapa svart bild 128x128
img = Image.new('RGB', (128, 128), color='black')
d = ImageDraw.Draw(img)

# Kali Neon Green
color = (57, 255, 20) 
width = 10

# Rita ">"
d.line([(25, 25), (85, 64)], fill=color, width=width)
d.line([(25, 103), (85, 64)], fill=color, width=width)

# Rita "_"
d.line([(95, 103), (115, 103)], fill=color, width=width)

# Spara
img.save('icon.png')
print("✅ Ikon skapad: icon.png")


