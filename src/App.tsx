import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { AuthProvider } from './contexts/AuthContext'
import { SearchProvider } from './contexts/SearchContext'
import { NotificationProvider } from './contexts/NotificationContext'
import theme from './theme'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Feed from './pages/Feed'
import CreateProduct from './pages/CreateProduct'
import Categories from './pages/Categories'
import ProductDetail from './pages/ProductDetail'
import EditProduct from './pages/EditProduct'
import SellerProfile from './pages/SellerProfile'
import Messages from './pages/Messages'

function App() {
  return (
    <ConfigProvider theme={theme}>
      <AuthProvider>
        <Router>
          <SearchProvider>
            <NotificationProvider>
              <Routes>
                <Route path="/" element={<Layout><Home /></Layout>} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/feed" element={<Layout><Feed /></Layout>} />
                <Route path="/categories" element={<Layout><Categories /></Layout>} />
                <Route path="/create" element={<Layout><CreateProduct /></Layout>} />
                <Route path="/profile" element={<Layout><Profile /></Layout>} />
                <Route path="/product/:id" element={<Layout><ProductDetail /></Layout>} />
                <Route path="/edit/:id" element={<Layout><EditProduct /></Layout>} />
                <Route path="/profile/:id" element={<Layout><SellerProfile /></Layout>} />
                <Route path="/messages" element={<Layout><Messages /></Layout>} />
              </Routes>
            </NotificationProvider>
          </SearchProvider>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  )
}

export default App
