
import { useState, useEffect } from "react";
import AppRoutes from "./routes";
import supabase from "./utils/supabase";

function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const getTodos = async () => {
      try {
        const { data, error } = await supabase.from("todos").select("*");
        if (error) throw error;
        if (!isMounted) return;
        setTodos(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to fetch todos");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    getTodos();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <AppRoutes />

      {/* Supabase Todos preview */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2">Todos</h2>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && (
          <ul className="list-disc pl-6">
            {todos.length === 0 && <li>No todos found</li>}
            {todos.map((todo, idx) => (
              <li key={todo?.id ?? idx}>
                {todo?.title ?? todo?.name ?? todo?.task ?? JSON.stringify(todo)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
