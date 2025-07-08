import { z } from 'zod'

// Shared schemas
const dimensoesSchema = z
  .object({
    altura: z.number().positive().optional(),
    largura: z.number().positive().optional(),
    profundidade: z.number().positive().optional(),
  })
  .optional()

const metadataSchema = z.record(z.any()).optional()

// Create product schema
export const ProductCreateSchema = z
  .object({
    sku: z
      .string()
      .min(1, 'SKU é obrigatório')
      .max(50, 'SKU deve ter no máximo 50 caracteres')
      .regex(
        /^[A-Z0-9_-]+$/,
        'SKU deve conter apenas letras maiúsculas, números, hífens e underscores'
      ),
    nome: z
      .string()
      .min(1, 'Nome é obrigatório')
      .max(200, 'Nome deve ter no máximo 200 caracteres'),
    descricao: z
      .string()
      .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
      .optional(),
    categoria: z
      .string()
      .max(100, 'Categoria deve ter no máximo 100 caracteres')
      .optional(),
    preco: z
      .number()
      .positive('Preço deve ser maior que zero')
      .max(999999.99, 'Preço deve ser menor que 1 milhão')
      .optional(),
    custo: z
      .number()
      .positive('Custo deve ser maior que zero')
      .max(999999.99, 'Custo deve ser menor que 1 milhão')
      .optional(),
    peso: z
      .number()
      .positive('Peso deve ser maior que zero')
      .max(9999.999, 'Peso deve ser menor que 10 toneladas')
      .optional(),
    dimensoes: dimensoesSchema,
    imagens: z
      .array(z.string().url('URL da imagem deve ser válida'))
      .max(10, 'Máximo 10 imagens permitidas')
      .optional(),
    ativo: z.boolean().optional().default(true),
    sap_id: z
      .string()
      .max(50, 'SAP ID deve ter no máximo 50 caracteres')
      .optional(),
    crm_id: z
      .string()
      .max(50, 'CRM ID deve ter no máximo 50 caracteres')
      .optional(),
    shopify_id: z
      .string()
      .max(50, 'Shopify ID deve ter no máximo 50 caracteres')
      .optional(),
    retail_id: z
      .string()
      .max(50, 'Retail ID deve ter no máximo 50 caracteres')
      .optional(),
    metadata: metadataSchema,
  })
  .refine(
    (data) => {
      // Validação customizada: se preço for fornecido, custo também deve ser
      if (data.preco && !data.custo) {
        return false
      }
      return true
    },
    {
      message: 'Custo é obrigatório quando preço é fornecido',
      path: ['custo'],
    }
  )
  .refine(
    (data) => {
      // Validação customizada: custo não pode ser maior que preço
      if (data.preco && data.custo && data.custo > data.preco) {
        return false
      }
      return true
    },
    {
      message: 'Custo não pode ser maior que o preço',
      path: ['custo'],
    }
  )

// Update product schema (all fields optional except validations)
export const ProductUpdateSchema = z
  .object({
    sku: z
      .string()
      .min(1, 'SKU não pode estar vazio')
      .max(50, 'SKU deve ter no máximo 50 caracteres')
      .regex(
        /^[A-Z0-9_-]+$/,
        'SKU deve conter apenas letras maiúsculas, números, hífens e underscores'
      )
      .optional(),
    nome: z
      .string()
      .min(1, 'Nome não pode estar vazio')
      .max(200, 'Nome deve ter no máximo 200 caracteres')
      .optional(),
    descricao: z
      .string()
      .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
      .optional(),
    categoria: z
      .string()
      .max(100, 'Categoria deve ter no máximo 100 caracteres')
      .optional(),
    preco: z
      .number()
      .positive('Preço deve ser maior que zero')
      .max(999999.99, 'Preço deve ser menor que 1 milhão')
      .optional(),
    custo: z
      .number()
      .positive('Custo deve ser maior que zero')
      .max(999999.99, 'Custo deve ser menor que 1 milhão')
      .optional(),
    peso: z
      .number()
      .positive('Peso deve ser maior que zero')
      .max(9999.999, 'Peso deve ser menor que 10 toneladas')
      .optional(),
    dimensoes: dimensoesSchema,
    imagens: z
      .array(z.string().url('URL da imagem deve ser válida'))
      .max(10, 'Máximo 10 imagens permitidas')
      .optional(),
    ativo: z.boolean().optional(),
    sap_id: z
      .string()
      .max(50, 'SAP ID deve ter no máximo 50 caracteres')
      .optional(),
    crm_id: z
      .string()
      .max(50, 'CRM ID deve ter no máximo 50 caracteres')
      .optional(),
    shopify_id: z
      .string()
      .max(50, 'Shopify ID deve ter no máximo 50 caracteres')
      .optional(),
    retail_id: z
      .string()
      .max(50, 'Retail ID deve ter no máximo 50 caracteres')
      .optional(),
    metadata: metadataSchema,
  })
  .refine(
    (data) => {
      // Validação customizada: custo não pode ser maior que preço
      if (data.preco && data.custo && data.custo > data.preco) {
        return false
      }
      return true
    },
    {
      message: 'Custo não pode ser maior que o preço',
      path: ['custo'],
    }
  )

