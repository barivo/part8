import React, { useState, useEffect } from 'react'
import { useApolloClient } from '@apollo/client'

import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import Login from './components/Login'

const App = () => {
  const [page, setPage] = useState('authors')
  const [token, setToken] = useState('')
  const [error, setError] = useState(null)

  const client = useApolloClient()

  useEffect(() => {
    const localToken = localStorage.getItem('library-user-token')
    if (localToken) {
      setToken(localToken)
    }
  }, [setToken])

  const logout = () => {
    setToken('')
    localStorage.clear()
    client.resetStore()
  }

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        {token && <button onClick={() => setPage('add')}>add book</button>}
        {token ? (
          <button onClick={() => logout()}>logout</button>
        ) : (
          <button onClick={() => setPage('login')}>login</button>
        )}
      </div>

      <Login
        show={page === 'login'}
        setPage={setPage}
        setError={setError}
        setToken={setToken}
      />

      <Authors show={page === 'authors'} />

      <Books show={page === 'books'} />

      <NewBook show={page === 'add'} setPage={setPage} />
    </div>
  )
}

export default App
