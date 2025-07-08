export default function SimpleTest() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#3b82f6',
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        padding: '1.5rem',
        maxWidth: '500px'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '1rem'
        }}>
          Teste Básico
        </h1>
        <p style={{
          color: '#6b7280',
          marginBottom: '1rem'
        }}>
          Se você está vendo este card com estilos, o React está funcionando.
        </p>
        <p style={{
          color: '#6b7280'
        }}>
          Agora vamos verificar o Tailwind na página /test-page
        </p>
      </div>
    </div>
  )
}