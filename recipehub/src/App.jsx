import React, {
  useEffect,
  useMemo,
  useState,
  createContext,
  useContext,
} from "react";
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
import Logo from "./assets/logo.png";

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
    try {
      await api.get("/users/logout");
    } catch { }
    setUser(null);
    localStorage.removeItem("recipehub_user");
  };

  const value = useMemo(
    () => ({ user, login, register, logout }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Guard за частни маршрути
const PrivateRoute = () => {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// Guard за гости
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
    const raw = localStorage.getItem("recipehub_user");
    const user = raw ? JSON.parse(raw) : null;

    const headers = {
      "Content-Type": "application/json",
    };
    if (user?.accessToken) {
      headers["X-Authorization"] = user.accessToken;
    }

    const res = await fetch(BASE_URL + url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {
        const err = await res.json();
        message = err.message || message;
      } catch { }
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
  list: () => api.get("/data/recipes"),
  byId: (id) => api.get(`/data/recipes/${id}`),
  create: (data) => api.post("/data/recipes", data),
  update: (id, data) => api.put(`/data/recipes/${id}`, data),
  remove: (id) => api.del(`/data/recipes/${id}`),
};

// ======================
// Layout & Navigation
// ======================
const Container = ({ children }) => (
  <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
    {/* Nav */}
    <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-3 font-semibold">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shadow">
            <img src={Logo} alt="RecipeHub logo" className="w-8 h-8" />
          </div>
          <span>RecipeHub</span>
        </Link>
        <div className="flex-1" />
        <NavAuth />
      </div>
    </nav>

    {/* Main */}
    <main className="max-w-5xl mx-auto px-4 py-6 bg-cover bg-center bg-no-repeat min-h-screen"
      style={{ backgroundImage: "url('/kitchen-bg.jpg')" }}>{children}</main>

    {/* Footer */}
    <footer className="border-t py-6 text-sm text-gray-500">
      <div className="max-w-5xl mx-auto px-4">
        © {new Date().getFullYear()} RecipeHub — учебен проект.
      </div>
    </footer>
  </div>
);

const NavAuth = () => {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const onLogout = async () => {
    await logout();
    nav("/");
  };

  if (!user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link
          to="/login"
          className="px-3 py-1.5 rounded-xl border hover:bg-gray-50"
        >
          Вход
        </Link>
        <Link
          to="/register"
          className="px-3 py-1.5 rounded-xl bg-gray-900 text-white hover:opacity-90"
        >
          Регистрация
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-600">{user.email}</span>
      <Link
        to="/my-recipes"
        className="px-3 py-1.5 rounded-xl border hover:bg-gray-50"
      >
        Моите рецепти
      </Link>
      <Link
        to="/create"
        className="px-3 py-1.5 rounded-xl bg-gray-900 text-white hover:opacity-90"
      >
        + Нова рецепта
      </Link>
      <button
        onClick={onLogout}
        className="px-3 py-1.5 rounded-xl border hover:bg-gray-50"
      >
        Изход
      </button>
    </div>
  );
};

// ======================
// Pages
// ======================
const Home = () => (
  <section className="flex flex-col gap-6 min-h-[110vh]">
    <div className="flex-1">
      <h1 className="text-3xl font-bold mb-2">Добре дошли в RecipeHub</h1>
      <p className="text-gray-600 mb-4">
        Тук можете да създавате, редактирате и управлявате своите любими
        рецепти. Приложението е реализирано като React SPA с бекенд на Node /
        Express.
      </p>
      <div className="flex gap-3 flex-wrap">
        <Link
          to="/catalog"
          className="px-4 py-2 rounded-xl bg-gray-900 text-white hover:opacity-90"
        >
          Разгледай каталога
        </Link>

      </div>
    </div>
    <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl border border-gray-200 shadow-lg p-6 text-gray-700 mt-8
          animate-[fadeInUp_0.8s_ease-out]">

      {/* Декоративна икона отгоре */}
      <div className="absolute -top-5 left-6 bg-gradient-to-r from-lime-500 to-green-600 text-white px-4 py-2 rounded-xl shadow-md text-sm font-semibold">
        Нашето мото
      </div>

      {/* Основен текст */}
      <h2 className="text-xl font-bold text-gray-800 mb-3 mt-4 flex items-center gap-2">
        <span className="text-green-600 text-2xl inline-block animate-bounce">🍽️</span>
        Готвенето е изкуство, а рецептите – неговият език
      </h2>

      <p className="mb-3 leading-relaxed">
        <span className="font-semibold text-gray-800">RecipeHub</span> събира на едно място
        любимите ти домашни рецепти – лесни за създаване, организиране и споделяне.
      </p>

      {/* Декоративен разделител */}
      <div className="my-3 h-[2px] bg-gradient-to-r from-green-400 to-lime-500 rounded-full
            animate-[wipe_0.6s_ease-out] w-20"></div>

      <p className="leading-relaxed">
        Готви с удоволствие, запази идеите си и никога повече не губи перфектната рецепта.
      </p>

    </div>
  </section>
);

const Catalog = () => {
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recipesService
      .list()
      .then(setRecipes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Зареждане…</p>;
  if (error) return <ErrorNote message={error} />;

  if (!recipes.length) {
    return (
      <EmptyState
        text="Няма рецепти. Влез с акаунт и добави първата!"
        action={
          <Link
            to="/create"
            className="px-3 py-2 rounded-xl bg-gray-900 text-white"
          >
            Създай рецепта
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {recipes.map((r) => (
        <RecipeCard key={r._id} r={r} />
      ))}
    </div>
  );
};

const RecipeCard = ({ r }) => (
  <Link
    to={`/catalog/${r._id}`}
    className="block bg-white rounded-2xl border hover:shadow-md transition p-4"
  >
    <img
      src={r.imageUrl}
      alt=""
      className="w-full h-44 object-cover rounded-xl"
    />
    <h3 className="text-lg font-semibold mt-3">{r.title}</h3>
    <p className="line-clamp-2 text-sm text-gray-600">{r.summary}</p>
  </Link>
);

const Details = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [r, setR] = useState(null);
  const [error, setError] = useState("");

  const isOwner = user && r && r._ownerId === user._id;

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

  if (error) return <ErrorNote message={error} />;
  if (!r) return <p>Зареждане…</p>;

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

        {isOwner && (
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
        )}
      </div>
    </article>
  );
};

const Create = () => {
  const nav = useNavigate();
  const [form, setForm] = useState({
    title: "",
    imageUrl: "",
    summary: "",
    description: "",
  });
  const [error, setError] = useState("");

  const onChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

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
    <FormShell title="Нова рецепта" error={error} onSubmit={onSubmit}>
      <TextInput
        label="Заглавие"
        name="title"
        value={form.title}
        onChange={onChange}
        req
      />
      <TextInput
        label="Снимка URL"
        name="imageUrl"
        value={form.imageUrl}
        onChange={onChange}
        req
      />
      <TextInput
        label="Кратко описание"
        name="summary"
        value={form.summary}
        onChange={onChange}
      />
      <TextArea
        label="Описание"
        name="description"
        value={form.description}
        onChange={onChange}
        rows={8}
        req
      />
      <SubmitBtn>Запази</SubmitBtn>
    </FormShell>
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

  const onChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

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

  if (loading) return <p>Зареждане…</p>;

  return (
    <FormShell title="Редакция на рецепта" error={error} onSubmit={onSubmit}>
      <TextInput
        label="Заглавие"
        name="title"
        value={form.title}
        onChange={onChange}
        req
      />
      <TextInput
        label="Снимка URL"
        name="imageUrl"
        value={form.imageUrl}
        onChange={onChange}
        req
      />
      <TextInput
        label="Кратко описание"
        name="summary"
        value={form.summary}
        onChange={onChange}
      />
      <TextArea
        label="Описание"
        name="description"
        value={form.description}
        onChange={onChange}
        rows={8}
        req
      />
      <SubmitBtn>Запази</SubmitBtn>
    </FormShell>
  );
};

const MyRecipes = () => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    recipesService
      .list()
      .then((all) =>
        setRecipes(all.filter((r) => r._ownerId === user?._id))
      )
      .catch((err) => setError(err.message));
  }, [user]);

  if (error) return <ErrorNote message={error} />;

  return (
    <section>
      <h1 className="text-2xl font-bold mb-4">Моите рецепти</h1>
      {recipes.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {recipes.map((r) => (
            <RecipeCard key={r._id} r={r} />
          ))}
        </div>
      ) : (
        <EmptyState
          text="Все още нямаш собствени рецепти."
          action={
            <Link
              to="/create"
              className="px-3 py-2 rounded-xl bg-gray-900 text-white"
            >
              Създай рецепта
            </Link>
          }
        />
      )}
    </section>
  );
};

