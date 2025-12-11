-- Seed data for dev schema tables
-- Date: 2025-07-06

-- Insert 10 sample products
INSERT INTO dev.produtos (sku, nome, descricao, categoria, preco, custo, peso, dimensoes, imagens, ativo, sap_id, crm_id, shopify_id, retail_id, metadata) VALUES
('PRD-001', 'Paracetamol 500mg', 'Analgésico e antitérmico', 'Medicamentos', 12.50, 8.00, 0.050, '{"altura": 10, "largura": 5, "profundidade": 2}', ARRAY['https://example.com/paracetamol.jpg'], true, 'SAP-001', 'CRM-001', 'SHOP-001', 'RET-001', '{"fabricante": "Farmácia ABC", "registro_anvisa": "123456"}'),
('PRD-002', 'Dipirona 500mg', 'Analgésico e antitérmico', 'Medicamentos', 15.80, 10.50, 0.060, '{"altura": 12, "largura": 6, "profundidade": 3}', ARRAY['https://example.com/dipirona.jpg'], true, 'SAP-002', 'CRM-002', 'SHOP-002', 'RET-002', '{"fabricante": "Farmácia XYZ", "registro_anvisa": "234567"}'),
('PRD-003', 'Ibuprofeno 400mg', 'Anti-inflamatório', 'Medicamentos', 18.90, 12.00, 0.070, '{"altura": 11, "largura": 5, "profundidade": 2}', ARRAY['https://example.com/ibuprofeno.jpg'], true, 'SAP-003', 'CRM-003', 'SHOP-003', 'RET-003', '{"fabricante": "Farmácia DEF", "registro_anvisa": "345678"}'),
('PRD-004', 'Termômetro Digital', 'Termômetro digital com visor LCD', 'Equipamentos', 45.00, 25.00, 0.150, '{"altura": 15, "largura": 3, "profundidade": 2}', ARRAY['https://example.com/termometro.jpg'], true, 'SAP-004', 'CRM-004', 'SHOP-004', 'RET-004', '{"garantia": "2 anos", "certificacao": "INMETRO"}'),
('PRD-005', 'Álcool em Gel 70%', 'Higienizador de mãos', 'Higiene', 8.50, 5.00, 0.500, '{"altura": 20, "largura": 8, "profundidade": 8}', ARRAY['https://example.com/alcool-gel.jpg'], true, 'SAP-005', 'CRM-005', 'SHOP-005', 'RET-005', '{"volume": "500ml", "concentracao": "70%"}'),
('PRD-006', 'Máscara Cirúrgica', 'Máscara descartável tripla camada', 'EPI', 2.50, 1.20, 0.020, '{"altura": 18, "largura": 9, "profundidade": 1}', ARRAY['https://example.com/mascara.jpg'], true, 'SAP-006', 'CRM-006', 'SHOP-006', 'RET-006', '{"tipo": "tripla_camada", "descartavel": true}'),
('PRD-007', 'Vitamina C 1000mg', 'Suplemento vitamínico', 'Suplementos', 25.00, 15.00, 0.100, '{"altura": 10, "largura": 5, "profundidade": 5}', ARRAY['https://example.com/vitamina-c.jpg'], true, 'SAP-007', 'CRM-007', 'SHOP-007', 'RET-007', '{"dosagem": "1000mg", "formato": "comprimido"}'),
('PRD-008', 'Aparelho de Pressão', 'Medidor de pressão arterial digital', 'Equipamentos', 120.00, 80.00, 0.800, '{"altura": 25, "largura": 20, "profundidade": 10}', ARRAY['https://example.com/pressao.jpg'], true, 'SAP-008', 'CRM-008', 'SHOP-008', 'RET-008', '{"tipo": "digital", "certificacao": "ANVISA"}'),
('PRD-009', 'Pomada Cicatrizante', 'Pomada para ferimentos', 'Medicamentos', 32.00, 20.00, 0.080, '{"altura": 8, "largura": 4, "profundidade": 4}', ARRAY['https://example.com/pomada.jpg'], true, 'SAP-009', 'CRM-009', 'SHOP-009', 'RET-009', '{"indicacao": "ferimentos", "principio_ativo": "dexpantenol"}'),
('PRD-010', 'Soro Fisiológico', 'Solução salina estéril', 'Soluções', 6.80, 4.00, 0.250, '{"altura": 15, "largura": 8, "profundidade": 3}', ARRAY['https://example.com/soro.jpg'], true, 'SAP-010', 'CRM-010', 'SHOP-010', 'RET-010', '{"volume": "250ml", "concentracao": "0.9%"}');

