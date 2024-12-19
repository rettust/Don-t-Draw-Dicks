<?php

$dir = 'images/';
$images = array_diff(scandir($dir), array('..', '.'));

// return the list of images as a JSON response
header('Content-Type: application/json');
echo json_encode(["images" => array_values($images)]);
?>
