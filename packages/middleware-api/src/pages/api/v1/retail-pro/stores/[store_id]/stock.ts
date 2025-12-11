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
const stockQuerySchema = z.object({
  store_id: z.string().min(1, "Store ID é obrigatório"),
  product_sids: z
    .string()
    .optional()
    .transform((val) =>
      val ? val.split(",").map((s) => s.trim()) : undefined,
    ),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(50),
  status: z
    .enum(["in_stock", "out_of_stock", "low_stock", "all"])
    .default("all"),
  force_refresh: z.coerce.boolean().default(false),
});

/**
 * @swagger
 * /api/v1/retail-pro/stores/{store_id}/stock:
 *   get:
 *     summary: Consultar estoque de uma loja Retail Pro
 *     description: Retorna informações de estoque de produtos de uma loja específica
 *     tags: [Retail Pro]
 *     parameters:
 *       - in: path
 *         name: store_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da loja (ex: resende)
 *       - in: query
 *         name: product_sids
 *         schema:
 *           type: string
 *         description: Lista de SIDs de produtos separados por vírgula
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [in_stock, out_of_stock, low_stock, all]
 *           default: all
 *         description: Filtrar por status de estoque
 *       - in: query
 *         name: force_refresh
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Forçar atualização do cache
 *     responses:
 *       200:
 *         description: Informações de estoque retornadas com sucesso
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
 *                         stock:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               product_sid:
 *                                 type: string
 *                               product_alu:
 *                                 type: string
 *                               product_description:
 *                                 type: string
 *                               store_sid:
 *                                 type: string
 *                               store_name:
 *                                 type: string
 *                               quantity:
 *                                 type: number
 *                               minimum_quantity:
 *                                 type: number
 *                               po_ordered_quantity:
 *                                 type: number
 *                               po_received_quantity:
 *                                 type: number
 *                               status:
 *                                 type: string
 *                                 enum: [in_stock, out_of_stock, low_stock, no_data]
 *                               last_updated:
 *                                 type: string
 *                                 format: date-time
 *                         summary:
 *                           type: object
 *                           properties:
 *                             total_products:
 *                               type: integer
 *                             in_stock:
 *                               type: integer
 *                             out_of_stock:
 *                               type: integer
 *                             low_stock:
 *                               type: integer
 *                             no_data:
 *                               type: integer
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
 *             example:
 *               success: true
 *               data:
 *                 stock:
 *                   - product_sid: "123456789"
 *                     product_alu: "PROD-001"
 *                     product_description: "Produto Exemplo"
 *                     store_sid: "621769196001438846"
 *                     store_name: "Loja Resende"
 *                     quantity: 150
 *                     minimum_quantity: 10
 *                     po_ordered_quantity: 50
 *                     po_received_quantity: 25
 *                     status: "in_stock"
 *                     last_updated: "2024-01-15T10:30:00Z"
 *                 summary:
 *                   total_products: 234
 *                   in_stock: 180
 *                   out_of_stock: 25
 *                   low_stock: 20
 *                   no_data: 9
 *                 pagination:
 *                   page: 1
 *                   limit: 50
 *                   total: 234
 *                   has_more: true
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
    return await handleGetStock(req, res);
  }
}

async function handleGetStock(req: NextApiRequest, res: NextApiResponse) {
  // Validate query parameters
  const validation = stockQuerySchema.safeParse({
    store_id: req.query.store_id,
    ...req.query,
  });

  if (!validation.success) {
    throw new ValidationError(
      "Parâmetros inválidos",
      validation.error.errors.map((e) => e.message),
    );
  }

  const { store_id, product_sids, page, limit, status, force_refresh } =
    validation.data;

  // Validate store exists
  const supportedStores = ["resende"]; // This would come from config
  if (!supportedStores.includes(store_id)) {
    throw new ValidationError(`Loja '${store_id}' não encontrada`);
  }

  // Map store_id to actual store SID
  const storeSidMap: Record<string, string> = {
    resende: "621769196001438846",
  };
  const storeSid = storeSidMap[store_id];

  try {
    // This would integrate with the RetailProService
    const offset = (page - 1) * limit;

    // Mock data for now - in real implementation this would call RetailProService
    const mockStock = generateMockStock(
      limit,
      offset,
      status,
      product_sids,
      storeSid,
    );

    const response = {
      stock: mockStock.items,
      summary: mockStock.summary,
      pagination: {
        page,
        limit,
        total: mockStock.total,
        has_more: offset + limit < mockStock.total,
      },
      cache_info: {
        cached: !force_refresh,
        cached_at: new Date().toISOString(),
        ttl: 300, // 5 minutes
      },
    };

    sendSuccess(res, response);
  } catch (error) {
    throw new Error(
      `Erro ao buscar estoque da loja ${store_id}: ${(error as Error).message}`,
    );
  }
}

// Mock function - replace with real RetailProService integration
function generateMockStock(
  limit: number,
  offset: number,
  status: string,
  productSids?: string[],
  storeSid?: string,
) {
  const totalProducts = productSids ? productSids.length : 30000;
  const items = [];

  // Generate summary statistics
  const summary = {
    total_products: totalProducts,
    in_stock: Math.floor(totalProducts * 0.7),
    out_of_stock: Math.floor(totalProducts * 0.1),
    low_stock: Math.floor(totalProducts * 0.15),
    no_data: Math.floor(totalProducts * 0.05),
  };

  for (let i = 0; i < limit && offset + i < totalProducts; i++) {
    const index = offset + i + 1;
    const quantity = Math.floor(Math.random() * 200);
    const minQuantity = Math.floor(Math.random() * 20);

    let itemStatus: string;
    if (quantity === 0) {
      itemStatus = "out_of_stock";
    } else if (quantity <= minQuantity) {
      itemStatus = "low_stock";
    } else {
      itemStatus = "in_stock";
    }

    // Apply status filter
    if (status !== "all" && status !== itemStatus) {
      continue;
    }

    const stockItem = {
      product_sid: productSids
        ? productSids[index - 1]
        : `${index.toString().padStart(10, "0")}`,
      product_alu: `PROD-${index.toString().padStart(3, "0")}`,
      product_description: `Produto ${index}`,
      store_sid: storeSid || "621769196001438846",
      store_name: "Loja Resende",
      quantity,
      minimum_quantity: minQuantity,
      po_ordered_quantity: Math.floor(Math.random() * 50),
      po_received_quantity: Math.floor(Math.random() * 30),
      status: itemStatus,
      last_updated: new Date().toISOString(),
    };

    items.push(stockItem);
  }

  return {
    items,
    summary,
    total: totalProducts,
  };
}

export default asyncHandler(handler);