-- Insert 5 sample clients
INSERT INTO dev.clientes (cpf_cnpj, nome, email, telefone, endereco, tipo, ativo, sap_id, crm_id, shopify_id, retail_id, metadata) VALUES
('12345678901', 'João Silva Santos', 'joao.silva@email.com', '11987654321', '{"cep": "01234-567", "logradouro": "Rua das Flores", "numero": "123", "complemento": "Apto 45", "bairro": "Centro", "cidade": "São Paulo", "uf": "SP"}', 'pessoa_fisica', true, 'SAP-CLI-001', 'CRM-CLI-001', 'SHOP-CLI-001', 'RET-CLI-001', '{"preferencia_entrega": "manha", "cliente_vip": false}'),
('98765432100', 'Maria Oliveira Costa', 'maria.oliveira@email.com', '11876543210', '{"cep": "04567-890", "logradouro": "Avenida Paulista", "numero": "1000", "complemento": "Sala 200", "bairro": "Bela Vista", "cidade": "São Paulo", "uf": "SP"}', 'pessoa_fisica', true, 'SAP-CLI-002', 'CRM-CLI-002', 'SHOP-CLI-002', 'RET-CLI-002', '{"preferencia_entrega": "tarde", "cliente_vip": true}'),
('11223344556', 'Pedro Almeida Rocha', 'pedro.almeida@email.com', '11765432109', '{"cep": "02345-678", "logradouro": "Rua dos Pinheiros", "numero": "456", "complemento": "", "bairro": "Pinheiros", "cidade": "São Paulo", "uf": "SP"}', 'pessoa_fisica', true, 'SAP-CLI-003', 'CRM-CLI-003', 'SHOP-CLI-003', 'RET-CLI-003', '{"preferencia_entrega": "noite", "cliente_vip": false}'),
('12345678000195', 'Farmácia São José LTDA', 'contato@farmaciasaojose.com.br', '1133445566', '{"cep": "03456-789", "logradouro": "Rua Comercial", "numero": "789", "complemento": "Loja 1", "bairro": "Vila Madalena", "cidade": "São Paulo", "uf": "SP"}', 'pessoa_juridica', true, 'SAP-CLI-004', 'CRM-CLI-004', 'SHOP-CLI-004', 'RET-CLI-004', '{"tipo_cliente": "atacado", "desconto_padrao": 10}'),
('98765432000187', 'Drogaria Popular LTDA', 'vendas@drogariapopular.com.br', '1144556677', '{"cep": "05678-901", "logradouro": "Avenida Rebouças", "numero": "2000", "complemento": "Térreo", "bairro": "Pinheiros", "cidade": "São Paulo", "uf": "SP"}', 'pessoa_juridica', true, 'SAP-CLI-005', 'CRM-CLI-005', 'SHOP-CLI-005', 'RET-CLI-005', '{"tipo_cliente": "varejo", "desconto_padrao": 5}');

