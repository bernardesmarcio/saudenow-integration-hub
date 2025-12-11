import { NextApiRequest, NextApiResponse } from "next";
import {
  asyncHandler,
  sendSuccess,
  ValidationError,
  validateMethod,
} from "../../../../../../lib/middleware/errorMiddleware";
import {
  getCorsMiddleware,
  requestLogger,
} from "../../../../../../lib/middleware/corsMiddleware";
import { z } from "zod";

// Validation schemas
const productQuerySchema = z.object({
  store_id: z.string().min(1, "Store ID é obrigatório"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(50),
  search: z.string().optional(),
  include_stock: z.coerce.boolean().default(false),
  force_refresh: z.coerce.boolean().default(false),
});

/**
 * @swagger
 * /api/v1/retail-pro/stores/{store_id}/products:
 *   get:
 *     summary: Listar produtos de uma loja Retail Pro
 *     description: Retorna lista paginada de produtos de uma loja específica do Retail Pro
 *     tags: [Retail Pro]
 *     parameters:
 *       - in: path
 *         name: store_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da loja (ex: resende)
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
 *           maximum: 500
 *           default: 50
 *         description: Limite de itens por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca (nome, ALU, descrição)
 *       - in: query
 *         name: include_stock
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir informações de estoque
 *       - in: query
 *         name: force_refresh
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Forçar atualização do cache
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
 *                       type: object
 *                       properties:
 *                         products:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               sid:
 *                                 type: string
 *                               alu:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                               brand:
 *                                 type: string
 *                               upc:
 *                                 type: string
 *                               price:
 *                                 type: number
 *                               active:
 *                                 type: boolean
 *                               stock:
 *                                 type: object
 *                                 properties:
 *                                   quantity:
 *                                     type: number
 *                                   minimum_quantity:
 *                                     type: number
 *                                   status:
 *                                     type: string
 *                                     enum: [in_stock, out_of_stock, low_stock, no_data]
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                             limit:
 *                               type: integer
 *                             total:
 *                               type: integer
 *                             has_more:
 *                               type: boolean
 *                         cache_info:
 *                           type: object
 *                           properties:
 *                             cached:
 *                               type: boolean
 *                             cached_at:
 *                               type: string
 *                               format: date-time
 *             example:
 *               success: true
 *               data:
 *                 products:
 *                   - sid: "123456789"
 *                     alu: "PROD-001"
 *                     description: "Produto Exemplo"
 *                     brand: "Marca ABC"
 *                     upc: "1234567890123"
 *                     price: 29.99
 *                     active: true
 *                     stock:
 *                       quantity: 150
 *                       minimum_quantity: 10
 *                       status: "in_stock"
 *                 pagination:
 *                   page: 1
 *                   limit: 50
 *                   total: 234
 *                   has_more: true
 *                 cache_info:
 *                   cached: true
 *                   cached_at: "2024-01-15T10:30:00Z"
 *       400:
 *         $ref: '#/components/responses/400'
 *       404:
 *         description: Loja não encontrada
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
  validateMethod(["GET"])(req, res, () => {});

  if (req.method === "GET") {
    return await handleGetProducts(req, res);
  }
}

async function handleGetProducts(req: NextApiRequest, res: NextApiResponse) {
  // Validate query parameters
  const validation = productQuerySchema.safeParse({
    store_id: req.query.store_id,
    ...req.query,
  });

  if (!validation.success) {
    throw new ValidationError(
      "Parâmetros inválidos",
      validation.error.errors.map((e) => e.message),
    );
  }

  const { store_id, page, limit, search, include_stock, force_refresh } =
    validation.data;

  // Validate store exists
  const supportedStores = ["resende"]; // This would come from config
  if (!supportedStores.includes(store_id)) {
    throw new ValidationError(`Loja '${store_id}' não encontrada`);
  }

  try {
    // This would integrate with the RetailProService
    const offset = (page - 1) * limit;

    // Mock data for now - in real implementation this would call RetailProService
    const mockProducts = generateMockProducts(
      limit,
      offset,
      search,
      include_stock,
    );

    const response = {
      products: mockProducts,
      pagination: {
        page,
        limit,
        total: 30000, // Mock total
        has_more: offset + limit < 30000,
      },
      cache_info: {
        cached: !force_refresh,
        cached_at: new Date().toISOString(),
      },
    };

    sendSuccess(res, response);
  } catch (error) {
    throw new Error(
      `Erro ao buscar produtos da loja ${store_id}: ${(error as Error).message}`,
    );
  }
}

// Mock function - replace with real RetailProService integration
function generateMockProducts(
  limit: number,
  offset: number,
  search?: string,
  includeStock?: boolean,
) {
  const products = [];

  for (let i = 0; i < limit; i++) {
    const index = offset + i + 1;
    const product = {
      sid: `${index.toString().padStart(10, "0")}`,
      alu: `PROD-${index.toString().padStart(3, "0")}`,
      description: `Produto ${index}${search ? ` - ${search}` : ""}`,
      brand: `Marca ${String.fromCharCode(65 + (index % 26))}`,
      upc: `${Math.random().toString().substring(2, 15)}`,
      price: Math.round(Math.random() * 100 * 100) / 100,
      active: Math.random() > 0.1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (includeStock) {
      const quantity = Math.floor(Math.random() * 200);
      const minQuantity = Math.floor(Math.random() * 20);

      (product as any).stock = {
        quantity,
        minimum_quantity: minQuantity,
        po_ordered_quantity: Math.floor(Math.random() * 50),
        po_received_quantity: Math.floor(Math.random() * 30),
        status:
          quantity === 0
            ? "out_of_stock"
            : quantity <= minQuantity
              ? "low_stock"
              : "in_stock",
        last_updated: new Date().toISOString(),
      };
    }

    products.push(product);
  }

  return products;
}

export default asyncHandler(handler);
