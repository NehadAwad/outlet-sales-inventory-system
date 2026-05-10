import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import DashboardRedirect from './pages/DashboardRedirect'

const Outlets = lazy(() => import('./pages/Outlets'))
const MasterMenu = lazy(() => import('./pages/MasterMenu'))
const AssignMenu = lazy(() => import('./pages/AssignMenu'))
const Inventory = lazy(() => import('./pages/Inventory'))
const CreateSale = lazy(() => import('./pages/CreateSale'))
const Reports = lazy(() => import('./pages/Reports'))
const NotFound = lazy(() => import('./pages/NotFound'))

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-neutral-500" role="status">
      Loading…
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DashboardRedirect />} />
            <Route path="outlets" element={<Outlets />} />
            <Route path="menu" element={<MasterMenu />} />
            <Route path="assign-menu" element={<AssignMenu />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="sales" element={<CreateSale />} />
            <Route path="reports" element={<Reports />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
