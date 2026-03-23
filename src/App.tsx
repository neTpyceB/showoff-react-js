/* @jsxRuntime automatic */
import { Navigate, Route, Routes } from 'react-router-dom'
import { CommerceProvider, useCommerce } from './commerce/client.tsx'
import type { AppState } from './commerce/state.ts'
import {
  AccountPage,
  AdminPage,
  CartPage,
  CatalogPage,
  CheckoutPage,
  CheckoutSuccessPage,
  HomePage,
  ProductPage,
  StoreLayout,
} from './components/CommercePages.tsx'
import { LoginPage } from './components/LoginPage.tsx'

const LoginRoute = () => {
  const { state } = useCommerce()

  if (state.session?.role === 'customer') {
    return <Navigate replace to="/account/orders" />
  }

  if (state.session?.role === 'admin') {
    return <Navigate replace to="/admin" />
  }

  return <LoginPage />
}

export const App = ({ initialState }: { initialState: AppState }) => (
  <CommerceProvider initialState={initialState}>
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<StoreLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/catalog/:slug" element={<ProductPage />} />
        <Route path="/search" element={<CatalogPage searchMode />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="/account/orders" element={<AccountPage />} />
        <Route path="/account/profile" element={<AccountPage />} />
        <Route path="/account/addresses" element={<AccountPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/products" element={<AdminPage />} />
        <Route path="/admin/inventory" element={<AdminPage />} />
        <Route path="/admin/orders" element={<AdminPage />} />
        <Route path="/admin/promotions" element={<AdminPage />} />
        <Route path="/admin/customers" element={<AdminPage />} />
      </Route>
    </Routes>
  </CommerceProvider>
)

export default App
