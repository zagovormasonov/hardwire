import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSearch } from '../contexts/SearchContext'
import { Search, Bell, LogOut } from 'lucide-react'

const Header: React.FC = () => {
  const { user, signOut } = useAuth()
  const { searchQuery, setSearchQuery, performSearch } = useSearch()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Header: Error signing out:', error)
    }
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-flex">
          {/* Логотип */}
          <Link to="/" className="logo">
            <div className="logo-icon">
              <span className="avatar-text">H</span>
            </div>
            <span className="logo-text">
              HardWire
            </span>
          </Link>

          {/* Навигация */}
          <nav className="nav">
            <Link 
              to="/feed" 
              className="nav-link"
            >
              Лента
            </Link>
            <Link 
              to="/categories" 
              className="nav-link"
            >
              Категории
            </Link>
            {user && (
              <Link 
                to="/create" 
                className="nav-link"
              >
                Продать
              </Link>
            )}
          </nav>

          {/* Поиск */}
          <div className="search-container">
            <div className="search-input">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Поиск железа..."
                className="input search-field"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    performSearch()
                  }
                }}
              />
            </div>
          </div>

          {/* Пользователь */}
          <div className="user-section">
            {user ? (
              <>
                {/* Уведомления */}
                <button className="user-button">
                  <Bell className="w-5 h-5" />
                </button>

                {/* Профиль */}
                <Link 
                  to="/profile" 
                  className="profile-link"
                >
                  <div className="avatar">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.full_name}
                        className="avatar-img"
                      />
                    ) : (
                      <span className="avatar-text">
                        {user.full_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="user-name">
                    {user.full_name}
                  </span>
                </Link>

                {/* Выход */}
                <button
                  onClick={handleSignOut}
                  className="user-button"
                  title="Выйти"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="auth-buttons">
                <Link 
                  to="/login" 
                  className="btn btn-secondary"
                >
                  Войти
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn-primary"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
