import os
import time
import requests
import shutil
import tkinter as tk
from PIL import Image, ImageTk
from io import BytesIO
import re

# config here
URL = "yoururlhere.com/imagedirectory/"
LOCAL_DIR = "./images/"
ARCHIVE_DIR = "./archive/"
SEEN_IMAGES_FILE = "seen_images.txt"
DISPLAY_DURATION = 5  # time to display each image
CHECK_INTERVAL = 10 # time before it refreshes to check for new images
NEW_IMAGE_DURATION = 30 # time to display a newly uploaded image

# makes dirs if necessary
os.makedirs(LOCAL_DIR, exist_ok=True)
os.makedirs(ARCHIVE_DIR, exist_ok=True)

# loads previously seen images from a file
def load_seen_images():
    if not os.path.exists(SEEN_IMAGES_FILE):
        return set()
    with open(SEEN_IMAGES_FILE, "r") as file:
        return set(line.strip() for line in file)

# saves current set of images to file
def save_seen_images(seen_images):
    with open(SEEN_IMAGES_FILE, "w") as file:
        for image in seen_images:
            file.write(image + "\n")

# gets current list of images from URL
def fetch_image_list():
    response = requests.get(URL)
    if response.status_code != 200:
        raise Exception("Failed to access directory")

    html = response.text

    # regexes filenames for extensions
    image_list = re.findall(r'href="([^"]*\.(png|jpg|jpeg))"', html)

    # extract only filenames
    images = [img[0] for img in image_list]

    return images

# download images from url
def download_image(image_name):
    image_url = URL + image_name
    response = requests.get(image_url)
    if response.status_code != 200:
        raise Exception(f"failed to download image: {image_name}")
    
    img = Image.open(BytesIO(response.content))
    return img

# save locally
def save_image_locally(img, image_name):
    img_path = os.path.join(LOCAL_DIR, image_name)
    img.save(img_path)

# archives old images
def archive_old_images():
    images = sorted(os.listdir(LOCAL_DIR), key=lambda x: os.path.getmtime(os.path.join(LOCAL_DIR, x)))
    
    # move the oldest images to archive if there are more than 10
    while len(images) > 10:
        old_image = images.pop(0)
        shutil.move(os.path.join(LOCAL_DIR, old_image), os.path.join(ARCHIVE_DIR, old_image))
        print(f"Archived: {old_image}")

# gui setup
root = tk.Tk()
root.title("Don't Draw Dicks")

# enable fullscreen mode
root.attributes('-fullscreen', True)

# add key bindings to exit fullscreen
def quit_fullscreen(event=None):
    root.attributes('-fullscreen', False)
    
def close_on_double_click(event=None):
        print("double clicked; closing application")
        root.destroy()

root.bind('<Double-1>', close_on_double_click)

img_label = tk.Label(root)
img_label.pack()


# display images in local directory one by one
def display_images(new_images=None):
    screen_width = root.winfo_screenwidth()
    screen_height = root.winfo_screenheight()

    images = sorted(os.listdir(LOCAL_DIR), key=lambda x: os.path.getmtime(os.path.join(LOCAL_DIR, x)))

    # ensure new_images is a set for quick lookup
    if new_images is None:
        new_images = set()

    if images:
        for img_file in images:
            img_path = os.path.join(LOCAL_DIR, img_file)
            print(f"displaying: {img_file}")
            
            try:
                # open and resize the image to fit fullscreen
                img = Image.open(img_path)
                img = img.resize((screen_width, screen_height), Image.Resampling.LANCZOS)

                # convert to PhotoImage for Tkinter
                img_tk = ImageTk.PhotoImage(img)
                
                # update the label
                img_label.config(image=img_tk)
                img_label.image = img_tk  # keep a reference to avoid garbage collection

                # display for longer if it's a new image
                if img_file in new_images:
                    time.sleep(NEW_IMAGE_DURATION)
                    new_images.remove(img_file) 
                else:
                    time.sleep(DISPLAY_DURATION)
                
                root.update()
            except Exception as e:
                print(f"error displaying image {img_path}: {e}")
def display_images():
    screen_width = root.winfo_screenwidth()
    screen_height = root.winfo_screenheight()

    images = sorted(os.listdir(LOCAL_DIR), key=lambda x: os.path.getmtime(os.path.join(LOCAL_DIR, x)))
    
    if images:
        for img_file in images:
            img_path = os.path.join(LOCAL_DIR, img_file)
            print(f"displaying: {img_file}")
            
            # open and resize the image to fit fullscreen
            img = Image.open(img_path)
            img = img.resize((screen_width, screen_height), Image.Resampling.LANCZOS)

            # convert to PhotoImage for Tkinter
            img_tk = ImageTk.PhotoImage(img)
            
            # update the label
            img_label.config(image=img_tk)
            img_label.image = img_tk 
            
            # pause before displaying the next image
            root.update()
            time.sleep(DISPLAY_DURATION)
            
# fetch and download new images
def check_and_update_images():
    seen_images = load_seen_images()
    
    print("checking for new images...")
    current_images = fetch_image_list()

    # find new images by comparing with seen images
    new_images = [img for img in current_images if img not in seen_images]
    
    if new_images:
        print(f"found {len(new_images)} new image(s). gettin em...")
        for image_name in new_images:
            img = download_image(image_name)
            save_image_locally(img, image_name)
            print(f"saved: {image_name}")
            
            # mark as seen
            seen_images.add(image_name)
        
        # save updated list
        save_seen_images(seen_images)
        
        # archive old images if needed
        archive_old_images()
    
    # Pass new images to display_images
    display_images(new_images=new_images)

    # schedule the next image check
    root.after(CHECK_INTERVAL * 1000, check_and_update_images)
def check_and_update_images():
    seen_images = load_seen_images()
    
    print("checking for new images...")
    current_images = fetch_image_list()

    # find new images by comparing with seen images
    new_images = [img for img in current_images if img not in seen_images]
    
    if new_images:
        print(f"found {len(new_images)} new image(s). gettin em...")
        for image_name in new_images:
            img = download_image(image_name)
            save_image_locally(img, image_name)
            print(f"saved: {image_name}")
            
            # mark as seen
            seen_images.add(image_name)
        
        # save updated list
        save_seen_images(seen_images)
        
        # archive old images if needed
        archive_old_images()
    
    # display the images in the Tkinter window
    display_images()

    # schedule the next image check
    root.after(CHECK_INTERVAL * 1000, check_and_update_images)

# start the Tkinter main loop and the first image check
root.after(0, check_and_update_images)
root.mainloop()

