document.getElementById('loginButton').addEventListener('click', function () {
    const passwordInput = document.getElementById('passwordInput');
    const inputPassword = passwordInput.value;

    // make ajax request to validate password
    $.ajax({
        method: "POST",
        url: "validate_login.php", 
        data: { password: inputPassword }, 
        dataType: 'json' 
    }).done(function (response) {
        if (response.success) {
            // hide the login and thumbnail containers and show the drawing app
            document.getElementById('loginContainer').style.display = 'none';
            document.getElementById('thumbnailContainer').style.display = 'none';
            document.getElementById('drawingApp').style.display = 'flex';
        } else {
            document.getElementById('loginMessage').innerText = 'wrong pw dude';
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.error('Login request failed:', textStatus, errorThrown);
        document.getElementById('loginMessage').innerText = 'wtf did u do';
    });
});

// get the canvas and context
const canvas = document.getElementById('drawing-board');
const toolbar = document.getElementById('toolbar');
const ctx = canvas.getContext('2d');

// adjust canvas size to fill the available space
canvas.width = 800; // set a fixed width for consistent resolution; might adjust this later
canvas.height = 600; // set a fixed height for consistent resolution; might adjust this later

// store drawing state
let isPainting = false;
let lineWidth = 5;

// fill the canvas with a background color; otherwise its transparent and looks funky
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// update color and line width from toolbar
toolbar.addEventListener('change', e => {
    if (e.target.id === 'stroke') {
        ctx.strokeStyle = e.target.value;
    }

    if (e.target.id === 'lineWidth') {
        lineWidth = e.target.value;
    }
});

// handle clear and submit actions
toolbar.addEventListener('click', e => {
    if (e.target.id === 'clear') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillRect(0, 0, canvas.width, canvas.height); // refill the background
    }

    if (e.target.id === 'submitButton') {
        saveImage();
    }
});

// function to get mouse or touch position relative to the canvas
function getMousePos(canvas, event) {
    const rect = canvas.getBoundingClientRect(); 
    const scaleX = canvas.width / rect.width;   
    const scaleY = canvas.height / rect.height; 
    return {
        x: (event.clientX - rect.left) * scaleX, 
        y: (event.clientY - rect.top) * scaleY  
    };
}

// drawing function
const draw = (e) => {
    if (!isPainting) {
        return;
    }

    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';

    const pos = getMousePos(canvas, e); // get adjusted mouse position
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
}

// add touch event listeners for mobile support
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // prevent scrolling and pinch zoom
    isPainting = true;
    const pos = getMousePos(canvas, e.touches[0]);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); 
    draw(e.touches[0]); 
});

canvas.addEventListener('touchend', () => {
    isPainting = false;
    ctx.beginPath(); 
});

// start drawing
canvas.addEventListener('mousedown', (e) => {
    isPainting = true;
    const pos = getMousePos(canvas, e); 
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
});

// stop drawing
canvas.addEventListener('mouseup', () => {
    isPainting = false;
    ctx.beginPath(); 
});

// mouse movement event to draw
canvas.addEventListener('mousemove', draw);

// save the image data
function saveImage() {
    var canvasData = canvas.toDataURL("image/png");
    console.log('converting data...');

    $.ajax({
        method: "POST",
        url: "upload.php",
        dataType: 'json', 
        data: {
            data: canvasData
        }
    }).done(function (response) {
        const messageContainer = $('#messageContainer');

        messageContainer.text('');

        if (response.success) {
            messageContainer.css('color', 'green'); 
            messageContainer.text('Success: ' + response.message);
        } else {
            messageContainer.css('color', 'red'); 
            messageContainer.text('error: ' + response.message); 
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        const messageContainer = $('#messageContainer'); 
        messageContainer.css('color', 'red'); 
        messageContainer.text('submission failed: ' + textStatus); 
    });
}

// function to load thumbnails
function loadThumbnails() {
    $.ajax({
        method: "GET",
        url: "get_images.php", 
        dataType: 'json'
    }).done(function (response) {
        const thumbnailsContainer = document.getElementById('thumbnails');
        thumbnailsContainer.innerHTML = ''; 

        response.images.forEach(image => {
            const imgElement = document.createElement('img');
            imgElement.src = `images/${image}`; // path to the image
            imgElement.style.height = '150px'; // set thumbnail height
            imgElement.style.width = '200px'; // set thumbnail width
            imgElement.style.margin = '5px'; // add some padding

            // add click event to display the image in a larger view
            imgElement.addEventListener('click', function() {
                displayLargeImage(`images/${image}`);
            });

            thumbnailsContainer.appendChild(imgElement);
        });

        // show the thumbnail container
        if (response.images.length > 0) {
            document.getElementById('thumbnailContainer').style.display = 'block';
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.error('Failed to load images:', textStatus, errorThrown);
    });
}

// function to display the large image
function displayLargeImage(src) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';

    const img = document.createElement('img');
    img.src = src;
    img.style.maxWidth = '90%';
    img.style.maxHeight = '90%';
    img.style.border = '2px solid white';

    overlay.appendChild(img);
    document.body.appendChild(overlay);

    // close the overlay when clicked
    overlay.addEventListener('click', function() {
        document.body.removeChild(overlay);
    });
}

// call loadThumbnails on page load
document.addEventListener('DOMContentLoaded', loadThumbnails);

document.getElementById('confirmUpload').addEventListener('click', function() {
    const fileInput = document.getElementById('imageUpload');
    const file = fileInput.files[0];
    const maxSize = 5 * 1024 * 1024; // 5 MB

    // clear previous messages
    const messageContainer = $('#messageContainer');
    messageContainer.text('');

    if (!file) {
        messageContainer.css('color', 'red');
        messageContainer.text('gotta be image dood');
        return;
    }

    if (file.size > maxSize) {
        messageContainer.css('color', 'red');
        messageContainer.text('too big!! 5mb limit!!');
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    $.ajax({
        method: "POST",
        url: "upload.php",
        data: formData,
        processData: false,
        contentType: false, 
        dataType: 'json'
    }).done(function(response) {
        messageContainer.text('');

        if (response.success) {
            messageContainer.css('color', 'green');
            messageContainer.text('wahoo: ' + response.message);
        } else {
            messageContainer.css('color', 'red');
            messageContainer.text('oh no: ' + response.message);
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        messageContainer.css('color', 'red');
        messageContainer.text('wtf: ' + textStatus);
    });
});


