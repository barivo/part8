import React, { useState, useEffect } from 'react'
import { useApolloClient, useLazyQuery, gql } from '@apollo/client'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import Login from './components/Login'

const ME = gql`
  {
    me {
      username
      favoriteGenre
    }
  }
`
const Notify = ({ errorMessage }) => {
  if (!errorMessage) {
    return null
  }

  return <div style={{ color: 'red' }}>{errorMessage}</div>
}

const App = () => {
  const [page, setPage] = useState('authors')
  const [token, setToken] = useState('')
  const [favorite, setFavorite] = useState('')
  const [errorMessage, setErrorMessage] = useState(null)

  const client = useApolloClient()

  const [getUser, { data }] = useLazyQuery(ME)

  useEffect(() => {
    const localToken = localStorage.getItem('library-user-token')
    if (localToken) {
      setToken(localToken)
    }
  }, [setToken])

  useEffect(() => {
    if (token) getUser()
    if (data && data.me) setFavorite(data.me.favoriteGenre)
  }, [token, data, getUser])

  const logout = () => {
    setToken('')
    localStorage.clear()
    client.resetStore()
  }

  const notify = (message) => {
    setErrorMessage(message)
    setTimeout(() => {
      setErrorMessage(null)
    }, 5000)
  }
  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        {token && (
          <button onClick={() => setPage('recommend')}>recommend</button>
        )}
        {token && <button onClick={() => setPage('add')}>add book</button>}
        {token ? (
          <button onClick={() => logout()}>logout</button>
        ) : (
          <button onClick={() => setPage('login')}>login</button>
        )}
      </div>

      <Notify errorMessage={errorMessage} />

      <Login
        show={page === 'login'}
        setPage={setPage}
        setToken={setToken}
        setError={notify}
      />

      <Authors show={page === 'authors'} />

      <Books
        favorite={favorite}
        page={page}
        show={page === 'books' || page === 'recommend'}
      />

      <NewBook show={page === 'add'} setPage={setPage} setError={notify} />
    </div>
  )
}

export default App
