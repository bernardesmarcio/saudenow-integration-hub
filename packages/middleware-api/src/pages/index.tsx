import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Head>
        <title>SaúdeNow Integration Hub - Middleware API</title>
        <meta
          name="description"
          content="Hub de integração event-driven para sistemas de saúde"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "3rem",
            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
            textAlign: "center" as const,
            maxWidth: "600px",
            margin: "2rem",
          }}
        >
          <h1
            style={{
              color: "#2d3748",
              fontSize: "2.5rem",
              marginBottom: "1rem",
              fontWeight: "700",
            }}
          >
            🏥 SaúdeNow Integration Hub
          </h1>

          <p
            style={{
              color: "#4a5568",
              fontSize: "1.2rem",
              marginBottom: "2rem",
              lineHeight: "1.6",
            }}
          >
            Hub de integração event-driven para sistemas de saúde
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                background: "#f7fafc",
                padding: "1.5rem",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <h3 style={{ color: "#2d3748", marginBottom: "0.5rem" }}>
                📚 API Docs
              </h3>
              <p
                style={{
                  color: "#718096",
                  fontSize: "0.9rem",
                  marginBottom: "1rem",
                }}
              >
                Documentação interativa da API
              </p>
              <Link
                href="/docs"
                style={{
                  display: "inline-block",
                  background: "#667eea",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                }}
              >
                Ver Docs
              </Link>
            </div>

            <div
              style={{
                background: "#f7fafc",
                padding: "1.5rem",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <h3 style={{ color: "#2d3748", marginBottom: "0.5rem" }}>
                ⚡ API Status
              </h3>
              <p
                style={{
                  color: "#718096",
                  fontSize: "0.9rem",
                  marginBottom: "1rem",
                }}
              >
                Verificar status da API
              </p>
              <a
                href="/api/health"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  background: "#48bb78",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                }}
              >
                Health Check
              </a>
            </div>
          </div>

          <div
            style={{
              background: "#ebf8ff",
              padding: "1.5rem",
              borderRadius: "8px",
              border: "1px solid #bee3f8",
              marginBottom: "2rem",
            }}
          >
            <h3 style={{ color: "#2b6cb0", marginBottom: "1rem" }}>
              🚀 Endpoints Disponíveis
            </h3>
            <div style={{ textAlign: "left" as const }}>
              <div style={{ marginBottom: "0.5rem" }}>
                <code
                  style={{
                    background: "#2d3748",
                    color: "#68d391",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    marginRight: "0.5rem",
                    fontSize: "0.8rem",
                  }}
                >
                  GET
                </code>
                <span style={{ color: "#2d3748", fontSize: "0.9rem" }}>
                  /api/v1/produtos
                </span>
              </div>
              <div style={{ marginBottom: "0.5rem" }}>
                <code
                  style={{
                    background: "#2d3748",
                    color: "#63b3ed",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    marginRight: "0.5rem",
                    fontSize: "0.8rem",
                  }}
                >
                  POST
                </code>
                <span style={{ color: "#2d3748", fontSize: "0.9rem" }}>
                  /api/v1/produtos
                </span>
              </div>
              <div style={{ marginBottom: "0.5rem" }}>
                <code
                  style={{
                    background: "#2d3748",
                    color: "#fbb6ce",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    marginRight: "0.5rem",
                    fontSize: "0.8rem",
                  }}
                >
                  PUT
                </code>
                <span style={{ color: "#2d3748", fontSize: "0.9rem" }}>
                  /api/v1/produtos/[id]
                </span>
              </div>
              <div>
                <code
                  style={{
                    background: "#2d3748",
                    color: "#fc8181",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    marginRight: "0.5rem",
                    fontSize: "0.8rem",
                  }}
                >
                  DEL
                </code>
                <span style={{ color: "#2d3748", fontSize: "0.9rem" }}>
                  /api/v1/produtos/[id]
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              color: "#718096",
              fontSize: "0.9rem",
              borderTop: "1px solid #e2e8f0",
              paddingTop: "1.5rem",
            }}
          >
            <p>Desenvolvido com Next.js 14, TypeScript e Supabase</p>
            <p style={{ marginTop: "0.5rem" }}>
              Porta:{" "}
              <code
                style={{
                  background: "#f7fafc",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                }}
              >
                3001
              </code>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
