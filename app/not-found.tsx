import Link from "next/link";

export default function NotFound() {
  return (
    <section className="panel">
      <h1>Страница не найдена</h1>
      <p className="section-note">
        Возможно, статья была удалена или slug изменился. Вернись на <Link href="/">главную страницу</Link>.
      </p>
    </section>
  );
}
