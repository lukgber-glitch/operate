<?php
$path = $_SERVER["REQUEST_URI"];
$url = "http://127.0.0.1:3000" . $path;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// Forward request method and body
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER["REQUEST_METHOD"]);
if ($_SERVER["REQUEST_METHOD"] === "POST" || $_SERVER["REQUEST_METHOD"] === "PUT" || $_SERVER["REQUEST_METHOD"] === "PATCH") {
    $input = file_get_contents("php://input");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}

// Forward headers
$headers = [];
foreach (getallheaders() as $name => $value) {
    if (strtolower($name) !== "host" && strtolower($name) !== "content-length") {
        $headers[] = "$name: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$response = curl_exec($ch);
$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$header = substr($response, 0, $header_size);
$body = substr($response, $header_size);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Set response headers
foreach (explode("\r\n", $header) as $line) {
    if (stripos($line, "content-type:") === 0 || stripos($line, "set-cookie:") === 0) {
        header($line);
    }
}
http_response_code($http_code);
echo $body;
