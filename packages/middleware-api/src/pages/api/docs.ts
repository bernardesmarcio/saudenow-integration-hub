import { NextApiRequest, NextApiResponse } from 'next';
import { swaggerSpec } from '../../lib/swagger';

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Get OpenAPI specification
 *     description: Returns the OpenAPI 3.0 specification for the API in JSON format
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: OpenAPI specification returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: 'Método não permitido',
    });
  }

  // Set appropriate headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes

  // Return the Swagger specification
  res.status(200).json(swaggerSpec);
}