-- Insert stock records for each product
INSERT INTO dev.estoque (produto_id, deposito, quantidade, quantidade_reservada, ultima_movimentacao) VALUES
((SELECT id FROM dev.produtos WHERE sku = 'PRD-001'), 'DEP-01', 100, 10, NOW()),
((SELECT id FROM dev.produtos WHERE sku = 'PRD-001'), 'DEP-02', 50, 5, NOW()),
((SELECT id FROM dev.produtos WHERE sku = 'PRD-002'), 'DEP-01', 80, 8, NOW()),
((SELECT id FROM dev.produtos WHERE sku = 'PRD-002'), 'DEP-02', 120, 12, NOW()),
((SELECT id FROM dev.produtos WHERE sku = 'PRD-003'), 'DEP-01', 60, 6, NOW()),
((SELECT id FROM dev.produtos WHERE sku = 'PRD-003'), 'DEP-02', 40, 4, NOW()),
((SELECT id FROM dev.produtos WHERE sku = 'PRD-004'), 'DEP-01', 25, 2, NOW()),
((SELECT id FROM dev.produtos WHERE sku = 'PRD-004'), 'DEP-02', 15, 1, NOW()),
((SELECT id FROM dev.produtos WHERE sku = 'PRD-005'), 'DEP-01', 200, 20, NOW()),
((SELECT id FROM dev.produtos WHERE sku = 'PRD-005'), 'DEP-02', 150, 15, NOW()),
((SELECT id FROM dev.produtos WHERE sku = 'PRD-006'), 'DEP-01', 500, 50, NOW()),
((SELECT id FROM dev.produtos WHERE sku = 'PRD-006'), 'DEP-02', 300, 30, NOW()),
((SELECT id FROM dev.produtos WHERE sku = 'PRD-007'), 'DEP-01', 75, 7, NOW()),
((SELECT id FROM dev.produtos WHERE sku = 'PRD-007'), 'DEP-02', 85, 8, NOW()),
((SELECT id FROM dev.produtos WHERE sku = 'PRD-008'), 'DEP-01', 10, 1, NOW()),
((SELECT id FROM dev.produtos WHERE sku = 'PRD-008'), 'DEP-02', 8, 0, NOW()),
((SELECT id FROM dev.produtos WHERE sku = 'PRD-009'), 'DEP-01', 30, 3, NOW()),
((SELECT id FROM dev.produtos WHERE sku = 'PRD-009'), 'DEP-02', 25, 2, NOW()),
((SELECT id FROM dev.produtos WHERE sku = 'PRD-010'), 'DEP-01', 180, 18, NOW()),
((SELECT id FROM dev.produtos WHERE sku = 'PRD-010'), 'DEP-02', 220, 22, NOW());

-- Insert sample sales
INSERT INTO dev.vendas (numero_venda, cliente_id, data_venda, total, status, origem, origem_id, metadata) VALUES
('VND-001', (SELECT id FROM dev.clientes WHERE cpf_cnpj = '12345678901'), NOW() - INTERVAL '1 day', 37.50, 'entregue', 'shopify', 'SHOP-VND-001', '{"canal": "online", "desconto": 0, "frete": 12.50}'),
('VND-002', (SELECT id FROM dev.clientes WHERE cpf_cnpj = '98765432100'), NOW() - INTERVAL '2 days', 94.00, 'confirmada', 'retail', 'RET-VND-002', '{"canal": "loja_fisica", "desconto": 6.00, "vendedor": "Maria"}'),
('VND-003', (SELECT id FROM dev.clientes WHERE cpf_cnpj = '11223344556'), NOW() - INTERVAL '3 days', 18.90, 'entregue', 'crm', 'CRM-VND-003', '{"canal": "telefone", "desconto": 0, "operador": "Carlos"}'),
('VND-004', (SELECT id FROM dev.clientes WHERE cpf_cnpj = '12345678000195'), NOW() - INTERVAL '5 days', 450.00, 'entregue', 'sap', 'SAP-VND-004', '{"canal": "b2b", "desconto": 50.00, "prazo_pagamento": 30}'),
('VND-005', (SELECT id FROM dev.clientes WHERE cpf_cnpj = '98765432000187'), NOW() - INTERVAL '1 week', 280.00, 'cancelada', 'shopify', 'SHOP-VND-005', '{"canal": "online", "motivo_cancelamento": "produto_indisponivel"}'),
('VND-006', (SELECT id FROM dev.clientes WHERE cpf_cnpj = '12345678901'), NOW() - INTERVAL '1 hour', 65.50, 'pendente', 'retail', 'RET-VND-006', '{"canal": "loja_fisica", "desconto": 4.50, "vendedor": "João"}');

