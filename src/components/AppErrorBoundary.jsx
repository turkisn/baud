import { Component } from 'react';

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-[#070604] px-6 text-center text-warm-white">
        <div className="max-w-lg rounded-3xl border border-gold/25 bg-black/60 p-8 shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-[.24em] text-gold">BUOD / RECOVERY</p>
          <h1 className="mt-4 text-3xl font-black">Something went wrong</h1>
          <p className="mt-2 text-xl font-bold text-light-gold" dir="rtl">حدث خطأ غير متوقع</p>
          <p className="mt-5 leading-7 text-sand/75">
            Refresh the page to reconnect. / حدّث الصفحة لإعادة الاتصال.
          </p>
          <button type="button" onClick={() => window.location.reload()} className="btn-gold mt-7 justify-center">
            Refresh / تحديث
          </button>
        </div>
      </main>
    );
  }
}
