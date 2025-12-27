<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getProducts($pdo);
        break;
    case 'POST':
        createProduct($pdo);
        break;
    case 'PUT':
        updateProduct($pdo);
        break;
    case 'DELETE':
        deleteProduct($pdo);
        break;
    default:
        http_response_code(405);
        echo json_encode(["message" => "Método não permitido."]);
        break;
}

function getProducts($pdo) {
    try {
        $stmt = $pdo->query("SELECT * FROM products ORDER BY name ASC");
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Formatar números se necessário, mas o fetchAll já traz como string ou number dependendo do driver
        // O frontend espera campos camelCase? O banco usa snake_case.
        // Vamos converter para camelCase para manter compatibilidade com o Frontend React
        
        $formattedProducts = array_map(function($p) {
            return [
                'id' => $p['id'],
                'code' => $p['code'],
                'name' => $p['name'],
                'category' => $p['category'],
                'subcategory' => $p['subcategory'],
                'brand' => $p['brand'],
                'supplier' => $p['supplier'],
                'unit' => $p['unit'],
                'costPrice' => (float)$p['cost_price'],
                'retailPrice' => (float)$p['retail_price'],
                'wholesalePrice' => (float)$p['wholesale_price'],
                'wholesaleMinQty' => (float)$p['wholesale_min_qty'],
                'stock' => (float)$p['stock'],
                'minStock' => (float)$p['min_stock'],
                'expiryDate' => $p['expiry_date']
            ];
        }, $products);

        echo json_encode($formattedProducts);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Erro ao buscar produtos: " . $e->getMessage()]);
    }
}

function createProduct($pdo) {
    $data = json_decode(file_get_contents("php://input"));

    if (
        !empty($data->name) &&
        !empty($data->code) &&
        !empty($data->category) &&
        !empty($data->retailPrice)
    ) {
        try {
            // Se o ID não for fornecido, o banco gera (UUID), mas o frontend pode estar enviando um ID temporário.
            // O ideal é deixar o banco gerar ou usar o do frontend se for um UUID válido.
            // Vamos assumir que o frontend envia um ID (UUID v4) gerado no cliente ou deixamos o banco gerar.
            // O esquema SQL diz: id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
            
            $id = !empty($data->id) ? $data->id : null; // Se vier null, o banco gera? Não, precisa ajustar a query.
            
            // Vamos verificar se o ID já existe ou se é novo.
            // Para simplificar, se vier ID, usamos ele.
            
            $sql = "INSERT INTO products (
                        id, code, name, category, subcategory, brand, supplier, unit, 
                        cost_price, retail_price, wholesale_price, wholesale_min_qty, 
                        stock, min_stock, expiry_date
                    ) VALUES (
                        :id, :code, :name, :category, :subcategory, :brand, :supplier, :unit, 
                        :cost_price, :retail_price, :wholesale_price, :wholesale_min_qty, 
                        :stock, :min_stock, :expiry_date
                    )";
            
            // Se não tiver ID, precisamos gerar um ou deixar o banco. 
            // Como o PDO não retorna o UUID gerado facilmente no INSERT sem RETURNING (Postgres) ou query extra,
            // e o frontend React já gera UUIDs (crypto.randomUUID()), vamos usar o ID do frontend.
            
            if (empty($id)) {
                 // Fallback se o frontend não mandar ID (improvável no código atual)
                 // Mas o código React usa crypto.randomUUID() antes de salvar.
                 http_response_code(400);
                 echo json_encode(["message" => "ID do produto é obrigatório."]);
                 return;
            }

            $stmt = $pdo->prepare($sql);

            $stmt->bindParam(":id", $id);
            $stmt->bindParam(":code", $data->code);
            $stmt->bindParam(":name", $data->name);
            $stmt->bindParam(":category", $data->category);
            $stmt->bindParam(":subcategory", $data->subcategory);
            $stmt->bindParam(":brand", $data->brand);
            $stmt->bindParam(":supplier", $data->supplier);
            $stmt->bindParam(":unit", $data->unit);
            $stmt->bindParam(":cost_price", $data->costPrice);
            $stmt->bindParam(":retail_price", $data->retailPrice);
            $stmt->bindParam(":wholesale_price", $data->wholesalePrice);
            $stmt->bindParam(":wholesale_min_qty", $data->wholesaleMinQty);
            $stmt->bindParam(":stock", $data->stock);
            $stmt->bindParam(":min_stock", $data->minStock);
            $stmt->bindParam(":expiry_date", $data->expiryDate);

            if ($stmt->execute()) {
                http_response_code(201);
                echo json_encode(["message" => "Produto criado com sucesso.", "id" => $id]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Não foi possível criar o produto."]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Erro no banco de dados: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Dados incompletos."]);
    }
}

function updateProduct($pdo) {
    $data = json_decode(file_get_contents("php://input"));

    if (!empty($data->id)) {
        try {
            $sql = "UPDATE products SET 
                        code = :code,
                        name = :name,
                        category = :category,
                        subcategory = :subcategory,
                        brand = :brand,
                        supplier = :supplier,
                        unit = :unit,
                        cost_price = :cost_price,
                        retail_price = :retail_price,
                        wholesale_price = :wholesale_price,
                        wholesale_min_qty = :wholesale_min_qty,
                        stock = :stock,
                        min_stock = :min_stock,
                        expiry_date = :expiry_date
                    WHERE id = :id";

            $stmt = $pdo->prepare($sql);

            $stmt->bindParam(":id", $data->id);
            $stmt->bindParam(":code", $data->code);
            $stmt->bindParam(":name", $data->name);
            $stmt->bindParam(":category", $data->category);
            $stmt->bindParam(":subcategory", $data->subcategory);
            $stmt->bindParam(":brand", $data->brand);
            $stmt->bindParam(":supplier", $data->supplier);
            $stmt->bindParam(":unit", $data->unit);
            $stmt->bindParam(":cost_price", $data->costPrice);
            $stmt->bindParam(":retail_price", $data->retailPrice);
            $stmt->bindParam(":wholesale_price", $data->wholesalePrice);
            $stmt->bindParam(":wholesale_min_qty", $data->wholesaleMinQty);
            $stmt->bindParam(":stock", $data->stock);
            $stmt->bindParam(":min_stock", $data->minStock);
            $stmt->bindParam(":expiry_date", $data->expiryDate);

            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode(["message" => "Produto atualizado com sucesso."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Não foi possível atualizar o produto."]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Erro no banco de dados: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "ID do produto não fornecido."]);
    }
}

function deleteProduct($pdo) {
    // Para DELETE, o ID geralmente vem na URL query string ou no corpo.
    // Vamos checar ambos para robustez, mas o padrão REST é query string ou path param.
    // Aqui vou pegar do query string ?id=...
    
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    
    if (!$id) {
        $data = json_decode(file_get_contents("php://input"));
        if (!empty($data->id)) {
            $id = $data->id;
        }
    }

    if ($id) {
        try {
            $sql = "DELETE FROM products WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(":id", $id);

            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode(["message" => "Produto excluído com sucesso."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Não foi possível excluir o produto."]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Erro no banco de dados: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "ID do produto não fornecido."]);
    }
}
?>
