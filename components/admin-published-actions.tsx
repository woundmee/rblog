"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminPublishedActionsProps = {
  id: number;
};

export default function AdminPublishedActions({ id }: AdminPublishedActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const onDelete = async () => {
    if (isDeleting) {
      return;
    }

    const confirmed = window.confirm("Удалить статью? Это действие нельзя отменить.");
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Не удалось удалить статью.");
      }

      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось удалить статью.";
      window.alert(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="admin-post-actions">
      <Link href={`/admin/edit/${id}`} className="btn-secondary">
        Редактировать
      </Link>
      <button type="button" className="btn-danger" onClick={onDelete} disabled={isDeleting}>
        {isDeleting ? "Удаление..." : "Удалить"}
      </button>
    </div>
  );
}
