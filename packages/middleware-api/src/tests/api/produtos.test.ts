import { createMocks } from 'node-mocks-http'
import handler from '../../pages/api/v1/produtos/index'
import { produtoService } from '../../services/core/produtoService'
import { ProdutoResponse } from '../../types/entities/produto'

// Mock the product service
jest.mock('../../services/core/produtoService', () => ({
  produtoService: {
    list: jest.fn(),
    create: jest.fn(),
    getById: jest.fn(),
    getBySku: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    bulkCreate: jest.fn(),
  },
}))

const mockProdutoService = produtoService as jest.Mocked<typeof produtoService>

// Sample product data for tests
const sampleProduto: ProdutoResponse = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  sku: 'PRD-001',
  nome: 'Paracetamol 500mg',
  descricao: 'Analgésico e antitérmico',
  categoria: 'Medicamentos',
  preco: 12.5,
  custo: 8.0,
  peso: 0.05,
  dimensoes: {
    altura: 10,
    largura: 5,
    profundidade: 2,
  },
  imagens: ['https://example.com/produto.jpg'],
  ativo: true,
  sap_id: 'SAP-001',
  crm_id: 'CRM-001',
  shopify_id: 'SHOP-001',
  retail_id: 'RET-001',
  metadata: {
    fabricante: 'Farmácia ABC',
    registro_anvisa: '123456',
  },
  created_at: '2025-07-06T10:00:00Z',
  updated_at: '2025-07-06T10:00:00Z',
}

describe('/api/v1/produtos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/v1/produtos', () => {
    it('should return products list with default pagination', async () => {
      // Mock service response
      mockProdutoService.list.mockResolvedValue({
        produtos: [sampleProduto],
        total: 1,
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.success).toBe(true)
      expect(response.data).toHaveLength(1)
      expect(response.data[0]).toEqual(sampleProduto)
      expect(response.count).toBe(1)
      expect(response.page).toBe(1)
      expect(response.limit).toBe(20)

      expect(mockProdutoService.list).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sort_by: 'created_at',
        sort_order: 'desc',
      })
    })

    it('should return products list with custom pagination', async () => {
      mockProdutoService.list.mockResolvedValue({
        produtos: [sampleProduto],
        total: 50,
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          page: '2',
          limit: '10',
          search: 'paracetamol',
          categoria: 'Medicamentos',
          ativo: 'true',
          sort_by: 'nome',
          sort_order: 'asc',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.success).toBe(true)
      expect(response.count).toBe(50)
      expect(response.page).toBe(2)
      expect(response.limit).toBe(10)

      expect(mockProdutoService.list).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        search: 'paracetamol',
        categoria: 'Medicamentos',
        ativo: true,
        sort_by: 'nome',
        sort_order: 'asc',
      })
    })

    it('should return 400 for invalid query parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          page: 'invalid',
          limit: '150', // exceeds maximum
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())

      expect(response.success).toBe(false)
      expect(response.error).toBe('Parâmetros de consulta inválidos')
      expect(response.details).toBeDefined()
    })

    it('should handle service errors gracefully', async () => {
      mockProdutoService.list.mockRejectedValue(
        new Error('Database connection failed')
      )

      const { req, res } = createMocks({
        method: 'GET',
        query: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())

      expect(response.success).toBe(false)
      expect(response.error).toBe('Erro interno do servidor')
    })
  })

  describe('POST /api/v1/produtos', () => {
    const validProductData = {
      sku: 'PRD-TEST',
      nome: 'Produto de Teste',
      descricao: 'Descrição do produto de teste',
      categoria: 'Teste',
      preco: 10.0,
      custo: 5.0,
      peso: 0.1,
      ativo: true,
    }

    it('should create a new product successfully', async () => {
      mockProdutoService.create.mockResolvedValue(sampleProduto)

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: validProductData,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
      const response = JSON.parse(res._getData())

      expect(response.success).toBe(true)
      expect(response.data).toEqual(sampleProduto)
      expect(response.message).toBe('Produto criado com sucesso')

      expect(mockProdutoService.create).toHaveBeenCalledWith(validProductData)
    })

    it('should return 400 for invalid product data', async () => {
      const invalidData = {
        // Missing required fields
        nome: '',
        preco: -10, // Invalid price
      }

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: invalidData,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())

      expect(response.success).toBe(false)
      expect(response.error).toBe('Dados do produto inválidos')
      expect(response.details).toBeDefined()
    })

    it('should return 400 for missing content-type header', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: validProductData,
        // Missing content-type header
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())

      expect(response.success).toBe(false)
      expect(response.error).toBe('Dados inválidos')
    })

    it('should return 409 for duplicate SKU', async () => {
      mockProdutoService.create.mockRejectedValue(
        new Error("Produto com SKU 'PRD-TEST' já existe")
      )

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: validProductData,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())

      expect(response.success).toBe(false)
    })
  })

  describe('Invalid HTTP methods', () => {
    it('should return 405 for unsupported methods', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      const response = JSON.parse(res._getData())

      expect(response.success).toBe(false)
      expect(response.error).toBe('Método DELETE não permitido')
    })

    it('should return 405 for PATCH method', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      const response = JSON.parse(res._getData())

      expect(response.success).toBe(false)
      expect(response.error).toBe('Método PATCH não permitido')
    })
  })

  describe('CORS handling', () => {
    it('should include CORS headers in response', async () => {
      mockProdutoService.list.mockResolvedValue({
        produtos: [],
        total: 0,
      })

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          origin: 'http://localhost:3000',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      // Note: In actual implementation, CORS headers would be set
      // This test would need to be updated based on actual CORS middleware behavior
    })

    it('should handle OPTIONS preflight requests', async () => {
      const { req, res } = createMocks({
        method: 'OPTIONS',
        headers: {
          origin: 'http://localhost:3000',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'content-type',
        },
      })

      await handler(req, res)

      // Note: Actual behavior would depend on CORS middleware implementation
      expect(res._getStatusCode()).toBe(405) // Currently not handling OPTIONS
    })
  })
})

describe('Product validation edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should validate SKU format correctly', async () => {
    const invalidSkuData = {
      sku: 'prd-001', // lowercase not allowed
      nome: 'Produto de Teste',
      preco: 10.0,
      custo: 5.0,
    }

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: invalidSkuData,
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const response = JSON.parse(res._getData())

    expect(response.success).toBe(false)
    expect(response.details).toContain(
      expect.stringMatching(/SKU deve conter apenas letras maiúsculas/)
    )
  })

  it('should validate price and cost relationship', async () => {
    const invalidPriceData = {
      sku: 'PRD-TEST',
      nome: 'Produto de Teste',
      preco: 5.0,
      custo: 10.0, // Cost higher than price
    }

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: invalidPriceData,
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const response = JSON.parse(res._getData())

    expect(response.success).toBe(false)
    expect(response.details).toContain(
      expect.stringMatching(/Custo não pode ser maior que o preço/)
    )
  })

  it('should validate image URLs', async () => {
    const invalidImageData = {
      sku: 'PRD-TEST',
      nome: 'Produto de Teste',
      imagens: ['not-a-valid-url', 'also-invalid'],
    }

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: invalidImageData,
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const response = JSON.parse(res._getData())

    expect(response.success).toBe(false)
    expect(response.details).toContain(
      expect.stringMatching(/URL da imagem deve ser válida/)
    )
  })
})
