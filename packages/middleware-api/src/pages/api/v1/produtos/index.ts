import { NextApiRequest, NextApiResponse } from 'next';
import { produtoService } from '../../../../services/core/produtoService';
import {
  validateProductCreate,
  validateProductListQuery,
} from '../../../../lib/validation/productValidator';
import {
  asyncHandler,
  sendSuccess,
  sendCreated,
  ValidationError,
  validateMethod,
  validateContentType,
  composeMiddleware,
} from '../../../../lib/middleware/errorMiddleware';
import { getCorsMiddleware, requestLogger } from '../../../../lib/middleware/corsMiddleware';

/**
 * @swagger
 * /api/v1/produtos:
 *   get:
 *     summary: Listar produtos
 *     description: Retorna uma lista paginada de produtos com opções de filtro e busca
 *     tags: [Produtos]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Limite de itens por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 200
 *         description: Termo de busca (nome, SKU ou descrição)
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Filtrar por categoria
 *       - in: query
 *         name: ativo
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo/inativo
 *       - in: query
 *         name: sap_id
 *         schema:
 *           type: string
 *         description: Filtrar por ID do SAP
 *       - in: query
 *         name: crm_id
 *         schema:
 *           type: string
 *         description: Filtrar por ID do CRM
 *       - in: query
 *         name: shopify_id
 *         schema:
 *           type: string
 *         description: Filtrar por ID do Shopify
 *       - in: query
 *         name: retail_id
 *         schema:
 *           type: string
 *         description: Filtrar por ID do Retail
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [nome, sku, categoria, preco, created_at, updated_at]
 *           default: created_at
 *         description: Campo para ordenação
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordem da classificação
 *       - in: query
 *         name: preco_min
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Preço mínimo
 *       - in: query
 *         name: preco_max
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Preço máximo
 *     responses:
 *       200:
 *         description: Lista de produtos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Produto'
 *                     count:
 *                       type: integer
 *                       description: Total de registros encontrados
 *                     page:
 *                       type: integer
 *                       description: Página atual
 *                     limit:
 *                       type: integer
 *                       description: Limite de itens por página
 *             example:
 *               success: true
 *               data:
 *                 - id: "550e8400-e29b-41d4-a716-446655440000"
 *                   sku: "PRD-001"
 *                   nome: "Paracetamol 500mg"
 *                   categoria: "Medicamentos"
 *                   preco: 12.50
 *                   ativo: true
 *               count: 50
 *               page: 1
 *               limit: 20
 *       400:
 *         $ref: '#/components/responses/400'
 *       500:
 *         $ref: '#/components/responses/500'
 *
 *   post:
 *     summary: Criar produto
 *     description: Cria um novo produto no sistema
 *     tags: [Produtos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProdutoCreate'
 *           example:
 *             sku: "PRD-001"
 *             nome: "Paracetamol 500mg"
 *             descricao: "Analgésico e antitérmico"
 *             categoria: "Medicamentos"
 *             preco: 12.50
 *             custo: 8.00
 *             peso: 0.050
 *             dimensoes:
 *               altura: 10
 *               largura: 5
 *               profundidade: 2
 *             imagens:
 *               - "https://example.com/produto.jpg"
 *             ativo: true
 *             metadata:
 *               fabricante: "Farmácia ABC"
 *               registro_anvisa: "123456"
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Produto'
 *                     message:
 *                       type: string
 *                       example: "Produto criado com sucesso"
 *       400:
 *         $ref: '#/components/responses/400'
 *       409:
 *         description: Conflito - SKU já existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example:
 *               success: false
 *               error: "Produto com SKU 'PRD-001' já existe"
 *       500:
 *         $ref: '#/components/responses/500'
 */

const corsMiddleware = getCorsMiddleware();

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apply CORS
  corsMiddleware(req, res, () => {});

  // Apply request logging
  requestLogger(req, res, () => {});

  // Validate HTTP method
  validateMethod(['GET', 'POST'])(req, res, () => {});

  if (req.method === 'GET') {
    return await handleGetProdutos(req, res);
  } else if (req.method === 'POST') {
    return await handleCreateProduto(req, res);
  }
}

// Handle GET /api/v1/produtos - List products
async function handleGetProdutos(req: NextApiRequest, res: NextApiResponse) {
  // Validate query parameters
  const validation = validateProductListQuery(req.query);
  if (!validation.success) {
    throw new ValidationError('Parâmetros de consulta inválidos', validation.errors);
  }

  const query = validation.data;

  // Get products from service
  const result = await produtoService.list(query);

  // Send response
  sendSuccess(res, result.produtos, undefined, {
    count: result.total,
    page: query.page,
    limit: query.limit,
  });
}

// Handle POST /api/v1/produtos - Create product
async function handleCreateProduto(req: NextApiRequest, res: NextApiResponse) {
  // Validate content type
  validateContentType(req, res, () => {});

  // Validate request body
  const validation = validateProductCreate(req.body);
  if (!validation.success) {
    throw new ValidationError('Dados do produto inválidos', validation.errors);
  }

  const productData = validation.data;

  // Create product
  const produto = await produtoService.create(productData);

  // Send response
  sendCreated(res, produto, 'Produto criado com sucesso');
}

export default asyncHandler(handler);