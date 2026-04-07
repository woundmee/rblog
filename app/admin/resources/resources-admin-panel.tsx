"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ResourceItem } from "@/lib/resources";

type ResourceDraft = {
  url: string;
  title: string;
  description: string;
};

type ResourcesAdminPanelProps = {
  initialResources: ResourceItem[];
};

const emptyDraft: ResourceDraft = {
  url: "",
  title: "",
  description: ""
};

const formatDate = (value: string): string => {
  try {
    return new Date(value).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  } catch {
    return value;
  }
};

const hostFromUrl = (value: string): string => {
  try {
    return new URL(value).hostname.replace(/^www\./i, "");
  } catch {
    return value;
  }
};

export default function ResourcesAdminPanel({ initialResources }: ResourcesAdminPanelProps) {
  const [resources, setResources] = useState<ResourceItem[]>(initialResources);
  const [draft, setDraft] = useState<ResourceDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState<ResourceDraft>(emptyDraft);
  const [pendingCreate, setPendingCreate] = useState(false);
  const [pendingUpdateId, setPendingUpdateId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const sortedResources = useMemo(
    () => [...resources].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [resources]
  );

  const showMessage = (text: string, error = false) => {
    setMessage(text);
    setIsError(error);
  };

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pendingCreate) {
      return;
    }

    setPendingCreate(true);
    showMessage("");

    try {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft)
      });

      const payload = (await response.json().catch(() => null)) as { error?: string; resource?: ResourceItem } | null;
      if (!response.ok || !payload?.resource) {
        showMessage(payload?.error ?? "Не удалось создать ресурс.", true);
        return;
      }

      setResources((prev) => [payload.resource as ResourceItem, ...prev]);
      setDraft(emptyDraft);
      showMessage("Ресурс добавлен. Обложка подтянута автоматически из Open-Graph.");
    } catch {
      showMessage("Сетевая ошибка при создании ресурса.", true);
    } finally {
      setPendingCreate(false);
    }
  };

  const startEdit = (resource: ResourceItem) => {
    setEditingId(resource.id);
    setEditingDraft({
      url: resource.url,
      title: resource.title,
      description: resource.description
    });
    showMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingDraft(emptyDraft);
  };

  const onUpdate = async (id: number) => {
    if (pendingUpdateId) {
      return;
    }

    setPendingUpdateId(id);
    showMessage("");

    try {
      const response = await fetch(`/api/resources/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingDraft)
      });

      const payload = (await response.json().catch(() => null)) as { error?: string; resource?: ResourceItem } | null;
      if (!response.ok || !payload?.resource) {
        showMessage(payload?.error ?? "Не удалось обновить ресурс.", true);
        return;
      }

      setResources((prev) => prev.map((item) => (item.id === id ? (payload.resource as ResourceItem) : item)));
      setEditingId(null);
      setEditingDraft(emptyDraft);
      showMessage("Ресурс обновлен.");
    } catch {
      showMessage("Сетевая ошибка при обновлении ресурса.", true);
    } finally {
      setPendingUpdateId(null);
    }
  };

  const onDelete = async (id: number) => {
    if (pendingDeleteId) {
      return;
    }

    const confirmed = window.confirm("Удалить ресурс? Это действие нельзя отменить.");
    if (!confirmed) {
      return;
    }

    setPendingDeleteId(id);
    showMessage("");

    try {
      const response = await fetch(`/api/resources/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        showMessage(payload?.error ?? "Не удалось удалить ресурс.", true);
        return;
      }

      setResources((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) {
        cancelEdit();
      }
      showMessage("Ресурс удален.");
    } catch {
      showMessage("Сетевая ошибка при удалении ресурса.", true);
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="content-stack">
      <section className="panel">
        <header className="section-head section-head-compact">
          <h2>Новый ресурс</h2>
          <p>Вставь ссылку и сохрани. Обложка подтянется автоматически через Open-Graph.</p>
        </header>

        <form className="editor-form" onSubmit={onCreate}>
          <div className="field-grid">
            <label className="field">
              <span>Заголовок</span>
              <input
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Короткий заголовок карточки"
                required
              />
            </label>
            <label className="field">
              <span>Ссылка (URL)</span>
              <input
                value={draft.url}
                onChange={(event) => setDraft((prev) => ({ ...prev, url: event.target.value }))}
                placeholder="https://github.com/..."
                required
              />
            </label>
          </div>

          <label className="field">
            <span>Описание (опционально)</span>
            <textarea
              className="resource-admin-textarea"
              value={draft.description}
              onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Оставь пустым, чтобы взять из OG"
            />
          </label>

          <div className="actions">
            <button type="submit" className="btn-primary" disabled={pendingCreate}>
              {pendingCreate ? "Сохранение..." : "Добавить ресурс"}
            </button>
            {message && <p className={isError ? "text-error" : "text-success"}>{message}</p>}
          </div>
        </form>
      </section>

      <section className="panel admin-list">
        <header className="section-head section-head-compact admin-list-header">
          <h2>Список ресурсов</h2>
          <p>Нажатие на карточку на публичной странице открывает внешнюю ссылку.</p>
        </header>

        {sortedResources.length === 0 ? (
          <p>Пока нет ресурсов.</p>
        ) : (
          <div className="admin-resources-list">
            {sortedResources.map((resource) => {
              const isEditing = editingId === resource.id;
              return (
                <article key={resource.id} className="admin-resource-row">
                  <div className="admin-resource-preview">
                    {resource.imageUrl ? (
                      <img src={resource.imageUrl} alt={resource.title} loading="lazy" />
                    ) : (
                      <div className="admin-resource-preview-empty">{hostFromUrl(resource.url)}</div>
                    )}
                  </div>

                  <div className="admin-resource-content">
                    {isEditing ? (
                      <div className="editor-form">
                        <label className="field">
                          <span>Заголовок</span>
                          <input
                            value={editingDraft.title}
                            onChange={(event) =>
                              setEditingDraft((prev) => ({
                                ...prev,
                                title: event.target.value
                              }))
                            }
                          />
                        </label>
                        <label className="field">
                          <span>Ссылка</span>
                          <input
                            value={editingDraft.url}
                            onChange={(event) =>
                              setEditingDraft((prev) => ({
                                ...prev,
                                url: event.target.value
                              }))
                            }
                          />
                        </label>
                        <label className="field">
                          <span>Описание</span>
                          <textarea
                            className="resource-admin-textarea"
                            value={editingDraft.description}
                            onChange={(event) =>
                              setEditingDraft((prev) => ({
                                ...prev,
                                description: event.target.value
                              }))
                            }
                          />
                        </label>
                      </div>
                    ) : (
                      <>
                        <h3>{resource.title}</h3>
                        <p className="admin-resource-url">{resource.url}</p>
                        <p>{resource.description || "Описание отсутствует."}</p>
                        <small>Обновлено: {formatDate(resource.updatedAt)}</small>
                      </>
                    )}
                  </div>

                  <div className="admin-resource-actions">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => onUpdate(resource.id)}
                          disabled={pendingUpdateId === resource.id}
                        >
                          {pendingUpdateId === resource.id ? "Сохранение..." : "Сохранить"}
                        </button>
                        <button type="button" className="btn-secondary" onClick={cancelEdit}>
                          Отмена
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="btn-secondary" onClick={() => startEdit(resource)}>
                          Редактировать
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => onDelete(resource.id)}
                          disabled={pendingDeleteId === resource.id}
                        >
                          {pendingDeleteId === resource.id ? "Удаление..." : "Удалить"}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
