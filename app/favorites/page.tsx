import BookmarksPageList from "@/components/bookmarks-page-list";

export default function FavoritesPage() {
  return (
    <section className="content-stack">
      <header className="content-header">
        <h1>Избранное</h1>
        <p>Список сохраненных статей и ресурсов.</p>
      </header>

      <BookmarksPageList />
    </section>
  );
}
