import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TXDAPP Lite — Mobilidade para Todos",
  description: "Versão leve do TXDAPP para celulares antigos e conexão 2G.",
  robots: "noindex, nofollow",
};

const styles = `
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#0a0d12;color:#e5e7eb;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:16px;line-height:1.5;-webkit-text-size-adjust:100%}
  .wrap{max-width:480px;margin:0 auto;padding:16px}
  header{text-align:center;padding:32px 0 24px}
  .logo{font-size:24px;font-weight:800;color:#3ECB8E;text-decoration:none}
  .sub{color:#6b7280;font-size:14px;margin-top:4px}
  .btn{display:block;width:100%;padding:14px;border-radius:12px;font-size:16px;font-weight:700;border:none;cursor:pointer;text-align:center;text-decoration:none;margin-bottom:8px}
  .btn-primary{background:#3ECB8E;color:#000}
  .btn-secondary{background:#1f2937;color:#e5e7eb;border:1px solid #374151}
  .card{background:#11151c;border:1px solid #1f2937;border-radius:16px;padding:16px;margin-bottom:12px}
  .card h3{font-size:14px;color:#9ca3af;margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .item{background:#1f2937;border-radius:12px;padding:12px;text-align:center}
  .item .icon{font-size:24px;margin-bottom:4px}
  .item .name{font-size:13px;font-weight:600}
  .item .price{font-size:12px;color:#3ECB8E;font-weight:700;margin-top:2px}
  .input{width:100%;padding:14px;border-radius:12px;border:1px solid #374151;background:#1f2937;color:#fff;font-size:16px;margin-bottom:8px;outline:none}
  .input:focus{border-color:#3ECB8E}
  .footer{text-align:center;padding:24px 0;color:#6b7280;font-size:12px}
  .footer a{color:#3ECB8E;text-decoration:none}
  .safe-bottom{padding-bottom:env(safe-area-inset-bottom,0px)}
`;

export default function LitePage() {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
        <style dangerouslySetInnerHTML={{ __html: styles }} />
      </head>
      <body className="safe-bottom">
        <div className="wrap">
          <header>
            <div className="logo">TXDAPP Lite</div>
            <div className="sub">Versão leve — menos de 100KB</div>
          </header>

          <div className="card">
            <h3>Solicitar</h3>
            <input className="input" type="text" placeholder="De onde vamos partir?" readOnly />
            <input className="input" type="text" placeholder="Para onde vamos?" readOnly />
            <button className="btn btn-primary" disabled>Solicitar corrida</button>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
              Faça login no app completo para solicitar
            </p>
          </div>

          <div className="card">
            <h3>Serviços</h3>
            <div className="grid">
              <div className="item"><div className="icon">🚗</div><div className="name">Carro</div><div className="price">R$ 25</div></div>
              <div className="item"><div className="icon">🛵</div><div className="name">Moto</div><div className="price">R$ 15</div></div>
              <div className="item"><div className="icon">📦</div><div className="name">Entrega</div><div className="price">R$ 10</div></div>
              <div className="item"><div className="icon">🚚</div><div className="name">Frete</div><div className="price">R$ 45</div></div>
            </div>
          </div>

          <div className="card">
            <h3>Acesso rápido</h3>
            <a className="btn btn-primary" href="/auth/login?lite=1">Entrar no TXDAPP</a>
            <a className="btn btn-secondary" href="/auth/register?lite=1">Criar conta grátis</a>
          </div>

          <div className="card">
            <h3>Por que o TXDAPP Lite?</h3>
            <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>
              Funciona em celulares com Android 6+, iPhone 6+, e conexão 2G.
              Sem animações, sem vídeos, sem JavaScript pesado. Apenas o essencial
              para você solicitar sua corrida ou entrega.
            </p>
          </div>

          <div className="footer">
            <a href="/">Versão completa</a> &middot;
            <a href="/termos">Termos</a> &middot;
            <a href="/privacidade">Privacidade</a>
          </div>
        </div>
      </body>
    </html>
  );
}