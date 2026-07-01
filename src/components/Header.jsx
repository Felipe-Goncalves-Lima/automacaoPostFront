import './Header.css';

const Header = () => {
  return (
    <header className="header glass-panel animate-fade-in">
      <div className="header-logo">
        <div className="logo-icon">F</div>
        <h1>Força Digital</h1>
      </div>
      <div className="header-status">
        <span className="status-dot"></span>
        <span className="status-text">Sistema de Postagem Ativo</span>
      </div>
    </header>
  );
};

export default Header;
