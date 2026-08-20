import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ProfileProvider } from "./context/ProfileContext";

import Home from "./pages/Home";
import Menu from "./pages/Menu";
import MealBuilder from "./pages/MealBuilder";
import Cart from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import Profile from "./pages/Profile";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import OrderTracking from "./pages/OrderTracking";
import TableMenu from "./pages/TableMenu";
import { KitchenDisplay } from "./pages/KitchenDisplay";
import { AdminOrders } from "./pages/AdminOrders";
import { AdminDeliveries } from "./pages/AdminDeliveries";
import { DeliveryDashboard } from "./pages/DeliveryDashboard";
import { AnalyticsDashboard } from "./pages/AnalyticsDashboard";
import AdminPayments from "./pages/AdminPayments";

function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/meal-builder" element={<MealBuilder />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/order/:id" element={<OrderTracking />} />
                <Route path="/table/:tableId" element={<TableMenu />} />
                <Route path="/kitchen" element={<KitchenDisplay />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/deliveries" element={<AdminDeliveries />} />
                <Route path="/admin/payments" element={<AdminPayments />} />
                <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
                <Route path="/delivery" element={<DeliveryDashboard />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;