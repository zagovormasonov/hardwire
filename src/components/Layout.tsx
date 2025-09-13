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
          {/* Анимированный логотип */}
          <div className="preloader-logo">
            <div className="preloader-logo-inner">
              <span>Б</span>
            </div>
            <div className="preloader-ring"></div>
          </div>
          
          {/* Текст загрузки */}
          <div className="preloader-text">
            <h2 className="preloader-title">Биржа железа</h2>
            <p className="preloader-subtitle">Загрузка данных...</p>
          </div>
          
          {/* Прогресс бар */}
          <div className="preloader-progress">
            <div className="preloader-progress-bar"></div>
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
