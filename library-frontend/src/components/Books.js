import React, { useState, useEffect } from 'react'
import { useLazyQuery, gql, useQuery } from '@apollo/client'

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

const Books = ({ favorite, show, page }) => {
  const [genre, setGenre] = useState('')
  const [getBooks, { loading, error, data }] = useLazyQuery(BOOKS)

  const initBooks = useQuery(BOOKS)

  useEffect(() => {
    if (page === 'recommend') {
      getBooks({ variables: { genre: favorite } })
    } else {
      if (!genre) {
        getBooks()
      } else {
        getBooks({ variables: { genre } })
      }
    }
  }, [genre, getBooks, page, favorite])

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error :(</p>

  if (!show) {
    return null
  }

  const genresList =
    !initBooks.loading && initBooks.data ? initBooks.data.allBooks : []

  const genres = new Set(genresList.map((b) => b.genres).flat())

  const showGenres = Array.from(genres).map((g) => (
    <button key={g} onClick={() => setGenre(g)}>
      {g}
    </button>
  ))

  const recommendationHeading = () => {
    return (
      <div>
        <h2>recomendations</h2>
        <p>
          books in your favorite genre: <strong>{favorite}</strong>{' '}
        </p>
      </div>
    )
  }

  const headingForBooksFilteredByGenre = () => {
    return (
      <div>
        <h2>books</h2>
        {genre ? (
          <p>
            in genre: <strong>{genre}</strong>{' '}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div>
      {page === 'recommend'
        ? recommendationHeading()
        : headingForBooksFilteredByGenre()}
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {data.allBooks.map((a) => (
            <tr key={a.id}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {page === 'books' ? (
        <div>
          {showGenres}
          <button onClick={() => setGenre('')}>all genres</button>
        </div>
      ) : null}
    </div>
  )
}

export default Books
