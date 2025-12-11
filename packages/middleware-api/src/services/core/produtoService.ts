import { dbAdmin as db, Tables } from "../../lib/database/supabase";
import {
  DevProduto,
  DevProdutoInsert,
  DevProdutoUpdate,
} from "../../lib/database/types";
import {
  ProdutoResponse,
  ProdutoCreateRequest,
  ProdutoUpdateRequest,
  ProdutoListQuery,
  BulkOperationResult,
} from "../../types/entities/produto";

export class ProdutoService {
  // Convert database record to API response
  private mapToResponse(produto: DevProduto): ProdutoResponse {
    return {
      id: produto.id,
      sku: produto.sku,
      nome: produto.nome,
      descricao: produto.descricao,
      categoria: produto.categoria,
      preco: produto.preco,
      custo: produto.custo,
      peso: produto.peso,
      dimensoes: produto.dimensoes,
      imagens: produto.imagens,
      ativo: produto.ativo,
      sap_id: produto.sap_id,
      crm_id: produto.crm_id,
      shopify_id: produto.shopify_id,
      retail_id: produto.retail_id,
      metadata: produto.metadata,
      created_at: produto.created_at,
      updated_at: produto.updated_at,
    };
  }

  // Convert API request to database insert
  private mapToInsert(request: ProdutoCreateRequest): DevProdutoInsert {
    return {
      sku: request.sku,
      nome: request.nome,
      descricao: request.descricao,
      categoria: request.categoria,
      preco: request.preco,
      custo: request.custo,
      peso: request.peso,
      dimensoes: request.dimensoes,
      imagens: request.imagens,
      ativo: request.ativo ?? true,
      sap_id: request.sap_id,
      crm_id: request.crm_id,
      shopify_id: request.shopify_id,
      retail_id: request.retail_id,
      metadata: request.metadata ?? {},
    };
  }

  // Convert API request to database update
  private mapToUpdate(request: ProdutoUpdateRequest): DevProdutoUpdate {
    const update: DevProdutoUpdate = {};

    if (request.sku !== undefined) update.sku = request.sku;
    if (request.nome !== undefined) update.nome = request.nome;
    if (request.descricao !== undefined) update.descricao = request.descricao;
    if (request.categoria !== undefined) update.categoria = request.categoria;
    if (request.preco !== undefined) update.preco = request.preco;
    if (request.custo !== undefined) update.custo = request.custo;
    if (request.peso !== undefined) update.peso = request.peso;
    if (request.dimensoes !== undefined) update.dimensoes = request.dimensoes;
    if (request.imagens !== undefined) update.imagens = request.imagens;
    if (request.ativo !== undefined) update.ativo = request.ativo;
    if (request.sap_id !== undefined) update.sap_id = request.sap_id;
    if (request.crm_id !== undefined) update.crm_id = request.crm_id;
    if (request.shopify_id !== undefined)
      update.shopify_id = request.shopify_id;
    if (request.retail_id !== undefined) update.retail_id = request.retail_id;
    if (request.metadata !== undefined) update.metadata = request.metadata;

    return update;
  }

