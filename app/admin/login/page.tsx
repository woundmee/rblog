"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/admin/new");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (next && next.startsWith("/")) {
      setNextPath(next);
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        setError("Неверный логин или пароль.");
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Ошибка сети. Попробуй ещё раз.");
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="panel auth-panel">
      <header className="section-head">
        <h1>Вход в админ-панель</h1>
        <p>Доступ только владельцу блога.</p>
      </header>
      <form className="editor-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Логин</span>
          <input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Пароль</span>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <div className="actions">
          <button className="btn-primary" type="submit" disabled={pending}>
            {pending ? "Проверка..." : "Войти"}
          </button>
        </div>
      </form>
      {error && <p className="text-error">{error}</p>}
    </section>
  );
}