-- Insert sample integration logs
INSERT INTO dev.integration_logs (source, action, entity_type, entity_id, status, details, error_message, duration_ms, retry_count) VALUES
('sap', 'sync', 'produto', 'PRD-001', 'success', '{"records_processed": 1, "timestamp": "2025-07-06T10:00:00Z"}', NULL, 150, 0),
('shopify', 'create', 'cliente', '12345678901', 'success', '{"customer_id": "SHOP-CLI-001", "timestamp": "2025-07-06T10:05:00Z"}', NULL, 200, 0),
('crm', 'update', 'venda', 'VND-003', 'success', '{"sale_id": "CRM-VND-003", "timestamp": "2025-07-06T10:10:00Z"}', NULL, 180, 0),
('retail', 'sync', 'estoque', 'PRD-005', 'error', '{"attempted_sync": "2025-07-06T10:15:00Z"}', 'Connection timeout', 5000, 2),
('sap', 'create', 'produto', 'PRD-011', 'pending', '{"queued_at": "2025-07-06T10:20:00Z"}', NULL, NULL, 0),
('shopify', 'update', 'produto', 'PRD-002', 'retry', '{"last_attempt": "2025-07-06T10:25:00Z"}', 'Rate limit exceeded', 1000, 3),
('crm', 'delete', 'cliente', 'CLI-OLD-001', 'success', '{"deleted_at": "2025-07-06T10:30:00Z"}', NULL, 120, 0),
('retail', 'sync', 'venda', 'VND-007', 'error', '{"attempted_sync": "2025-07-06T10:35:00Z"}', 'Invalid product SKU', 300, 1),
('sap', 'update', 'estoque', 'PRD-008', 'success', '{"stock_updated": "2025-07-06T10:40:00Z", "quantity": 18}', NULL, 250, 0),
('shopify', 'create', 'venda', 'VND-008', 'success', '{"order_id": "SHOP-VND-008", "timestamp": "2025-07-06T10:45:00Z"}', NULL, 320, 0);

-- Insert sample users (standalone table, no FK constraint)
INSERT INTO dev.users (email, name, role, permissions, active, metadata) VALUES
('admin@saudenow.com', 'Admin User', 'admin', '{"products": ["create", "read", "update", "delete"], "clients": ["create", "read", "update", "delete"], "sales": ["create", "read", "update", "delete"], "reports": ["read"]}', true, '{"created_by": "system", "test_user": true}'),
('user@saudenow.com', 'Regular User', 'user', '{"products": ["read"], "clients": ["read"], "sales": ["read"]}', true, '{"created_by": "system", "test_user": true}'),
('readonly@saudenow.com', 'Read Only User', 'readonly', '{"products": ["read"], "clients": ["read"], "sales": ["read"]}', true, '{"created_by": "system", "test_user": true}');

-- Verification queries (commented out - uncomment to run checks)
-- SELECT COUNT(*) as total_produtos FROM dev.produtos;
-- SELECT COUNT(*) as total_clientes FROM dev.clientes;
-- SELECT COUNT(*) as total_estoque FROM dev.estoque;
-- SELECT COUNT(*) as total_vendas FROM dev.vendas;
-- SELECT COUNT(*) as total_logs FROM dev.integration_logs;
-- SELECT COUNT(*) as total_users FROM dev.users;

-- Summary query to verify all data
SELECT 
    'produtos' as tabela, COUNT(*) as total FROM dev.produtos
UNION ALL
SELECT 
    'clientes' as tabela, COUNT(*) as total FROM dev.clientes
UNION ALL
SELECT 
    'estoque' as tabela, COUNT(*) as total FROM dev.estoque
UNION ALL
SELECT 
    'vendas' as tabela, COUNT(*) as total FROM dev.vendas
UNION ALL
SELECT 
    'integration_logs' as tabela, COUNT(*) as total FROM dev.integration_logs
UNION ALL
SELECT 
    'users' as tabela, COUNT(*) as total FROM dev.users;