// UUID validation schema
export const UUIDSchema = z.string().uuid('ID deve ser um UUID válido')

// Query parameters schema for listing products
export const ProductListQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val >= 1, 'Página deve ser maior que 0'),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20))
      .refine(
        (val) => val >= 1 && val <= 100,
        'Limite deve estar entre 1 e 100'
      ),
    search: z
      .string()
      .max(200, 'Termo de busca deve ter no máximo 200 caracteres')
      .optional(),
    categoria: z
      .string()
      .max(100, 'Categoria deve ter no máximo 100 caracteres')
      .optional(),
    ativo: z
      .string()
      .optional()
      .transform((val) => {
        if (val === 'true') return true
        if (val === 'false') return false
        return undefined
      }),
    sap_id: z.string().max(50).optional(),
    crm_id: z.string().max(50).optional(),
    shopify_id: z.string().max(50).optional(),
    retail_id: z.string().max(50).optional(),
    sort_by: z
      .enum(['nome', 'sku', 'categoria', 'preco', 'created_at', 'updated_at'])
      .optional()
      .default('created_at'),
    sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
    preco_min: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine(
        (val) => val === undefined || val >= 0,
        'Preço mínimo deve ser maior ou igual a zero'
      ),
    preco_max: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine(
        (val) => val === undefined || val >= 0,
        'Preço máximo deve ser maior ou igual a zero'
      ),
  })
  .refine(
    (data) => {
      // Validação customizada: preço mínimo não pode ser maior que máximo
      if (data.preco_min && data.preco_max && data.preco_min > data.preco_max) {
        return false
      }
      return true
    },
    {
      message: 'Preço mínimo não pode ser maior que o preço máximo',
      path: ['preco_min'],
    }
  )

// Bulk create schema
export const ProductBulkCreateSchema = z.object({
  produtos: z
    .array(ProductCreateSchema)
    .min(1, 'Pelo menos um produto deve ser fornecido')
    .max(100, 'Máximo 100 produtos por operação em lote'),
})

// Type exports
export type ProductCreateInput = z.infer<typeof ProductCreateSchema>
export type ProductUpdateInput = z.infer<typeof ProductUpdateSchema>
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>
export type ProductBulkCreateInput = z.infer<typeof ProductBulkCreateSchema>

// Validation helper functions
export function validateProductCreate(
  data: unknown
):
  | { success: true; data: ProductCreateInput }
  | { success: false; errors: string[] } {
  try {
    const validated = ProductCreateSchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(
          (err) => `${err.path.join('.')}: ${err.message}`
        ),
      }
    }
    return { success: false, errors: ['Erro de validação desconhecido'] }
  }
}

export function validateProductUpdate(
  data: unknown
):
  | { success: true; data: ProductUpdateInput }
  | { success: false; errors: string[] } {
  try {
    const validated = ProductUpdateSchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(
          (err) => `${err.path.join('.')}: ${err.message}`
        ),
      }
    }
    return { success: false, errors: ['Erro de validação desconhecido'] }
  }
}

export function validateProductListQuery(
  query: unknown
):
  | { success: true; data: ProductListQuery }
  | { success: false; errors: string[] } {
  try {
    const validated = ProductListQuerySchema.parse(query)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(
          (err) => `${err.path.join('.')}: ${err.message}`
        ),
      }
    }
    return { success: false, errors: ['Erro de validação desconhecido'] }
  }
}

export function validateUUID(
  id: unknown
): { success: true; data: string } | { success: false; errors: string[] } {
  try {
    const validated = UUIDSchema.parse(id)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((err) => err.message),
      }
    }
    return { success: false, errors: ['Erro de validação desconhecido'] }
  }
}

export function validateProductBulkCreate(
  data: unknown
):
  | { success: true; data: ProductBulkCreateInput }
  | { success: false; errors: string[] } {
  try {
    const validated = ProductBulkCreateSchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(
          (err) => `${err.path.join('.')}: ${err.message}`
        ),
      }
    }
    return { success: false, errors: ['Erro de validação desconhecido'] }
  }
}
