"use client";

import { useState } from "react";

type CleanupResponse = {
  ok?: boolean;
  error?: string;
  totalStored?: number;
  referenced?: number;
  removed?: number;
  remaining?: number;
  removedNames?: string[];
};

export default function MediaCleanupForm() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<CleanupResponse | null>(null);

  const runCleanup = async () => {
    setPending(true);
    setResult(null);

    try {
      const response = await fetch("/api/uploads/images/cleanup", {
        method: "POST"
      });
      const data = (await response.json()) as CleanupResponse;
      if (!response.ok) {
        setResult({ error: data.error ?? "Не удалось выполнить очистку." });
        return;
      }
      setResult(data);
    } catch {
      setResult({ error: "Ошибка сети. Повтори попытку." });
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="panel media-cleanup-panel">
      <header className="section-head section-head-compact">
        <h2>Обслуживание изображений</h2>
      </header>
      <p className="section-note">
        Команда проверяет все картинки в <code>/uploads/images</code> и удаляет те, на которые нет ссылок в статьях,
        разделе «Обо мне» и рекламном блоке.
      </p>

      <div className="actions">
        <button type="button" className="btn-danger" onClick={runCleanup} disabled={pending}>
          {pending ? "Очистка..." : "Удалить неиспользуемые картинки"}
        </button>
      </div>

      {result?.error && <p className="text-error">{result.error}</p>}

      {result?.ok && (
        <div className="media-cleanup-result">
          <p>
            Найдено: <strong>{result.totalStored ?? 0}</strong> • Используется: <strong>{result.referenced ?? 0}</strong>{" "}
            • Удалено: <strong>{result.removed ?? 0}</strong> • Осталось: <strong>{result.remaining ?? 0}</strong>
          </p>
          {result.removedNames && result.removedNames.length > 0 ? (
            <div className="media-cleanup-list">
              {result.removedNames.slice(0, 20).map((name) => (
                <code key={name}>{name}</code>
              ))}
            </div>
          ) : (
            <p className="section-note">Неиспользуемые файлы не найдены.</p>
          )}
        </div>
      )}
    </section>
  );
}
