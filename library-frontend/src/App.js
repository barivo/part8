import React, { useState, useEffect } from 'react'
import {
  useApolloClient,
  useSubscription,
  useLazyQuery,
  gql,
} from '@apollo/client'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import Login from './components/Login'

const BOOKS = gql`
  query AllBooks($author: String, $genre: String) {
    allBooks(author: $author, genre: $genre) {
      title
      author {
        name
        born
        id
      }
      published
      genres
      id
    }
  }
`

const BOOK_DETAILS = gql`
  fragment BookDetails on Book {
    title
    author {
      name
      born
    }
    published
    genres
    id
  }
`
const BOOK_ADDED = gql`
  subscription {
    bookAdded {
      ...BookDetails
    }
  }
  ${BOOK_DETAILS}
`
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

  const [message, setMessage] = useState(null)

  const updateCacheWith = (addedBook) => {
    const includedIn = (set, object) => set.map((p) => p.id).includes(object.id)

    const cache = client.readQuery({ query: BOOKS })
    if (!includedIn(cache.allBooks, addedBook)) {
      client.writeQuery({
        query: BOOKS,
        data: { allBooks: cache.allBooks.concat(addedBook) },
      })
    }
  }

  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      const addedBook = subscriptionData.data.bookAdded
      updateCacheWith(addedBook)
      setPage('books')
      setMessage(`${addedBook.title} has been added`)
      setTimeout(() => setMessage(null), 3000)
    },
  })

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
      {message && <h2 style={{ color: 'blue' }}>{message}</h2>}

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
