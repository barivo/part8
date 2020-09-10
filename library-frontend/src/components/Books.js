import React from 'react'
import { useQuery, gql } from '@apollo/client'

const BOOKS = gql`
  {
    allBooks {
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
const Books = (props) => {
  const { loading, error, data } = useQuery(BOOKS)

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error :(</p>

  if (!props.show) {
    return null
  }

  return (
    <div>
      <h2>books</h2>

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
    </div>
  )
}

export default Books
