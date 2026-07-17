export default function OfflinePage() {
  return (
    <main className="offlinePage">
      <img src="/icons/icon-192.png" width="96" height="96" alt="Balot Arena" />
      <h1>Balot Arena</h1>
      <h2>لا يوجد اتصال بالإنترنت</h2>
      <p>أعد الاتصال ثم افتح التطبيق مرة أخرى لتحميل اللاعبين وحفظ الصكات وتحديث الإحصائيات.</p>
      <a className="primary" href="/">إعادة المحاولة</a>
    </main>
  );
}