  // List products with filtering, pagination, and search
  async list(
    query: ProdutoListQuery,
  ): Promise<{ produtos: ProdutoResponse[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        categoria,
        ativo,
        sap_id,
        crm_id,
        shopify_id,
        retail_id,
        sort_by = "created_at",
        sort_order = "desc",
        preco_min,
        preco_max,
      } = query;

      // Build filters
      const filters: Record<string, any> = {};

      if (categoria) filters.categoria = categoria;
      if (ativo !== undefined) filters.ativo = ativo;
      if (sap_id) filters.sap_id = sap_id;
      if (crm_id) filters.crm_id = crm_id;
      if (shopify_id) filters.shopify_id = shopify_id;
      if (retail_id) filters.retail_id = retail_id;

      // Calculate offset
      const offset = (page - 1) * limit;

      // Build query
      const selectQuery = "*";

      // Get products with basic filters
      const produtos = await db.select<DevProduto>(
        Tables.PRODUTOS,
        selectQuery,
        filters,
      );

      // Apply additional filters (search, price range)
      let filteredProdutos = produtos;

      // Search filter (nome, sku, descricao)
      if (search) {
        const searchLower = search.toLowerCase();
        filteredProdutos = filteredProdutos.filter(
          (produto) =>
            produto.nome.toLowerCase().includes(searchLower) ||
            produto.sku.toLowerCase().includes(searchLower) ||
            (produto.descricao &&
              produto.descricao.toLowerCase().includes(searchLower)),
        );
      }

      // Price range filter
      if (preco_min !== undefined) {
        filteredProdutos = filteredProdutos.filter(
          (produto) => produto.preco !== null && produto.preco >= preco_min,
        );
      }

      if (preco_max !== undefined) {
        filteredProdutos = filteredProdutos.filter(
          (produto) => produto.preco !== null && produto.preco <= preco_max,
        );
      }

      // Sort
      filteredProdutos.sort((a, b) => {
        let aValue: any = a[sort_by as keyof DevProduto];
        let bValue: any = b[sort_by as keyof DevProduto];

        // Handle null values
        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return sort_order === "asc" ? -1 : 1;
        if (bValue === null) return sort_order === "asc" ? 1 : -1;

        // Convert to string for comparison if needed
        if (typeof aValue === "string") aValue = aValue.toLowerCase();
        if (typeof bValue === "string") bValue = bValue.toLowerCase();

        if (aValue < bValue) return sort_order === "asc" ? -1 : 1;
        if (aValue > bValue) return sort_order === "asc" ? 1 : -1;
        return 0;
      });

      const total = filteredProdutos.length;

      // Apply pagination
      const paginatedProdutos = filteredProdutos.slice(offset, offset + limit);

      return {
        produtos: paginatedProdutos.map((produto) =>
          this.mapToResponse(produto),
        ),
        total,
      };
    } catch (error) {
      console.error("Error listing produtos:", error);
      throw new Error("Erro ao listar produtos");
    }
  }

  // Get product by ID
  async getById(id: string): Promise<ProdutoResponse | null> {
    try {
      const produtos = await db.select<DevProduto>(Tables.PRODUTOS, "*", {
        id,
      });

      if (produtos.length === 0) {
        return null;
      }

      return this.mapToResponse(produtos[0]);
    } catch (error) {
      console.error("Error getting produto by ID:", error);
      throw new Error("Erro ao buscar produto");
    }
  }

  // Get product by SKU
  async getBySku(sku: string): Promise<ProdutoResponse | null> {
    try {
      const produtos = await db.select<DevProduto>(Tables.PRODUTOS, "*", {
        sku,
      });

      if (produtos.length === 0) {
        return null;
      }

      return this.mapToResponse(produtos[0]);
    } catch (error) {
      console.error("Error getting produto by SKU:", error);
      throw new Error("Erro ao buscar produto por SKU");
    }
  }

  // Create product
  async create(request: ProdutoCreateRequest): Promise<ProdutoResponse> {
    try {
      // Check if SKU already exists
      const existingProduct = await this.getBySku(request.sku);
      if (existingProduct) {
        throw new Error(`Produto com SKU '${request.sku}' já existe`);
      }

      const insertData = this.mapToInsert(request);
      const produto = await db.insert<DevProduto>(Tables.PRODUTOS, insertData);

      return this.mapToResponse(produto);
    } catch (error) {
      console.error("Error creating produto:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erro ao criar produto");
    }
  }

  // Update product
  async update(
    id: string,
    request: ProdutoUpdateRequest,
  ): Promise<ProdutoResponse> {
    try {
      // Check if product exists
      const existingProduct = await this.getById(id);
      if (!existingProduct) {
        throw new Error("Produto não encontrado");
      }

      // Check if SKU is being changed and if it already exists
      if (request.sku && request.sku !== existingProduct.sku) {
        const productWithSku = await this.getBySku(request.sku);
        if (productWithSku && productWithSku.id !== id) {
          throw new Error(`Produto com SKU '${request.sku}' já existe`);
        }
      }

      const updateData = this.mapToUpdate(request);
      const produto = await db.update<DevProduto>(
        Tables.PRODUTOS,
        id,
        updateData,
      );

      return this.mapToResponse(produto);
    } catch (error) {
      console.error("Error updating produto:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erro ao atualizar produto");
    }
  }

  // Delete product
  async delete(id: string): Promise<void> {
    try {
      // Check if product exists
      const existingProduct = await this.getById(id);
      if (!existingProduct) {
        throw new Error("Produto não encontrado");
      }

      await db.delete(Tables.PRODUTOS, id);
    } catch (error) {
      console.error("Error deleting produto:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erro ao excluir produto");
    }
  }

  // Bulk create products
  async bulkCreate(
    requests: ProdutoCreateRequest[],
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      total: requests.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      try {
        await this.create(request);
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          index: i,
          sku: request.sku,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }

    return result;
  }

  // Check if product exists by ID
  async exists(id: string): Promise<boolean> {
    try {
      const produto = await this.getById(id);
      return produto !== null;
    } catch (error) {
      return false;
    }
  }

  // Get products count
  async getCount(): Promise<number> {
    try {
      const stats = await db.getTableStats(Tables.PRODUTOS);
      return stats.count;
    } catch (error) {
      console.error("Error getting produtos count:", error);
      throw new Error("Erro ao contar produtos");
    }
  }

  // Get products by external system ID
  async getByExternalId(
    system: "sap" | "crm" | "shopify" | "retail",
    externalId: string,
  ): Promise<ProdutoResponse[]> {
    try {
      const fieldMap = {
        sap: "sap_id",
        crm: "crm_id",
        shopify: "shopify_id",
        retail: "retail_id",
      };

      const field = fieldMap[system];
      const filters = { [field]: externalId };

      const produtos = await db.select<DevProduto>(
        Tables.PRODUTOS,
        "*",
        filters,
      );

      return produtos.map((produto) => this.mapToResponse(produto));
    } catch (error) {
      console.error("Error getting produtos by external ID:", error);
      throw new Error("Erro ao buscar produtos por ID externo");
    }
  }
}

// Export singleton instance
export const produtoService = new ProdutoService();
