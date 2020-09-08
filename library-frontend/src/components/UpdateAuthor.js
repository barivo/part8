import React, { useState } from 'react'
import { useMutation, gql } from '@apollo/client'

const EDIT_AUTHOR = gql`
  mutation EditAuthor($name: String!, $setBornTo: Int!) {
    editAuthor(name: $name, setBornTo: $setBornTo) {
      name
      born
      id
    }
  }
`

const UpdateAuthor = (props) => {
  const [born, setBorn] = useState('')
  const [name, setName] = useState('')
  const [editAuthor, { data }] = useMutation(EDIT_AUTHOR)

  const submit = (event) => {
    event.preventDefault()

    editAuthor({
      variables: {
        name: name.trim(),
        setBornTo: Number(born),
      },
    })

    console.log(data)
    setName('')
    setBorn('')
  }

  return (
    <div>
      <form onSubmit={submit}>
        <h2>Set birthyear </h2>
        <div>
          <label>
            <select
              style={{ width: '30%', fontSize: '1.2rem', marginBottom: '5px' }}
              value={name}
              onChange={({ target }) => setName(target.value)}
            >
              {props.authors.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <input
            value={born}
            onChange={({ target }) => setBorn(target.value)}
          />
        </div>
        <br />
        <button type="submit">update author</button>
      </form>
    </div>
  )
}

export default UpdateAuthor
