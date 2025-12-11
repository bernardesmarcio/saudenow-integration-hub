import { NextApiRequest, NextApiResponse } from "next";
import {
  asyncHandler,
  sendSuccess,
  validateMethod,
} from "../../../../lib/middleware/errorMiddleware";
import {
  getCorsMiddleware,
  requestLogger,
} from "../../../../lib/middleware/corsMiddleware";

/**
 * @swagger
 * /api/v1/retail-pro:
 *   get:
 *     summary: Listar integrações Retail Pro
 *     description: Retorna informações sobre as integrações Retail Pro configuradas
 *     tags: [Retail Pro]
 *     responses:
 *       200:
 *         description: Lista de integrações Retail Pro
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
 *                         stores:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               sid:
 *                                 type: string
 *                               active:
 *                                 type: boolean
 *                               last_sync:
 *                                 type: string
 *                                 format: date-time
 *                         system_info:
 *                           type: object
 *                           properties:
 *                             version:
 *                               type: string
 *                             base_url:
 *                               type: string
 *                             health_status:
 *                               type: string
 *                               enum: [healthy, degraded, unhealthy]
 *             example:
 *               success: true
 *               data:
 *                 stores:
 *                   - id: "resende"
 *                     name: "Loja Resende"
 *                     sid: "621769196001438846"
 *                     active: true
 *                     last_sync: "2024-01-15T10:30:00Z"
 *                 system_info:
 *                   version: "1.0.0"
 *                   base_url: "http://macserver-pdv.maconequi.local"
 *                   health_status: "healthy"
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
    return await handleGetRetailProInfo(req, res);
  }
}

async function handleGetRetailProInfo(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const retailProInfo = {
      stores: [
        {
          id: "resende",
          name: "Loja Resende",
          sid: "621769196001438846",
          active: true,
          last_sync: null, // This would come from database in real implementation
        },
      ],
      system_info: {
        version: "1.0.0",
        base_url:
          process.env.RETAIL_PRO_BASE_URL ||
          "http://macserver-pdv.maconequi.local",
        health_status: "healthy", // This would come from health check
      },
    };

    sendSuccess(res, retailProInfo);
  } catch (error) {
    throw new Error("Erro ao buscar informações do Retail Pro");
  }
}

export default asyncHandler(handler);
