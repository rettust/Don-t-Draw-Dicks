<?php
$password = $_POST['password'];
$correct_password = 'replace_me';

$response = ['success' => false];

if ($password === $correct_password) {
    $response['success'] = true;
}

echo json_encode($response);
?>
