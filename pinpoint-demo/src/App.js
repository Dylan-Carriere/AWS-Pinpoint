/* src/App.js */
import React, { useEffect, useState } from 'react'
import Amplify, { API, button, graphqlOperation, Auth } from 'aws-amplify'
import { createTodo } from './graphql/mutations'
import { deleteTodo } from './graphql/mutations'
import { listTodos } from './graphql/queries'
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import awsExports from "./aws-exports";
Amplify.configure(awsExports);


const initialState = { name: '', description: '' }
const Userid = Auth.currentUserInfo()

const App = () => {
  const [formState, setFormState] = useState(initialState)
  const [todos, setTodos] = useState([])


  useEffect(() => {
    Auth.currentUserInfo().then(user => fetchTodos(user.username))
  }, [])

  function setInput(key, value) {
    setFormState({ ...formState, [key]: value })
  }

  async function fetchTodos(user) {
    try {
      const todoData = await API.graphql(graphqlOperation(listTodos, {filter: {userid:{eq: user}}}))
      const todos = todoData.data.listTodos.items
      setTodos(todos)
    } catch (err) { console.log('error fetching todos') }
  }

  async function addTodo(user) {
    try {
      if (!formState.name || !formState.description) return
      let todo = { ...formState }
      todo.userid = user
      setTodos([...todos, todo])
      setFormState(initialState)
      await API.graphql(graphqlOperation(createTodo, {input: todo}))
      fetchTodos(user)
    } catch (err) {
      console.log('error creating todo:', err)
    }
  }

  async function removeTodo(todo, user) {
    try {
      let rmTodo = {}
      rmTodo.id = todo.id
      await API.graphql(graphqlOperation(deleteTodo, {input: rmTodo}))
      fetchTodos(user)
    } catch (err) {
      console.log('error deleting todo:', err)
    }
  }

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div style={styles.container}>
          <div>
            <h2>PinPoint Todos</h2>
          </div>
          <input
            style={styles.input}
            onChange={event => setInput('name', event.target.value)}
            value={formState.name}
            placeholder="Name"
          />
          <input
            style={styles.input}
            onChange={event => setInput('description', event.target.value)}
            value={formState.description}
            placeholder="Description"
          />
          <button style={styles.button} onClick={()=> addTodo(user.username)}>Create Todo</button>
          <br/>
          {
            todos.map((todo, index) => (
              <div style={styles.todo} key={todo.id ? todo.id : index}>
                <div style={styles.col1}>
                  <p style={styles.todoName}>{todo.name}</p>
                  <p style={styles.todoDescription}>{todo.description}</p>
                </div>
                <div style={styles.col2}>
                  <button style={styles.button} onClick={()=> removeTodo(todo, user.username)}>delete</button>
                </div>
              </div>
            ))
          }
          <br/>
          <button style={styles.button} onClick={signOut}>Sign out</button>
        </div>
      )}
    </Authenticator>
  );
}

const styles = {
  container: { width: 400, margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  title: {padding: '40px',textAlign: 'center',background: 'black',color: 'white',fontSize: '20px', marginBottom: 15},
  todo: { marginBottom: 10, display: 'grid', gridTemplateColumns: '200px 200px' },
  col1: {},
  col2: { marginRight: 0, marginLeft: 'auto' },
  input: { border: 'none', backgroundColor: '#ddd', marginBottom: 8, padding: 8, fontSize: 18 },
  todoName: { fontSize: 20, fontWeight: 'bold' },
  todoDescription: { marginBottom: 0 },
  button: { backgroundColor: 'black', color: 'white', outline: 'none', fontSize: 18, padding: '12px 0px' }
}

export default App