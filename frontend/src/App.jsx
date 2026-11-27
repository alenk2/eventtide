import { useEffect, useState } from "react";
import "./App.css";
import Icon from "./Icon.jsx";
import Prijava from "./Prijava.jsx";
import JavniDogodki from "./JavniDogodki.jsx";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

function Registracija({ poRegistraciji }) {
  const [oddajanje, nastaviVTeku] = useState(false);
  const [napaka, nastaviNapako] = useState("");

  async function registriraj(event) {
    event.preventDefault();
    const obrazec = event.currentTarget;
    const podatki = new FormData(obrazec);

    nastaviVTeku(true);
    nastaviNapako("");

    try {
      const odgovor = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(podatki)),
      });

      const rezultat = await odgovor.json().catch(() => null);

      if (odgovor.status !== 201) {
        nastaviNapako(rezultat?.error || "Registracija ni uspela.");
        return;
      }

      obrazec.reset();
      poRegistraciji();
    } catch {
      nastaviNapako("Povezava s strežnikom ni uspela.");
    } finally {
      nastaviVTeku(false);
    }
  }

  return (
    <section className="auth-card">
      <h2>Ustvari račun</h2>

      <form onSubmit={registriraj}>
        <p>
          <label>
            Ime <input name="ime" autoComplete="name" required />
          </label>
        </p>
        <p>
          <label>
            E-pošta{" "}
            <input name="email" type="email" autoComplete="email" required />
          </label>
        </p>
        <p>
          <label>
            Geslo{" "}
            <input
              name="geslo"
              type="password"
              autoComplete="new-password"
              minLength={12}
              aria-describedby="geslo-pomoc"
              required
            />
          </label>
        </p>
        <p id="geslo-pomoc">Uporabi vsaj 12 znakov.</p>
        <button type="submit" disabled={oddajanje}>
          {oddajanje ? "Ustvarjam račun …" : "Ustvari račun"}
        </button>
      </form>

      {napaka && <p role="alert">{napaka}</p>}
    </section>
  );
}

export default function App() {
  const [pogled, nastaviPogled] = useState(() => window.location.hash.slice(1));
  const [uporabnik, nastaviUporabnika] = useState(null);
  const [registriran, nastaviRegistriran] = useState(false);

  useEffect(() => {
    const spremeniPogled = () => nastaviPogled(window.location.hash.slice(1));
    window.addEventListener("hashchange", spremeniPogled);
    return () => window.removeEventListener("hashchange", spremeniPogled);
  }, []);

  useEffect(() => {
    if (pogled === "dogodki") document.getElementById("dogodki")?.scrollIntoView();
    if (pogled === "racun" || pogled === "registracija") {
      window.scrollTo(0, 0);
      document.getElementById("vsebina")?.focus({ preventScroll: true });
    }
  }, [pogled]);

  const registracija = pogled === "registracija" && !uporabnik;
  const racun = pogled === "racun" || pogled === "registracija";

  return (
    <>
      <a className="skip-link" href="#vsebina" onClick={(event) => {
        event.preventDefault();
        document.getElementById("vsebina")?.focus();
      }}>Preskoči na vsebino</a>
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#" aria-label="EventTide, domača stran">
            <span className="brand-icon" aria-hidden="true"><Icon name="wave" /></span>
            EventTide<span className="brand-dot">.</span>
          </a>
          <nav aria-label="Glavna navigacija">
            <a href="#" className="nav-link" aria-current={!racun ? "page" : undefined}>Razišči</a>
            <a href="#racun" className="nav-link" aria-current={racun && !registracija ? "page" : undefined}>
              {uporabnik ? "Moj račun" : "Prijava"}
            </a>
            {!uporabnik && <a className="button primary header-cta" href="#registracija">Ustvari račun <Icon name="arrow" /></a>}
          </nav>
        </div>
      </header>
      <main id="vsebina" className="container main-content" tabIndex={-1}>
        <div hidden={racun}>
          <section className="cover" aria-labelledby="naslovnica">
            <div className="cover-copy">
              <h1 id="naslovnica">Naslednji dogodek<br /> <em>je tvoj.</em></h1>
              <p>Odkrij prihajajoče dogodke, poišči svojega in si rezerviraj mesto.</p>
              <a className="button cover-button" href="#dogodki">Razišči dogodke <Icon name="down" /></a>
            </div>
          </section>
          <JavniDogodki aktiven={!racun} uporabnik={uporabnik} />
        </div>
        {registracija && (
          <div className="auth-layout">
            <h1>Pridruži se EventTide</h1>
            <Registracija poRegistraciji={() => {
              nastaviRegistriran(true);
              window.location.hash = "racun";
            }} />
            <p>Že imaš račun? <a href="#racun">Prijavi se</a></p>
          </div>
        )}
        <div hidden={!racun || registracija}>
          <Prijava vidna={racun && !registracija} uporabnik={uporabnik}
            nastaviUporabnika={nastaviUporabnika} registriran={registriran}
            poPrijavi={() => nastaviRegistriran(false)} />
        </div>
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <a className="brand" href="#">EventTide<span className="brand-dot">.</span></a>
          <a href="#dogodki">Prihajajoči dogodki <Icon name="arrow" /></a>
        </div>
      </footer>
    </>
  );
}
