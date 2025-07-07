import { NextApiRequest, NextApiResponse } from 'next';
import { produtoService } from '../../../../services/core/produtoService';
import {
  validateProductUpdate,
  validateUUID,
} from '../../../../lib/validation/productValidator';
import {
  asyncHandler,
  sendSuccess,
  sendNoContent,
  ValidationError,
  NotFoundError,
  validateMethod,
  validateContentType,
} from '../../../../lib/middleware/errorMiddleware';
import { getCorsMiddleware, requestLogger } from '../../../../lib/middleware/corsMiddleware';

/**
 * @swagger
 * /api/v1/produtos/{id}:
 *   get:
 *     summary: Buscar produto por ID
 *     description: Retorna um produto específico pelo seu ID
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único do produto
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Produto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Produto'
 *             example:
 *               success: true
 *               data:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 sku: "PRD-001"
 *                 nome: "Paracetamol 500mg"
 *                 descricao: "Analgésico e antitérmico"
 *                 categoria: "Medicamentos"
 *                 preco: 12.50
 *                 custo: 8.00
 *                 ativo: true
 *                 created_at: "2025-07-06T10:00:00Z"
 *                 updated_at: "2025-07-06T10:00:00Z"
 *       400:
 *         $ref: '#/components/responses/400'
 *       404:
 *         $ref: '#/components/responses/404'
 *       500:
 *         $ref: '#/components/responses/500'
 *
 *   put:
 *     summary: Atualizar produto
 *     description: Atualiza um produto existente
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único do produto
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProdutoUpdate'
 *           example:
 *             nome: "Paracetamol 500mg - Novo"
 *             preco: 15.00
 *             ativo: true
 *             metadata:
 *               fabricante: "Farmácia XYZ"
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso
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
 *                       example: "Produto atualizado com sucesso"
 *       400:
 *         $ref: '#/components/responses/400'
 *       404:
 *         $ref: '#/components/responses/404'
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
 *
 *   delete:
 *     summary: Excluir produto
 *     description: Remove um produto do sistema
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único do produto
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       204:
 *         description: Produto excluído com sucesso
 *       400:
 *         $ref: '#/components/responses/400'
 *       404:
 *         $ref: '#/components/responses/404'
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
  validateMethod(['GET', 'PUT', 'DELETE'])(req, res, () => {});

  // Validate and extract ID from path
  const { id } = req.query;
  const idValidation = validateUUID(id);
  if (!idValidation.success) {
    throw new ValidationError('ID do produto inválido', idValidation.errors);
  }

  const productId = idValidation.data;

  if (req.method === 'GET') {
    return await handleGetProduto(productId, req, res);
  } else if (req.method === 'PUT') {
    return await handleUpdateProduto(productId, req, res);
  } else if (req.method === 'DELETE') {
    return await handleDeleteProduto(productId, req, res);
  }
}

// Handle GET /api/v1/produtos/[id] - Get product by ID
async function handleGetProduto(id: string, req: NextApiRequest, res: NextApiResponse) {
  // Get product from service
  const produto = await produtoService.getById(id);

  if (!produto) {
    throw new NotFoundError('Produto não encontrado');
  }

  // Send response
  sendSuccess(res, produto);
}

// Handle PUT /api/v1/produtos/[id] - Update product
async function handleUpdateProduto(id: string, req: NextApiRequest, res: NextApiResponse) {
  // Validate content type
  validateContentType(req, res, () => {});

  // Validate request body
  const validation = validateProductUpdate(req.body);
  if (!validation.success) {
    throw new ValidationError('Dados do produto inválidos', validation.errors);
  }

  const updateData = validation.data;

  // Check if there's something to update
  if (Object.keys(updateData).length === 0) {
    throw new ValidationError('Nenhum campo para atualizar foi fornecido');
  }

  // Update product
  const produto = await produtoService.update(id, updateData);

  // Send response
  sendSuccess(res, produto, 'Produto atualizado com sucesso');
}

// Handle DELETE /api/v1/produtos/[id] - Delete product
async function handleDeleteProduto(id: string, req: NextApiRequest, res: NextApiResponse) {
  // Delete product
  await produtoService.delete(id);

  // Send response
  sendNoContent(res);
}

export default asyncHandler(handler);