<?php
session_start(); 

$directory = './images/';
$archiveDirectory = './archive/';
// time limit between submission in seconds
$timeLimit = 10;  

// check if the last submission time is set
if (isset($_SESSION['last_submission_time'])) {
    $lastSubmissionTime = $_SESSION['last_submission_time'];
    $timeSinceLastSubmission = time() - $lastSubmissionTime;

    // if the time since the last submission is less than timeLimit, deny the submission
    if ($timeSinceLastSubmission < $timeLimit) {
        $remainingTime = $timeLimit - $timeSinceLastSubmission;
        die(json_encode(['success' => false, 'message' => "slow ur roll pardner, you can submit again in " . round($remainingTime) . " seconds"]));
    }
}

// create the archive directory if it doesn't exist
if (!is_dir($archiveDirectory)) {
    mkdir($archiveDirectory, 0777, true);
}

// get all files from the images directory and their modification time
$files = scandir($directory);
$fileTimestamps = [];

foreach ($files as $file) {
    // ignore '.' and '..' directory references
    if ($file !== '.' && $file !== '..' && is_file($directory . $file)) {
        $fileTimestamps[$file] = filemtime($directory . $file);
    }
}

// sort files by modification time in descending order (newest first)
arsort($fileTimestamps);

// keep count and move files after the 11th one
$count = 1;
foreach ($fileTimestamps as $file => $timestamp) {
    if ($count > 9) {
        // move the file to the archive directory
        rename($directory . $file, $archiveDirectory . $file);
    }
    $count++;
}

// handle the image upload via POST
if (isset($_FILES['image'])) {
    $file = $_FILES['image'];
    // 5MB limit
    $maxSize = 5 * 1024 * 1024;

    if ($file['size'] > $maxSize) {
        echo json_encode(['success' => false, 'message' => 'file size exceeds 5 MB limit.']);
        exit;
    }

    $check = getimagesize($file['tmp_name']);
    if ($check === false) {
        echo json_encode(['success' => false, 'message' => 'not image dood']);
        exit;
    }

    // generate a unique filename and save it to the images folder
    $fileName = uniqid() . '_' . basename($file['name']);
    $filePath = $directory . $fileName;

    if (move_uploaded_file($file['tmp_name'], $filePath)) {
        $_SESSION['last_submission_time'] = time();
        echo json_encode(['success' => true, 'message' => 'image uploaded successfully!']);
    } else {
        echo json_encode(['success' => false, 'message' => 'failed to save the file...']);
    }
} elseif (isset($_POST['data'])) {
    $img = $_POST['data'];
    $img = str_replace('data:image/png;base64,', '', $img);
    $img = str_replace(' ', '+', $img);
    $fileData = base64_decode($img);

    if ($fileData === false) {
        die(json_encode(['success' => false, 'message' => 'image data decoding failed']));
    }

    $fileName = uniqid() . '.png';
    $filePath = $directory . $fileName;

    if (file_put_contents($filePath, $fileData) === false) {
        die(json_encode(['success' => false, 'message' => 'failed to save the file.']));
    } else {
        $_SESSION['last_submission_time'] = time();
        echo json_encode(['success' => true, 'message' => 'image saved successfully!']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'no image data received']);
}
?>
