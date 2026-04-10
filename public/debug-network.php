<?php
// Script de Diagnóstico de Rede/DNS para AgroSuste
// Envie este ficheiro para o Hostinger e aceda via navegador

header("Content-Type: text/plain");

echo "--- TESTE DE DNS --- \n";
$domain = 'cmmvcpmmffciqqjgxttv.supabase.co';
$ip = gethostbyname($domain);
echo "Domínio: $domain\n";
echo "IP resolvido: $ip\n";

if ($ip === $domain) {
    echo "ESTADO: FALHA NA RESOLUÇÃO DE DNS. O servidor Hostinger não consegue encontrar o Supabase.\n";
    echo "Sugestão: Contacte o suporte do Hostinger ou verifique se o projeto no Supabase está ativo.\n";
} else {
    echo "ESTADO: SUCESSO. DNS está a funcionar. O problema pode ser na firewall ou SSL.\n";
}

echo "\n--- TESTE DE CONECTIVIDADE (cURL) --- \n";
$url = 'https://cmmvcpmmffciqqjgxttv.supabase.co/rest/v1/profiles?select=*';
$headers = [
    'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtbXZjcG1tZmZjaXFxamd4dHR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzk2NDQsImV4cCI6MjA4NTg1NTY0NH0.e1Jn5QleprY2RmKmx0FOqsGDvt5hI_8Pbo9Dh7Z2n30',
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "URL: $url\n";
echo "HTTP Code: $httpCode\n";
if ($error) {
    echo "Erro cURL: $error\n";
} else {
    echo "Resposta recebida com sucesso (Tamanho: " . strlen($response) . " chars)\n";
}

echo "\n--- TESTE PAYSGATOR --- \n";
$pg_url = 'https://paysgator.com/api/v1/payment/create';
$ch_pg = curl_init($pg_url);
curl_setopt($ch_pg, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch_pg, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch_pg, CURLOPT_TIMEOUT, 10);
curl_exec($ch_pg);
$pg_code = curl_getinfo($ch_pg, CURLINFO_HTTP_CODE);
echo "Conectividade PaysGator (HTTPS): Code $pg_code\n";
curl_close($ch_pg);
?>