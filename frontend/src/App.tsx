import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { 
  Landing, 
  Dashboard, 
  Send, 
  Request, 
  Wallet, 
  Activity,
  Business,
  PaymentLinks,
  CreatePaymentLink,
  DirectTransferPage,
  Subscriptions,
  Pay,
  Refunds,
  Checkout,
  MultiSend
} from './pages';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  
  if (!isConnected) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/pay/:id?" element={<Pay />} />
        <Route path="/checkout" element={<Checkout />} />
        
        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/send"
          element={
            <ProtectedRoute>
              <Send />
            </ProtectedRoute>
          }
        />
        <Route
          path="/multi-send"
          element={
            <ProtectedRoute>
              <MultiSend />
            </ProtectedRoute>
          }
        />
        <Route
          path="/request"
          element={
            <ProtectedRoute>
              <Request />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity"
          element={
            <ProtectedRoute>
              <Activity />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/business"
          element={
            <ProtectedRoute>
              <Business />
            </ProtectedRoute>
          }
        />
        <Route
          path="/business/links"
          element={
            <ProtectedRoute>
              <PaymentLinks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/business/links/new"
          element={
            <ProtectedRoute>
              <CreatePaymentLink />
            </ProtectedRoute>
          }
        />
        <Route
          path="/direct-transfer"
          element={
            <ProtectedRoute>
              <DirectTransferPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <ProtectedRoute>
              <Subscriptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/refunds"
          element={
            <ProtectedRoute>
              <Refunds />
            </ProtectedRoute>
          }
        />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
