import React, { useEffect, useMemo, useState, createContext, useContext } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
  useParams,
  Outlet,
} from "react-router-dom";

// ======================
// Container & Navigation
// ======================
const Container = ({ children }) => (
  <div className="min-h-screen bg-gray-50 text-gray-900">
    {/* Nav – по цялата ширина */}
    <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur shadow-sm">
      <div className="w-full px-6 py-3 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="rounded-2xl px-2 py-1 bg-gray-900 text-white">RH</span>
          RecipeHub
        </Link>
        <div className="flex-1" />
        <NavAuth />
      </div>
    </nav>

    {/* Съдържание – по цялата ширина */}
    <main className="w-full px-6 py-8">
      {children}
    </main>

    {/* Footer – по цялата ширина */}
    <footer className="border-t py-6 text-sm text-gray-500">
      <div className="w-full px-6">
        © {new Date().getFullYear()} RecipeHub — учебен проект.
      </div>
    </footer>
  </div>
);

// ======================
// Auth Context
// ======================
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("recipehub_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = async (email, password) => {
    const res = await api.post("/users/login", { email, password });
    setUser(res);
    localStorage.setItem("recipehub_user", JSON.stringify(res));
    return res;
  };

  const register = async (email, password) => {
    const res = await api.post("/users/register", { email, password });
    setUser(res);
    localStorage.setItem("recipehub_user", JSON.stringify(res));
    return res;
  };

  const logout = async () => {
    try { await api.get("/users/logout"); } catch {}
    setUser(null);
    localStorage.removeItem("recipehub_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const PrivateRoute = () => {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

const GuestRoute = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : <Outlet />;
};

// ======================
// API layer
// ======================
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3030";
const api = {
  async request(method, url, data) {
    const user = JSON.parse(localStorage.getItem("recipehub_user") || "null");
    const headers = { "Content-Type": "application/json" };
    if (user?.accessToken) headers["X-Authorization"] = user.accessToken;

    const res = await fetch(BASE_URL + url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try { const err = await res.json(); message = err.message || message; } catch {}
      throw new Error(message);
    }
    return res.status === 204 ? null : res.json();
  },
  get: (url) => api.request("GET", url),
  post: (url, data) => api.request("POST", url, data),
  put: (url, data) => api.request("PUT", url, data),
  del: (url) => api.request("DELETE", url),
};

// ======================
// Services
// ======================
const recipesService = {
  list: (q = "") =>
    api.get(
      `/data/recipes?sortBy=_createdOn%20desc${
        q ? `&where=${encodeURIComponent(q)}` : ""
      }`
    ),
  byId: (id) => api.get(`/data/recipes/${id}`),
  create: (data) => api.post("/data/recipes", data),
  update: (id, data) => api.put(`/data/recipes/${id}`, data),
  remove: (id) => api.del(`/data/recipes/${id}`),
};

// ======================
// UI Components
// ======================
const NavAuth = () => (
  <div className="flex items-center gap-3">
    <Link
      to="/create"
      className="px-3 py-1.5 rounded-xl bg-gray-900 text-white hover:opacity-90"
    >
      + Нова рецепта
    </Link>
  </div>
);

const Home = () => (
  <section className="grid gap-6 md:grid-cols-2 items-center">
    <div>
      <h1 className="text-3xl font-bold mb-2">RecipeHub</h1>
      <p className="text-gray-600 mb-4">Каталог за любителски рецепти с CRUD, лайкове и защитени маршрути.</p>
      <div className="flex gap-3">
        <Link to="/catalog" className="px-4 py-2 rounded-xl bg-gray-900 text-white">Разгледай каталога</Link>
        <Link to="/create" className="px-4 py-2 rounded-xl border">Създай рецепта</Link>
      </div>
    </div>
  </section>
);

// Simplified catalog & details
const Catalog = () => {
  const [recipes, setRecipes] = useState([]);
  useEffect(() => { recipesService.list().then(setRecipes); }, []);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {recipes.map(r => (
        <Link key={r._id} to={`/catalog/${r._id}`} className="block bg-white rounded-2xl border hover:shadow-md p-4">
          <img src={r.imageUrl} alt="" className="w-full h-44 object-cover rounded-xl" />
          <h3 className="text-lg font-semibold mt-3">{r.title}</h3>
          <p className="text-sm text-gray-600">{r.summary}</p>
        </Link>
      ))}
    </div>
  );
};

