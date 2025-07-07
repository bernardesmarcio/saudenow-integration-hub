import { useState } from 'react';
import Head from 'next/head';

export default function TestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async (endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`/api/v1${endpoint}`, options);
      const data = await response.json();
      
      setResult({
        status: response.status,
        statusText: response.statusText,
        data: data,
        headers: Object.fromEntries(response.headers.entries())
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testCreateProduct = () => {
    const newProduct = {
      nome: "Vitamina D3 2000UI",
      sku: "VIT-D3-001",
      categoria: "Suplementos",
      preco: 35.90,
      custo: 18.50,
      descricao: "Vitamina D3 para saúde óssea",
      ativo: true,
      sap_id: "SAP-VIT-D3-001"
    };
    
    testAPI('/produtos', 'POST', newProduct);
  };

  return (
    <>
      <Head>
        <title>Teste da API - SaúdeNow Integration Hub</title>
      </Head>

      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>🧪 Teste da API - SaúdeNow Integration Hub</h1>
        
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            onClick={() => testAPI('/produtos')}
            style={{ padding: '1rem', fontSize: '1rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            GET /produtos - Listar todos os produtos
          </button>
          
          <button 
            onClick={() => testAPI('/produtos/1')}
            style={{ padding: '1rem', fontSize: '1rem', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            GET /produtos/1 - Buscar produto por ID
          </button>
          
          <button 
            onClick={testCreateProduct}
            style={{ padding: '1rem', fontSize: '1rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            POST /produtos - Criar novo produto
          </button>
          
          <button 
            onClick={() => testAPI('/produtos?categoria=Medicamentos')}
            style={{ padding: '1rem', fontSize: '1rem', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            GET /produtos?categoria=Medicamentos - Filtrar por categoria
          </button>
        </div>

        {loading && <div style={{ padding: '1rem', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px' }}>🔄 Carregando...</div>}
        
        {error && (
          <div style={{ padding: '1rem', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', marginBottom: '1rem' }}>
            ❌ Erro: {error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: '2rem' }}>
            <h3>📊 Resultado:</h3>
            <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '4px', border: '1px solid #dee2e6' }}>
              <p><strong>Status:</strong> {result.status} {result.statusText}</p>
              <details>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>📄 Dados da Resposta</summary>
                <pre style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '4px', overflow: 'auto', marginTop: '0.5rem' }}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
              <details style={{ marginTop: '1rem' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>🔧 Headers da Resposta</summary>
                <pre style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '4px', overflow: 'auto', marginTop: '0.5rem' }}>
                  {JSON.stringify(result.headers, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}

        <div style={{ marginTop: '3rem', padding: '1rem', backgroundColor: '#e2e3e5', borderRadius: '4px' }}>
          <h4>📋 Instruções:</h4>
          <ol>
            <li>Clique nos botões acima para testar diferentes endpoints da API</li>
            <li>Observe o status code e os dados retornados</li>
            <li>Status 200/201 = Sucesso, 400 = Erro de validação, 404 = Não encontrado</li>
            <li>Os dados vêm do schema 'dev' com produtos reais</li>
          </ol>
        </div>
      </div>
    </>
  );
}