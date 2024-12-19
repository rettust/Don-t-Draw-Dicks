# Don't Draw Dicks
- Application scripts to:
  - Have a (crappy looking, I'm no web dev) front-end website with a basic login validation since I'm only sharing this with friends/family
  - Allow users to make and upload simple drawings or photos from their phone/PC directly
  - Display the last ten images submitted on a loop on a display running the included Python script (I'm using a Raspberry Pi hooked up to a touchscreen, but anything will work)

# Deploying
- Upload all of the base files (outside of RPi script) to a PHP-enabled server
- Make any necessary configuration changes (see below)
- Run the Python script on your display device of choice (I'm using a 7-inch touchscreen plugged in to a Raspberry Pi)
- Tell people not to draw dicks (or encourage it, I'm not your boss)

# Configuration
- index.js
  - canvas.width & canvas.height (lines 32 & 33): will set the dimensions of the canvas on the front-end, default is 800x600 so you might want to change this
- upload.php
  - directory (line 4): where it will be saving the images to server-side
  - archiveDirectory (line 5): the same, but where it will store archived images (anything submitted after 10 current images)
  - timeLimit (line 7): length between submission for individuals (10 seconds by default) - not defensively sophisticated by any stretch, so make changes here if you're worried about people more nefarious than my friends & family
  - maxSize (line 54): maximum allowed file size for uploaded images (5MB by default)
- validate_login.php
  - correct_password (line 3): the password you want to set for the front-end validation
- RPi Script/displayimages.py
  - URL (line 11): where the Python script is looking to pull images from i.e.: "http://www.yourwebsitehere.com/images/"
  - LOCAL_DIR (line 12): where the script will save images locally to (from the base directory of where you run the script from)
  - ARCHIVE_DIR (line 13): same as above, but where archived images will be moved to
  - DISPLAY_DURATION (line 15): how long to display each image before moving to the next one (default 5 seconds)
  - CHECK_INTERVAL (line 16): how long to display the last photo before going back through the rotation (default 10 seconds)
  - NEW_IMAGE_DURATION (line 17): if a newly uploaded image is found, how long to display it before moving to the next (default 30 seconds)

# To-do
- I'd like to add more drawing tools but I also couldn't figure out how to do something like a fill tool so it will probably just stay simplistic in nature because I am not a professional developer, okay?
- My assumption right now is that this is a bit bulky and shitty to use on mobile, so at some point (if that is true) then I'll probably make some adjustments

# Known Issues:
- None right now I think, ask me after I have people start using it during our family Xmas get-together :)

