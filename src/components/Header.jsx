import { useState, useEffect } from 'react';
import './Header.css';

const Header = () => {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('forca-digital-theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('forca-digital-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <header className="header glass-panel animate-fade-in">
      <div className="header-logo">
        <div className="logo-icon">F</div>
        <h1>Força Digital</h1>
      </div>
      <div className="header-status">
        <button className="theme-toggle-btn" onClick={toggleTheme} title="Alternar Modo Claro/Escuro">
          {theme === 'dark' ? <i className="bi bi-sun-fill" style={{ color: '#F59E0B' }}></i> : <i className="bi bi-moon-fill" style={{ color: '#475569' }}></i>}
        </button>
        <span className="status-dot"></span>
        <span className="status-text">Sistema de Postagem Ativo</span>
      </div>
    </header>
  );
};

export default Header;
