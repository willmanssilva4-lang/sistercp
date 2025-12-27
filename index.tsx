import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProductsProvider } from './contexts/ProductsContext';
import { SalesProvider } from './contexts/SalesContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { PeopleProvider } from './contexts/PeopleContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProductsProvider>
          <SalesProvider>
            <FinanceProvider>
              <PeopleProvider>
                <App />
              </PeopleProvider>
            </FinanceProvider>
          </SalesProvider>
        </ProductsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);