import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const validate = () => {
    const e = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address";
    if (!form.password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      push(`Welcome back, ${user.name.split(" ")[0]}`, "success");
      navigate(location.state?.from || "/courses");
    } catch (err) {
      push(err.response?.data?.detail || "Couldn't log in. Check your credentials.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 bg-mesh">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
        <p className="text-sm text-ink/55 mb-6">Log in to keep learning where you left off.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Email</label>
            <input
              type="email"
              className="input-field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-coral-600 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Password</label>
            <input
              type="password"
              className="input-field"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-coral-600 text-xs mt-1">{errors.password}</p>}
          </div>
          <button type="submit" className="btn-primary mt-2" disabled={submitting}>
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-sm text-ink/55 mt-6 text-center">
          New to SkillHub? <Link to="/register" className="text-violet-600 font-semibold">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
