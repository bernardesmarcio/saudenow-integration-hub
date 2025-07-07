import { NextApiRequest, NextApiResponse } from 'next';
import { produtoService } from '../../../../services/core/produtoService';
import { validateProductBulkCreate } from '../../../../lib/validation/productValidator';
import {
  asyncHandler,
  sendSuccess,
  ValidationError,
  validateMethod,
  validateContentType,
} from '../../../../lib/middleware/errorMiddleware';
import { getCorsMiddleware, requestLogger } from '../../../../lib/middleware/corsMiddleware';

/**
 * @swagger
 * /api/v1/produtos/bulk:
 *   post:
 *     summary: Criar produtos em lote
 *     description: Cria múltiplos produtos de uma vez. Processa todos os produtos e retorna relatório de sucessos e falhas.
 *     tags: [Produtos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - produtos
 *             properties:
 *               produtos:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *                 items:
 *                   $ref: '#/components/schemas/ProdutoCreate'
 *                 description: Lista de produtos a serem criados
 *           example:
 *             produtos:
 *               - sku: "PRD-001"
 *                 nome: "Paracetamol 500mg"
 *                 categoria: "Medicamentos"
 *                 preco: 12.50
 *                 custo: 8.00
 *               - sku: "PRD-002"
 *                 nome: "Dipirona 500mg"
 *                 categoria: "Medicamentos"
 *                 preco: 15.80
 *                 custo: 10.50
 *               - sku: "PRD-003"
 *                 nome: "Álcool em Gel 70%"
 *                 categoria: "Higiene"
 *                 preco: 8.50
 *                 custo: 5.00
 *     responses:
 *       200:
 *         description: Processamento em lote concluído
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: Total de produtos processados
 *                           example: 3
 *                         success:
 *                           type: integer
 *                           description: Número de produtos criados com sucesso
 *                           example: 2
 *                         failed:
 *                           type: integer
 *                           description: Número de produtos que falharam
 *                           example: 1
 *                         errors:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               index:
 *                                 type: integer
 *                                 description: Índice do produto na lista
 *                               sku:
 *                                 type: string
 *                                 description: SKU do produto que falhou
 *                               error:
 *                                 type: string
 *                                 description: Mensagem de erro
 *                           example:
 *                             - index: 2
 *                               sku: "PRD-003"
 *                               error: "Produto com SKU 'PRD-003' já existe"
 *                     message:
 *                       type: string
 *                       example: "Processamento em lote concluído: 2 sucessos, 1 falha"
 *       400:
 *         $ref: '#/components/responses/400'
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
  validateMethod(['POST'])(req, res, () => {});

  if (req.method === 'POST') {
    return await handleBulkCreateProdutos(req, res);
  }
}

// Handle POST /api/v1/produtos/bulk - Bulk create products
async function handleBulkCreateProdutos(req: NextApiRequest, res: NextApiResponse) {
  // Validate content type
  validateContentType(req, res, () => {});

  // Validate request body
  const validation = validateProductBulkCreate(req.body);
  if (!validation.success) {
    throw new ValidationError('Dados para criação em lote inválidos', validation.errors);
  }

  const { produtos } = validation.data;

  // Log the bulk operation start
  console.log(`Iniciando criação em lote de ${produtos.length} produtos`);

  // Process bulk creation
  const result = await produtoService.bulkCreate(produtos);

  // Log the result
  console.log(`Criação em lote concluída: ${result.success} sucessos, ${result.failed} falhas`);

  // Generate response message
  let message = `Processamento em lote concluído: ${result.success} sucessos`;
  if (result.failed > 0) {
    message += `, ${result.failed} falhas`;
  }

  // Send response
  sendSuccess(res, result, message);
}

export default asyncHandler(handler);