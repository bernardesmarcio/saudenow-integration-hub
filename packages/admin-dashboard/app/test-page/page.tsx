export default function TestPage() {
  return (
    <div className="min-h-screen bg-blue-500 p-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Teste do CSS</h1>
        <p className="text-gray-600">
          Se você está vendo este texto em um card branco com fundo azul, o
          Tailwind está funcionando!
        </p>
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
          Botão de Teste
        </button>
      </div>
    </div>
  );
}
