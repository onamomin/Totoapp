import './App.css'
import { useState, useEffect } from 'react';
import type { Todo } from './types';

const STORAGE_KEY = 'todos';

function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try{
        const storedTodos = localStorage.getItem(STORAGE_KEY);
        return storedTodos ? (JSON.parse(storedTodos) as Todo[]) : [];
    } catch{
        return [];
    }
});
const [input, setText] = useState<string>('');

  useEffect(() => {
      try{
          localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
        } catch{}
    }, [todos]);
  

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text)  return;
    setTodos((prev) => [...prev, { id: Date.now(), text }]);
    setText('');
  }

  return (
    <>
      <div className="app">
      <h1>ToDo</h1>
      <form onSubmit={onSubmit}>
        <input type="text" placeholder="Add a new task" onChange={(e) => setText(e.target.value)} />
        <button type="submit" >Add</button>
      </form>

        <ul>
          {todos.map((todo) => (
            <li key={todo.id}>{todo.text}</li>
          ))}
        </ul>
      </div>
    </>
  )
}

export default App
