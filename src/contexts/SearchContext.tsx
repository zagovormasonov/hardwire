import React, { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface SearchContextType {
  searchQuery: string
  setSearchQuery: (query: string) => void
  performSearch: () => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export const useSearch = () => {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const performSearch = () => {
    if (searchQuery.trim()) {
      // Переходим на страницу ленты с параметром поиска
      navigate(`/feed?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const value = {
    searchQuery,
    setSearchQuery,
    performSearch,
  }

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}
