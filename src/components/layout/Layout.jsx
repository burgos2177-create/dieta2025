import Nav from './Nav.jsx';
import { ToastContainer } from '../ui/Toast.jsx';

export default function Layout({ active, onChange, children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav active={active} onChange={onChange} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">{children}</main>
      <footer className="text-center text-xs text-muted/60 py-6 border-t border-border/40 mt-6">
        Dieta 2025 · Basado en Lyle McDonald · datos en tu navegador (localStorage)
      </footer>
      <ToastContainer />
    </div>
  );
}
