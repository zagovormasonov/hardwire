import React from 'react'
import Header from './Header'
import { useAuth } from '../contexts/AuthContext'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="preloader-container">
        <div className="preloader-content">
          {/* Простой крутящийся спиннер */}
          <div className="preloader-spinner">
            <div className="spinner-ring"></div>
          </div>
          
          {/* Текст загрузки */}
          <div className="preloader-text">
            <p className="preloader-subtitle">Загрузка данных...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient">
      <Header />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

export default Layout
