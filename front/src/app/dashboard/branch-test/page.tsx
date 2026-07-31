export default function BranchTestPage() {
  return (
    <main>
      <form action="/api/branches" method="post">
        <input name="name" type="hidden" value="Тестовый филиал Codex 31.07.2026" />
        <button type="submit">Создать тестовый филиал</button>
      </form>
    </main>
  );
}
