import swaggerJSDoc from "swagger-jsdoc";

const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SaúdeNow Integration Hub API",
      version: "1.0.0",
      description: "Hub de integração event-driven para sistemas de saúde",
      contact: {
        name: "SaúdeNow Team",
        email: "dev@saudenow.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
      {
        url: "https://api.saudenow.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        apiKey: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
        },
      },
      responses: {
        400: {
          description: "Dados de entrada inválidos",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ApiError",
              },
              example: {
                success: false,
                error: "Dados inválidos",
                details: ["Campo sku é obrigatório"],
              },
            },
          },
        },
        404: {
          description: "Recurso não encontrado",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ApiError",
              },
              example: {
                success: false,
                error: "Produto não encontrado",
              },
            },
          },
        },
        500: {
          description: "Erro interno do servidor",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ApiError",
              },
              example: {
                success: false,
                error: "Erro interno do servidor",
              },
            },
          },
        },
      },
      schemas: {
        // Produto Schemas
        Produto: {
          type: "object",
          required: ["id", "sku", "nome", "ativo", "created_at", "updated_at"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "ID único do produto",
              example: "550e8400-e29b-41d4-a716-446655440000",
            },
            sku: {
              type: "string",
              minLength: 1,
              maxLength: 50,
              description: "Código SKU único do produto",
              example: "PRD-001",
            },
            nome: {
              type: "string",
              minLength: 1,
              maxLength: 200,
              description: "Nome do produto",
              example: "Paracetamol 500mg",
            },
            descricao: {
              type: "string",
              nullable: true,
              description: "Descrição detalhada do produto",
              example: "Analgésico e antitérmico",
            },
            categoria: {
              type: "string",
              nullable: true,
              description: "Categoria do produto",
              example: "Medicamentos",
            },
            preco: {
              type: "number",
              format: "decimal",
              minimum: 0,
              nullable: true,
              description: "Preço de venda",
              example: 12.5,
            },
            custo: {
              type: "number",
              format: "decimal",
              minimum: 0,
              nullable: true,
              description: "Custo do produto",
              example: 8.0,
            },
            peso: {
              type: "number",
              format: "decimal",
              minimum: 0,
              nullable: true,
              description: "Peso em kg",
              example: 0.05,
            },
            dimensoes: {
              type: "object",
              nullable: true,
              description: "Dimensões do produto",
              properties: {
                altura: { type: "number", example: 10 },
                largura: { type: "number", example: 5 },
                profundidade: { type: "number", example: 2 },
              },
            },
            imagens: {
              type: "array",
              items: {
                type: "string",
                format: "url",
              },
              nullable: true,
              description: "URLs das imagens do produto",
              example: ["https://example.com/produto.jpg"],
            },
            ativo: {
              type: "boolean",
              description: "Status ativo/inativo",
              example: true,
            },
            sap_id: {
              type: "string",
              nullable: true,
              description: "ID no sistema SAP",
              example: "SAP-001",
            },
            crm_id: {
              type: "string",
              nullable: true,
              description: "ID no sistema CRM",
              example: "CRM-001",
            },
            shopify_id: {
              type: "string",
              nullable: true,
              description: "ID no Shopify",
              example: "SHOP-001",
            },
            retail_id: {
              type: "string",
              nullable: true,
              description: "ID no sistema Retail",
              example: "RET-001",
            },
            metadata: {
              type: "object",
              description: "Metadados adicionais",
              example: {
                fabricante: "Farmácia ABC",
                registro_anvisa: "123456",
              },
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Data de criação",
              example: "2025-07-06T10:00:00Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              description: "Data da última atualização",
              example: "2025-07-06T10:00:00Z",
            },
          },
        },
        ProdutoCreate: {
          type: "object",
          required: ["sku", "nome"],
          properties: {
            sku: {
              type: "string",
              minLength: 1,
              maxLength: 50,
              description: "Código SKU único do produto",
              example: "PRD-001",
            },
            nome: {
              type: "string",
              minLength: 1,
              maxLength: 200,
              description: "Nome do produto",
              example: "Paracetamol 500mg",
            },
            descricao: {
              type: "string",
              description: "Descrição detalhada do produto",
              example: "Analgésico e antitérmico",
            },
            categoria: {
              type: "string",
              description: "Categoria do produto",
              example: "Medicamentos",
            },
            preco: {
              type: "number",
              format: "decimal",
              minimum: 0,
              description: "Preço de venda",
              example: 12.5,
            },
            custo: {
              type: "number",
              format: "decimal",
              minimum: 0,
              description: "Custo do produto",
              example: 8.0,
            },
            peso: {
              type: "number",
              format: "decimal",
              minimum: 0,
              description: "Peso em kg",
              example: 0.05,
            },
            dimensoes: {
              type: "object",
              description: "Dimensões do produto",
              properties: {
                altura: { type: "number", example: 10 },
                largura: { type: "number", example: 5 },
                profundidade: { type: "number", example: 2 },
              },
            },
            imagens: {
              type: "array",
              items: {
                type: "string",
                format: "url",
              },
              description: "URLs das imagens do produto",
              example: ["https://example.com/produto.jpg"],
            },
            ativo: {
              type: "boolean",
              description: "Status ativo/inativo",
              example: true,
            },
            sap_id: {
              type: "string",
              description: "ID no sistema SAP",
              example: "SAP-001",
            },
            crm_id: {
              type: "string",
              description: "ID no sistema CRM",
              example: "CRM-001",
            },
            shopify_id: {
              type: "string",
              description: "ID no Shopify",
              example: "SHOP-001",
            },
            retail_id: {
              type: "string",
              description: "ID no sistema Retail",
              example: "RET-001",
            },
            metadata: {
              type: "object",
              description: "Metadados adicionais",
              example: {
                fabricante: "Farmácia ABC",
                registro_anvisa: "123456",
              },
            },
          },
        },
        ProdutoUpdate: {
          type: "object",
          properties: {
            sku: {
              type: "string",
              minLength: 1,
              maxLength: 50,
              description: "Código SKU único do produto",
              example: "PRD-001",
            },
            nome: {
              type: "string",
              minLength: 1,
              maxLength: 200,
              description: "Nome do produto",
              example: "Paracetamol 500mg",
            },
            descricao: {
              type: "string",
              description: "Descrição detalhada do produto",
              example: "Analgésico e antitérmico",
            },
            categoria: {
              type: "string",
              description: "Categoria do produto",
              example: "Medicamentos",
            },
            preco: {
              type: "number",
              format: "decimal",
              minimum: 0,
              description: "Preço de venda",
              example: 12.5,
            },
            custo: {
              type: "number",
              format: "decimal",
              minimum: 0,
              description: "Custo do produto",
              example: 8.0,
            },
            peso: {
              type: "number",
              format: "decimal",
              minimum: 0,
              description: "Peso em kg",
              example: 0.05,
            },
            dimensoes: {
              type: "object",
              description: "Dimensões do produto",
              properties: {
                altura: { type: "number", example: 10 },
                largura: { type: "number", example: 5 },
                profundidade: { type: "number", example: 2 },
              },
            },
            imagens: {
              type: "array",
              items: {
                type: "string",
                format: "url",
              },
              description: "URLs das imagens do produto",
              example: ["https://example.com/produto.jpg"],
            },
            ativo: {
              type: "boolean",
              description: "Status ativo/inativo",
              example: true,
            },
            sap_id: {
              type: "string",
              description: "ID no sistema SAP",
              example: "SAP-001",
            },
            crm_id: {
              type: "string",
              description: "ID no sistema CRM",
              example: "CRM-001",
            },
            shopify_id: {
              type: "string",
              description: "ID no Shopify",
              example: "SHOP-001",
            },
            retail_id: {
              type: "string",
              description: "ID no sistema Retail",
              example: "RET-001",
            },
            metadata: {
              type: "object",
              description: "Metadados adicionais",
              example: {
                fabricante: "Farmácia ABC",
                registro_anvisa: "123456",
              },
            },
          },
        },
        // Response Schemas
        ApiResponse: {
          type: "object",
          required: ["success"],
          properties: {
            success: {
              type: "boolean",
              description: "Indica se a operação foi bem-sucedida",
              example: true,
            },
            data: {
              description: "Dados da resposta",
            },
            message: {
              type: "string",
              description: "Mensagem da resposta",
              example: "Operação realizada com sucesso",
            },
            count: {
              type: "integer",
              description: "Número total de registros (para listagens)",
              example: 10,
            },
            page: {
              type: "integer",
              description: "Página atual (para paginação)",
              example: 1,
            },
            limit: {
              type: "integer",
              description: "Limite de registros por página",
              example: 20,
            },
          },
        },
        ApiError: {
          type: "object",
          required: ["success", "error"],
          properties: {
            success: {
              type: "boolean",
              description: "Sempre false para erros",
              example: false,
            },
            error: {
              type: "string",
              description: "Mensagem de erro",
              example: "Dados inválidos",
            },
            details: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Detalhes específicos do erro",
              example: ["Campo sku é obrigatório", "Campo nome é obrigatório"],
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Produtos",
        description: "Operações relacionadas a produtos",
      },
      {
        name: "Clientes",
        description: "Operações relacionadas a clientes",
      },
      {
        name: "Estoque",
        description: "Operações relacionadas a estoque",
      },
      {
        name: "Vendas",
        description: "Operações relacionadas a vendas",
      },
      {
        name: "Integração",
        description: "Operações de integração com sistemas externos",
      },
      {
        name: "Health",
        description: "Health checks e status do sistema",
      },
    ],
  },
  apis: ["./src/pages/api/**/*.ts", "./src/pages/api/**/*.js"],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Export helper functions for common responses
export const swaggerResponses = {
  200: {
    description: "Operação realizada com sucesso",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/ApiResponse",
        },
      },
    },
  },
  201: {
    description: "Recurso criado com sucesso",
    content: {
      "application/json": {
        schema: {
          allOf: [
            { $ref: "#/components/schemas/ApiResponse" },
            {
              properties: {
                message: {
                  example: "Produto criado com sucesso",
                },
              },
            },
          ],
        },
      },
    },
  },
  400: {
    description: "Dados de entrada inválidos",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/ApiError",
        },
        example: {
          success: false,
          error: "Dados inválidos",
          details: ["Campo sku é obrigatório"],
        },
      },
    },
  },
  404: {
    description: "Recurso não encontrado",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/ApiError",
        },
        example: {
          success: false,
          error: "Produto não encontrado",
        },
      },
    },
  },
  500: {
    description: "Erro interno do servidor",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/ApiError",
        },
        example: {
          success: false,
          error: "Erro interno do servidor",
        },
      },
    },
  },
};