const Details = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const [r, setR] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    recipesService
      .byId(id)
      .then(setR)
      .catch((err) => setError(err.message));
  }, [id]);

  const onDelete = async () => {
    const ok = confirm("Сигурни ли сте, че искате да изтриете тази рецепта?");
    if (!ok) return;
    try {
      await recipesService.remove(id);
      nav("/catalog");
    } catch (err) {
      setError(err.message);
    }
  };

  const onEdit = () => {
    nav(`/edit/${id}`);
  };

  if (error) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 text-red-700 px-3 py-2">
        {error}
      </div>
    );
  }

  if (!r) return <p>Зареждане...</p>;

  return (
    <article className="grid md:grid-cols-2 gap-6">
      <img
        src={r.imageUrl}
        alt=""
        className="w-full rounded-2xl border object-cover max-h-[420px]"
      />
      <div>
        <h1 className="text-2xl font-bold">{r.title}</h1>
        <p className="mt-2 text-gray-700 whitespace-pre-wrap">
          {r.description}
        </p>

        <div className="mt-4 flex gap-3">
          <button
            onClick={onEdit}
            className="px-4 py-2 rounded-xl border hover:bg-gray-50"
          >
            Редакция
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 rounded-xl border border-red-500 text-red-600 hover:bg-red-50"
          >
            Изтриване
          </button>
        </div>
      </div>
    </article>
  );
};

// NotFound
const NotFound = () => (
  <div className="text-center">
    <h1 className="text-2xl font-bold">404</h1>
    <p>Страницата не е намерена.</p>
    <Link to="/" className="inline-block mt-3 px-4 py-2 rounded-xl border">Начало</Link>
  </div>
);

const Create = () => {
  const nav = useNavigate();
  const [form, setForm] = useState({
    title: "",
    imageUrl: "",
    summary: "",
    description: "",
  });
  const [error, setError] = useState("");

  const onChange = (e) => {
    setForm((state) => ({ ...state, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.title || !form.imageUrl || !form.description) {
        throw new Error("Моля, попълнете всички задължителни полета.");
      }

      const created = await recipesService.create(form);
      nav(`/catalog/${created._id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-xl bg-white rounded-2xl border px-5 py-6 shadow-sm"
    >
      <h1 className="text-2xl font-bold mb-4">Нова рецепта</h1>

      <div className="grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm text-gray-600">
            Заглавие <span className="text-red-500">*</span>
          </span>
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            className="px-3 py-2 rounded-xl border focus:outline-none focus:ring w-full"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-600">
            Снимка URL <span className="text-red-500">*</span>
          </span>
          <input
            name="imageUrl"
            value={form.imageUrl}
            onChange={onChange}
            className="px-3 py-2 rounded-xl border focus:outline-none focus:ring w-full"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-600">Кратко описание</span>
          <input
            name="summary"
            value={form.summary}
            onChange={onChange}
            className="px-3 py-2 rounded-xl border focus:outline-none focus:ring w-full"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-600">
            Описание <span className="text-red-500">*</span>
          </span>
          <textarea
            name="description"
            rows={6}
            value={form.description}
            onChange={onChange}
            className="px-3 py-2 rounded-xl border focus:outline-none focus:ring w-full"
          />
        </label>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-300 bg-red-50 text-red-700 px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="mt-4 px-4 py-2 rounded-xl bg-gray-900 text-white hover:opacity-90"
      >
        Запази
      </button>
    </form>
  );
};

const Edit = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState({
    title: "",
    imageUrl: "",
    summary: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recipesService
      .byId(id)
      .then((data) => {
        setForm({
          title: data.title || "",
          imageUrl: data.imageUrl || "",
          summary: data.summary || "",
          description: data.description || "",
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const onChange = (e) => {
    setForm((state) => ({ ...state, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.title || !form.imageUrl || !form.description) {
        throw new Error("Моля, попълнете всички задължителни полета.");
      }
      await recipesService.update(id, form);
      nav(`/catalog/${id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>Зареждане...</p>;

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-xl bg-white rounded-2xl border px-5 py-6 shadow-sm"
    >
      <h1 className="text-2xl font-bold mb-4">Редакция на рецепта</h1>

      <div className="grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm text-gray-600">
            Заглавие <span className="text-red-500">*</span>
          </span>
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            className="px-3 py-2 rounded-xl border focus:outline-none focus:ring w-full"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-600">
            Снимка URL <span className="text-red-500">*</span>
          </span>
          <input
            name="imageUrl"
            value={form.imageUrl}
            onChange={onChange}
            className="px-3 py-2 rounded-xl border focus:outline-none focus:ring w-full"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-600">Кратко описание</span>
          <input
            name="summary"
            value={form.summary}
            onChange={onChange}
            className="px-3 py-2 rounded-xl border focus:outline-none focus:ring w-full"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-600">
            Описание <span className="text-red-500">*</span>
          </span>
          <textarea
            name="description"
            rows={6}
            value={form.description}
            onChange={onChange}
            className="px-3 py-2 rounded-xl border focus:outline-none focus:ring w-full"
          />
        </label>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-300 bg-red-50 text-red-700 px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="mt-4 px-4 py-2 rounded-xl bg-gray-900 text-white hover:opacity-90"
      >
        Запази промените
      </button>
    </form>
  );
};

// ======================
// App & Routes
// ======================
const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Container>
        <Routes>
           <Route path="/" element={<Home />} />
           <Route path="/catalog" element={<Catalog />} />
           <Route path="/catalog/:id" element={<Details />} />

           <Route path="/create" element={<Create />} />
           <Route path="/edit/:id" element={<Edit />} />

           <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
    </BrowserRouter>
  </AuthProvider>
)

createRoot(document.getElementById("root")).render(<App />);

export default App;
