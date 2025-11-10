/**
 * Invoice³ Main App
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EliteDashboard } from './pages/EliteDashboard';
import { InvoiceDetailEnhanced } from './pages/InvoiceDetailEnhanced';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EliteDashboard />} />
        <Route path="/invoice/:id" element={<InvoiceDetailEnhanced />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
