let todos = [
    { id: 1, title: "Task 1", completed: false },
    { id: 2, title: "Task 2", completed: true },
    { id: 3, title: "Task 3", completed: false },
    { id: 4, title: "Task 4", completed: true },
  ];
  export default function WorkingWithArrays(app) {
    const getTodos = (req, res) => {
      const { completed } = req.query;
      if (completed !== undefined) {
        const completedBool = completed === "true";
        const completedTodos = todos.filter((t) => t.completed === completedBool);
        res.json(completedTodos);
        return;
      }  
      res.json(todos);
    };
    const createNewTodo = (req, res) => {
      const newTodo = {
        id: new Date().getTime(),
        title: "New Task",
        completed: false,
      };
      todos.push(newTodo);
      res.json(todos);
    };
    const getTodoById = (req, res) => {
      const { id } = req.params;
      const todo = todos.find((t) => t.id === parseInt(id));
      res.json(todo);
    };

  
    app.get("/lab5/todos", getTodos);
    app.get("/lab5/todos/create", createNewTodo);
    app.get("/lab5/todos/:id", getTodoById);

  };
  