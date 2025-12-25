<?php
// Simple proxy to Node.js app
$url = 'http://localhost:3000' . $_SERVER['REQUEST_URI'];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HEADER, true);

// Forward request method
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);

// Forward request body for POST/PUT
if ($_SERVER['REQUEST_METHOD'] == 'POST' || $_SERVER['REQUEST_METHOD'] == 'PUT') {
    $input = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}

// Forward common headers
$headers = [];
if (isset($_SERVER['CONTENT_TYPE'])) {
    $headers[] = 'Content-Type: ' . $_SERVER['CONTENT_TYPE'];
}
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $headers[] = 'Authorization: ' . $_SERVER['HTTP_AUTHORIZATION'];
}
if (isset($_SERVER['HTTP_COOKIE'])) {
    $headers[] = 'Cookie: ' . $_SERVER['HTTP_COOKIE'];
}
if (isset($_SERVER['HTTP_X_CSRF_TOKEN'])) {
    $headers[] = 'X-CSRF-Token: ' . $_SERVER['HTTP_X_CSRF_TOKEN'];
}
if (isset($_SERVER['HTTP_X_REQUEST_ID'])) {
    $headers[] = 'X-Request-ID: ' . $_SERVER['HTTP_X_REQUEST_ID'];
}
if (count($headers) > 0) {
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

// Parse headers and body
$headerText = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

// Set response code
http_response_code($httpCode);

// Forward relevant response headers
foreach (explode("\r\n", $headerText) as $header) {
    if (preg_match('/^(Content-Type|Set-Cookie|Location|Cache-Control|X-CSRF-Token):/i', $header)) {
        header($header);
    }
}

echo $body;
