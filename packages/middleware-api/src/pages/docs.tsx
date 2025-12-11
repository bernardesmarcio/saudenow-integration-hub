import { GetStaticProps } from "next";
import Head from "next/head";
import { useEffect, useRef } from "react";

interface DocsPageProps {
  spec: any;
}

export default function DocsPage({ spec }: DocsPageProps) {
  const swaggerUIRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && swaggerUIRef.current) {
      // Dynamically import SwaggerUI to avoid SSR issues
      import("swagger-ui-dist/swagger-ui-bundle.js").then((SwaggerUIBundle) => {
        SwaggerUIBundle.default({
          dom_id: "#swagger-ui",
          spec: spec,
          deepLinking: true,
          presets: [
            SwaggerUIBundle.default.presets.apis,
            SwaggerUIBundle.default.presets.standalone,
          ],
          plugins: [SwaggerUIBundle.default.plugins.DownloadUrl],
          layout: "BaseLayout",
          tryItOutEnabled: true,
          filter: true,
          requestInterceptor: (request: any) => {
            // Add any default headers or transformations here
            console.log("Request:", request);
            return request;
          },
          responseInterceptor: (response: any) => {
            // Handle responses here
            console.log("Response:", response);
            return response;
          },
          onComplete: () => {
            console.log("Swagger UI loaded successfully");
          },
          onFailure: (error: any) => {
            console.error("Failed to load Swagger UI:", error);
          },
        });
      });
    }
  }, [spec]);

  return (
    <>
      <Head>
        <title>SaúdeNow Integration Hub - API Documentation</title>
        <meta
          name="description"
          content="Documentação da API do Hub de Integração SaúdeNow"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        {/* Swagger UI CSS */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui.css"
        />

        {/* Custom CSS for better styling */}
        <style jsx global>{`
          body {
            margin: 0;
            font-family:
              -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
              "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans",
              "Helvetica Neue", sans-serif;
          }

          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem 0;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }

          .header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 700;
          }

          .header p {
            margin: 0.5rem 0 0;
            font-size: 1.2rem;
            opacity: 0.9;
          }

          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem;
          }

          .info-section {
            background: #f8f9fa;
            padding: 2rem 0;
            border-bottom: 1px solid #e9ecef;
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-top: 1rem;
          }

          .info-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .info-card h3 {
            margin: 0 0 1rem;
            color: #495057;
            font-size: 1.2rem;
          }

          .info-card p {
            margin: 0;
            color: #6c757d;
            line-height: 1.5;
          }

          .info-card code {
            background: #f8f9fa;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-size: 0.9rem;
            color: #e83e8c;
          }

          /* Swagger UI Customizations */
          .swagger-ui .topbar {
            display: none;
          }

          .swagger-ui .info {
            margin: 2rem 0;
          }

          .swagger-ui .info .title {
            color: #495057;
          }

          .swagger-ui .scheme-container {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 1rem;
            margin: 1rem 0;
          }

          .swagger-ui .opblock .opblock-summary {
            border-radius: 8px;
          }

          .swagger-ui .opblock.opblock-get .opblock-summary {
            border-color: #17a2b8;
            background: rgba(23, 162, 184, 0.1);
          }

          .swagger-ui .opblock.opblock-post .opblock-summary {
            border-color: #28a745;
            background: rgba(40, 167, 69, 0.1);
          }

          .swagger-ui .opblock.opblock-put .opblock-summary {
            border-color: #ffc107;
            background: rgba(255, 193, 7, 0.1);
          }

          .swagger-ui .opblock.opblock-delete .opblock-summary {
            border-color: #dc3545;
            background: rgba(220, 53, 69, 0.1);
          }

          .swagger-ui .btn.execute {
            background: #667eea;
            border-color: #667eea;
          }

          .swagger-ui .btn.execute:hover {
            background: #5a6fd8;
            border-color: #5a6fd8;
          }

          /* Responsive design */
          @media (max-width: 768px) {
            .header h1 {
              font-size: 2rem;
            }

            .header p {
              font-size: 1rem;
            }

            .info-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </Head>

      <div className="header">
        <div className="container">
          <h1>SaúdeNow Integration Hub</h1>
          <p>Documentação da API - Hub de Integração para Sistemas de Saúde</p>
        </div>
      </div>

      <div className="info-section">
        <div className="container">
          <div className="info-grid">
            <div className="info-card">
              <h3>🚀 Base URL</h3>
              <p>
                Desenvolvimento: <code>http://localhost:3001</code>
                <br />
                Produção: <code>https://api.saudenow.com</code>
              </p>
            </div>

            <div className="info-card">
              <h3>📋 Versão da API</h3>
              <p>
                Versão atual: <code>v1.0.0</code>
                <br />
                Todas as rotas começam com <code>/api/v1/</code>
              </p>
            </div>

            <div className="info-card">
              <h3>🔐 Autenticação</h3>
              <p>
                Suporte a Bearer Token (JWT) e API Key
                <br />
                Header: <code>Authorization: Bearer TOKEN</code>
                <br />
                Ou: <code>X-API-Key: YOUR_KEY</code>
              </p>
            </div>

            <div className="info-card">
              <h3>📊 Formatos</h3>
              <p>
                Request: <code>application/json</code>
                <br />
                Response: <code>application/json</code>
                <br />
                Encoding: <code>UTF-8</code>
              </p>
            </div>

            <div className="info-card">
              <h3>🏥 Recursos Disponíveis</h3>
              <p>
                • Produtos (Medicamentos, Equipamentos)
                <br />
                • Clientes (Pessoas Físicas e Jurídicas)
                <br />
                • Estoque (Controle de Inventário)
                <br />
                • Vendas (Transações Comerciais)
                <br />• Integração (Logs e Sincronização)
              </p>
            </div>

            <div className="info-card">
              <h3>⚡ Rate Limiting</h3>
              <p>
                Limite: <code>100 requests/15min</code>
                <br />
                Headers de controle incluídos nas respostas
                <br />
                Status 429 quando limite excedido
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div
          id="swagger-ui"
          ref={swaggerUIRef}
          style={{ minHeight: "600px", padding: "2rem 0" }}
        />
      </div>

      <footer
        style={{
          background: "#f8f9fa",
          padding: "2rem 0",
          textAlign: "center",
          borderTop: "1px solid #e9ecef",
          marginTop: "2rem",
        }}
      >
        <div className="container">
          <p style={{ margin: 0, color: "#6c757d" }}>
            © 2025 SaúdeNow Integration Hub - Desenvolvido com Next.js,
            TypeScript e Supabase
          </p>
        </div>
      </footer>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // Import the swagger spec at build time
  const { swaggerSpec } = await import("../lib/swagger");

  return {
    props: {
      spec: swaggerSpec,
    },
    // Regenerate the page at most once per hour
    revalidate: 3600,
  };
};
