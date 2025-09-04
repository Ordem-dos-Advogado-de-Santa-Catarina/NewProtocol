<?php
session_start(); // Inicia a sessão para armazenar o login
header('Content-Type: application/json');

// Nossos "bancos de dados"
$agendamentosFile = 'agendamentos.json';
$bloqueiosFile = 'bloqueios.json';
$usersFile = 'login.json';

// Garante que os arquivos de dados existam
if (!file_exists($agendamentosFile)) file_put_contents($agendamentosFile, '[]');
if (!file_exists($bloqueiosFile)) file_put_contents($bloqueiosFile, '[]');

function getJsonData($file) {
    return json_decode(file_get_contents($file), true);
}

function saveJsonData($file, $data) {
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// --- ROTEAMENTO DE AÇÕES ---

// Ação de Login
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'login') {
    $users = getJsonData($usersFile);
    foreach ($users as $user) {
        if ($user['user'] === $input['user'] && $user['senha'] === $input['senha']) {
            $_SESSION['user'] = $user;
            echo json_encode(['status' => 'success', 'user' => $user]);
            exit;
        }
    }
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Usuário ou senha inválidos.']);
    exit;
}

// Ação de Logout
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'logout') {
    session_destroy();
    echo json_encode(['status' => 'success']);
    exit;
}

// Ação para obter o status do login (verificar sessão)
if ($method === 'GET' && isset($_GET['action']) && $_GET['action'] === 'status') {
    if (isset($_SESSION['user'])) {
        echo json_encode(['loggedIn' => true, 'user' => $_SESSION['user']]);
    } else {
        echo json_encode(['loggedIn' => false]);
    }
    exit;
}

// Obter dados da agenda (Agendamentos e Bloqueios)
if ($method === 'GET') {
    $agendamentos = getJsonData($agendamentosFile);
    $bloqueios = getJsonData($bloqueiosFile);
    $response = [];

    if (isset($_GET['month'])) {
        $month = $_GET['month'];
        $response['agendamentos'] = array_filter($agendamentos, fn($a) => strpos($a['date'], $month) === 0);
        $response['bloqueios'] = array_filter($bloqueios, fn($b) => strpos($b['date'], $month) === 0);
    } elseif (isset($_GET['date'])) {
        $date = $_GET['date'];
        $response['agendamentos'] = array_filter($agendamentos, fn($a) => $a['date'] === $date);
        $response['bloqueios'] = array_filter($bloqueios, fn($b) => $b['date'] === $date);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Parâmetro "date" ou "month" não especificado.']);
        exit;
    }
    echo json_encode($response);
    exit;
}

// Ações que exigem login
if (!isset($_SESSION['user'])) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Acesso negado. Faça o login.']);
    exit;
}

// Ação de Agendar (Permissão: advogado)
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'book') {
    if ($_SESSION['user']['permissao'] !== 'advogado') {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Você não tem permissão para agendar.']);
        exit;
    }
    
    $agendamentos = getJsonData($agendamentosFile);
    $novoAgendamento = ['date' => $input['date'], 'time' => $input['time'], 'user' => $_SESSION['user']['user']];
    $agendamentos[] = $novoAgendamento;
    saveJsonData($agendamentosFile, $agendamentos);
    echo json_encode(['status' => 'success', 'message' => 'Agendado com sucesso!']);
    exit;
}

// Ação de Bloquear/Desbloquear (Permissão: admin)
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'toggle_block') {
    if ($_SESSION['user']['permissao'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Você não tem permissão para bloquear horários.']);
        exit;
    }

    $bloqueios = getJsonData($bloqueiosFile);
    $date = $input['date'];
    $time = $input['time'];
    $index = -1;

    foreach ($bloqueios as $i => $bloqueio) {
        if ($bloqueio['date'] === $date && $bloqueio['time'] === $time) {
            $index = $i;
            break;
        }
    }

    if ($index >= 0) { // Se encontrou, remove (desbloqueia)
        array_splice($bloqueios, $index, 1);
        $message = 'Horário desbloqueado.';
    } else { // Se não encontrou, adiciona (bloqueia)
        $bloqueios[] = ['date' => $date, 'time' => $time];
        $message = 'Horário bloqueado.';
    }

    saveJsonData($bloqueiosFile, $bloqueios);
    echo json_encode(['status' => 'success', 'message' => $message]);
    exit;
}

http_response_code(400);
echo json_encode(['status' => 'error', 'message' => 'Ação inválida.']);
?>