// ======================
// Auth Screens
// ======================
const Login = () => {
  const nav = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const onChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      nav("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <FormShell title="Вход" error={error} onSubmit={onSubmit}>
      <TextInput
        label="Email"
        name="email"
        value={form.email}
        onChange={onChange}
        req
      />
      <PasswordInput
        label="Парола"
        name="password"
        value={form.password}
        onChange={onChange}
        req
      />
      <SubmitBtn>Влез</SubmitBtn>
    </FormShell>
  );
};

const Register = () => {
  const nav = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
    repass: "",
  });
  const [error, setError] = useState("");

  const onChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.password !== form.repass) {
        throw new Error("Паролите не съвпадат.");
      }
      await register(form.email, form.password);
      nav("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <FormShell title="Регистрация" error={error} onSubmit={onSubmit}>
      <TextInput
        label="Email"
        name="email"
        value={form.email}
        onChange={onChange}
        req
      />
      <PasswordInput
        label="Парола"
        name="password"
        value={form.password}
        onChange={onChange}
        req
      />
      <PasswordInput
        label="Повтори парола"
        name="repass"
        value={form.repass}
        onChange={onChange}
        req
      />
      <SubmitBtn>Създай акаунт</SubmitBtn>
    </FormShell>
  );
};

// ======================
// Form primitives
// ======================
const FormShell = ({ title, error, onSubmit, children }) => (
  <form
    onSubmit={onSubmit}
    className="max-w-xl mx-auto bg-white rounded-2xl border p-5 shadow-sm"
  >
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    <div className="grid gap-4">{children}</div>
    {error && <ErrorNote className="mt-3" message={error} />}
  </form>
);

