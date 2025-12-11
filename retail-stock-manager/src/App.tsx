import { StockManager } from "./components/StockManager";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Gerenciador de Estoque RES
                </h1>
                <p className="text-gray-600 mt-1">
                  Monitor em tempo real do estoque da loja RES via Retail Pro
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Online</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <StockManager />
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
