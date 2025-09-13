import type { Todo } from "./types";

type ToDoListProps = {
    todos: Todo[];
}

function ToDoList({ todos }: ToDoListProps) {
    return (
        <div>
            {todos.map((todo) => (
                <li key={todo.id}>{todo.text}</li>
            ))}
        </div>
    );
}

export default ToDoList;