const TextInput = ({ label, name, value, onChange, req }) => (
  <label className="grid gap-1">
    <span className="text-sm text-gray-600">
      {label}
      {req && <span className="text-red-600">*</span>}
    </span>
    <input
      name={name}
      value={value}
      onChange={onChange}
      required={!!req}
      className="px-3 py-2 rounded-xl border focus:outline-none focus:ring w-full"
    />
  </label>
);

const PasswordInput = (props) => <TextInput {...props} />;

const TextArea = ({ label, name, value, onChange, rows = 5, req }) => (
  <label className="grid gap-1">
    <span className="text-sm text-gray-600">
      {label}
      {req && <span className="text-red-600">*</span>}
    </span>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      required={!!req}
      className="px-3 py-2 rounded-xl border focus:outline-none focus:ring w-full"
    />
  </label>
);

const SubmitBtn = ({ children }) => (
  <button
    type="submit"
    className="mt-3 px-4 py-2 rounded-xl bg-gray-900 text-white hover:opacity-90"
  >
    {children}
  </button>
);

const EmptyState = ({ text, action }) => (
  <div className="bg-white rounded-2xl border p-6 text-center text-gray-600">
    <p>{text}</p>
    {action && <div className="mt-3">{action}</div>}
  </div>
);

const ErrorNote = ({ message, className = "" }) => (
  <div
    className={`rounded-xl border border-red-300 bg-red-50 text-red-700 px-3 py-2 ${className}`}
  >
    {message}
  </div>
);

// ======================
// NotFound
// ======================
const NotFound = () => (
  <div className="text-center">
    <h1 className="text-2xl font-bold">404</h1>
    <p>Страницата не е намерена.</p>
    <Link to="/" className="inline-block mt-3 px-4 py-2 rounded-xl border">
      Начало
    </Link>
  </div>
);

// ======================
// App & Routes
// ======================
const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Container>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/catalog/:id" element={<Details />} />

          {/* Guest only */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Private */}
          <Route element={<PrivateRoute />}>
            <Route path="/create" element={<Create />} />
            <Route path="/edit/:id" element={<Edit />} />
            <Route path="/my-recipes" element={<MyRecipes />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
