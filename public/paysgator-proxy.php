<?php
// Proxy Seguro para PaysGator - Bypass de CORS e Ocultação de Chave API
// Coloque este ficheiro na raiz do seu alojamento (junto com index.html)

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Responder rapidamente as preflight requests (CORS)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar se o cURL está ativo no Hostinger
if (!function_exists('curl_init')) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erro: O servidor PHP (Hostinger) não tem a extensão cURL ativa. Verifique o painel de controlo."]);
    exit();
}

// =========================================================================
// ATENÇÃO: COLOQUE A SUA CHAVE DE PRODUÇÃO ABAIXO
$API_KEY = 'mk_test_39226af9_08c7386dae020f4e3d6589e0c46c624c123d7722dbe4a03b34426f199fab2579';
// =========================================================================

$data = file_get_contents('php://input');
$json = json_decode($data, true);

// Tentar obter o endpoint via 'op' (usamos $_REQUEST ou o corpo JSON para ser mais robusto)
$op = $_REQUEST['op'] ?? $json['op'] ?? '';

$endpoints = [
    'create' => '/payment/create',
    'confirm' => '/payment/confirm',
    'status' => '/transactions/'
];

$endpoint = $endpoints[$op] ?? '';

// Caso seja consulta de status, o ID vem no ?id=...
if ($op === 'status' && isset($_REQUEST['id'])) {
    $endpoint .= $_REQUEST['id'];
}

if (empty($endpoint)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Operação inválida. Verifique se o parâmetro 'op' está a ser enviado.",
        "debug" => [
            "op_recebido" => $op,
            "metodo" => $_SERVER['REQUEST_METHOD'],
            "query_string" => $_SERVER['QUERY_STRING']
        ]
    ]);
    exit();
}

$logFile = 'paysgator_debug.log';
$logEntry = date('Y-m-d H:i:s') . " - op: $op, data: $data\n";
file_put_contents($logFile, $logEntry, FILE_APPEND);

$url = "https://paysgator.com/api/v1" . $endpoint;
$method = $_SERVER['REQUEST_METHOD'];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$headers = [
    'Content-Type: application/json',
    'X-Api-Key: ' . $API_KEY
];
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

if ($method === 'POST' && !empty($data)) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
}

curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

file_put_contents($logFile, "Resposta HTTP: $http_code, Resposta: $response, Erro cURL: $error\n", FILE_APPEND);

if ($response === false) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erro de proxy CURL: " . $error]);
    exit();
}

// Prevenir respostas vazias (que fazem o front-end congelar no JSON.parse)
if (empty($response)) {
    http_response_code(502);
    echo json_encode(["success" => false, "message" => "O gateway PaysGator não retornou nenhuma resposta (Timeout ou erro interno da API).", "http_code" => $http_code]);
    exit();
}

http_response_code($http_code);
echo $response;
?>