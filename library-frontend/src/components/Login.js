import React, { useState, useEffect } from 'react'
import { useMutation, gql } from '@apollo/client'

const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      value
    }
  }
`
const Login = ({ setError, setToken, setPage, show }) => {
  const [username, setUserName] = useState('')
  const [password, setPassword] = useState('')

  const [login, { data }] = useMutation(LOGIN, {
    onError: (error) => {
      setError(error.graphQLErrors[0].message)
    },
  })

  useEffect(() => {
    if (data) {
      const token = data.login.value
      setToken(token)
      localStorage.setItem('library-user-token', token)
      setUserName('')
      setPassword('')
      setPage('authors')
    }
  }, [data, setToken, setPage])

  const submit = async (e) => {
    e.preventDefault()
    login({ variables: { username, password } })
  }

  if (!show) return null

  return (
    <div>
      <form onSubmit={submit}>
        <div>
          <input
            value={username}
            onChange={({ target }) => setUserName(target.value)}
          />
        </div>
        <div>
          <input
            type="password"
            value={password}
            onChange={({ target }) => setPassword(target.value)}
          />
        </div>
        <button type="submit">login</button>
      </form>
    </div>
  )
}

export default Login
