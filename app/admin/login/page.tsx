"use client";

import Link from "next/link";
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
        credentials: "same-origin",
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; retryAfterSeconds?: number }
          | null;

        if (response.status === 429) {
          const retryAfter = payload?.retryAfterSeconds;
          if (typeof retryAfter === "number" && retryAfter > 0) {
            const minutes = Math.max(1, Math.ceil(retryAfter / 60));
            setError(`Слишком много попыток. Попробуй через ${minutes} мин.`);
          } else {
            setError("Слишком много попыток. Попробуй позже.");
          }
          return;
        }

        if (response.status === 500) {
          setError("Проблема с конфигурацией админки на сервере.");
          return;
        }

        if (response.status === 403) {
          setError("Запрос входа отклонен политикой безопасности (origin/referer).");
          return;
        }

        if (payload?.error) {
          setError(payload.error);
          return;
        }

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
    <section className="auth-login-shell">
      <div className="panel auth-login-card">
        <Link href="/" className="auth-login-brand" aria-label="На главную">
          <span className="brand-dot">&lt;/&gt;</span>
          <span className="brand-name">rblog</span>
        </Link>

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
          <div className="actions auth-login-actions">
            <button className="btn-primary auth-login-submit" type="submit" disabled={pending}>
              {pending ? "Проверка..." : "Войти"}
            </button>
          </div>
        </form>

        {error && <p className="text-error">{error}</p>}
      </div>

      <Link href="/" className="btn-secondary auth-login-back">
        Вернуться к блогу
      </Link>
    </section>
  );
}
