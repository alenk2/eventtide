import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const oblikovalnikDatuma = new Intl.DateTimeFormat("sl-SI", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Ljubljana",
});

function datum(cas) {
  return oblikovalnikDatuma.format(new Date(cas));
}

function useJavniApi(pot, osvezitev = 0, aktiven = true) {
  const [rezultat, nastaviRezultat] = useState(null);

  useEffect(() => {
    if (!pot || !aktiven) return;

    const controller = new AbortController();

    async function nalozi() {
      try {
        const odgovor = await fetch(`${API_URL}${pot}`, {
          signal: controller.signal,
        });
        const podatki = await odgovor.json();

        if (!odgovor.ok) {
          throw new Error(podatki.error || "Podatkov ni mogoče naložiti.");
        }

        if (!controller.signal.aborted) {
          nastaviRezultat({ pot, podatki });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          nastaviRezultat({ pot, napaka: error instanceof TypeError ? "Povezava s strežnikom ni uspela." : error.message });
        }
      }
    }

    nalozi();
    return () => controller.abort();
  }, [pot, osvezitev, aktiven]);

  return rezultat?.pot === pot ? rezultat : null;
}

function PrijavaNaDogodek({ dogodek, poPrijavi, uporabnik }) {
  const [vTeku, nastaviVTeku] = useState(false);
  const [sporocilo, nastaviSporocilo] = useState("");
  const [napaka, nastaviNapako] = useState("");
  const [casOdprtja] = useState(() => Date.now());

  const rokPotekel = new Date(dogodek.rok_prijave).getTime() <= casOdprtja;

  async function prijavi() {
    nastaviVTeku(true);
    nastaviNapako("");

    try {
      const odgovor = await fetch(
        `${API_URL}/api/dogodki/${dogodek.id}/prijava`,
        { method: "POST", credentials: "include" },
      );
      const podatki = await odgovor.json();

      if (odgovor.status === 401) {
        nastaviNapako("Najprej se prijavi v svoj račun.");
        return;
      }

      if (!odgovor.ok) {
        nastaviNapako(podatki.error || "Prijava ni uspela.");
        return;
      }

      nastaviSporocilo(
        podatki.prijava.status === "potrjena"
          ? "Prijava je potrjena."
          : "Dodan si na čakalni seznam.",
      );
      poPrijavi();
    } catch {
      nastaviNapako("Prijave trenutno ni mogoče poslati.");
    } finally {
      nastaviVTeku(false);
    }
  }

  return (
    <div>
      {sporocilo && <p role="status">{sporocilo}</p>}
      {napaka && <p role="alert">{napaka}</p>}
      {!sporocilo && (
        rokPotekel ? (
          <p>Rok za prijavo je potekel.</p>
        ) : !uporabnik ? (
          <a className="button primary" href="#racun">Prijavi se za udeležbo <Icon name="arrow" /></a>
        ) : uporabnik.vloga !== "udeleženec" ? (
          <p>Prijave na dogodke so na voljo udeležencem.</p>
        ) : (
          <button className="primary" type="button" onClick={prijavi} disabled={vTeku}>
            {vTeku
              ? "Pošiljanje …"
              : dogodek.prosta_mesta === 0
                ? "Pridruži se čakalnemu seznamu"
                : "Prijavi se na dogodek"}
          </button>
        )
      )}
    </div>
  );
}

export default function JavniDogodki({ aktiven, uporabnik }) {
  const dialog = useRef(null);
  const [filtri, nastaviFiltre] = useState("");
  const [izbraniId, nastaviIzbraniId] = useState(null);
  const [osvezitev, nastaviOsvezitev] = useState(0);

  const seznam = useJavniApi(
    `/api/dogodki${filtri ? `?${filtri}` : ""}`,
    osvezitev,
    aktiven,
  );
  const izbor = useJavniApi("/api/kategorije", osvezitev, aktiven);
  const podrobnosti = useJavniApi(
    izbraniId === null ? null : `/api/dogodki/${izbraniId}`,
    osvezitev,
    aktiven,
  );
  const dogodek = podrobnosti?.podatki?.dogodek;

  useEffect(() => {
    const okno = dialog.current;
    if (aktiven && izbraniId !== null && !okno.open) okno.showModal();
    if (!aktiven && okno.open) okno.close();
  }, [aktiven, izbraniId]);

  function poisci(event) {
    event.preventDefault();
    const parametri = new URLSearchParams();

    for (const [ime, vrednost] of new FormData(event.currentTarget)) {
      const vnos = vrednost.trim();
      if (vnos) parametri.set(ime, vnos);
    }

    nastaviIzbraniId(null);
    nastaviFiltre(parametri.toString());
  }

  return (
    <section className="catalog" id="dogodki" aria-labelledby="dogodki-naslov">
      <div className="catalog-heading">
        <div><h2 id="dogodki-naslov">Prihajajoči dogodki</h2>
          <p>Najdi dogodke po naslovu, kategoriji ali datumu.</p></div>
        {seznam?.podatki && <output className="count">{seznam.podatki.dogodki.length} <span>v prikazu</span></output>}
      </div>

      <form className="filters" onSubmit={poisci}>
        <label>
          Iskanje
          <span className="search-field"><Icon name="search" />
            <input name="iskanje" type="search" placeholder="Vnesi naslov dogodka" maxLength={200} />
          </span>
        </label>{" "}
        <label>
          Kategorija{" "}
          <select name="kategorija_id" disabled={!izbor?.podatki}>
            <option value="">{izbor?.napaka ? "Kategorije niso na voljo" : "Vse kategorije"}</option>
            {izbor?.podatki?.kategorije.map((kategorija) => (
              <option key={kategorija.id} value={kategorija.id}>
                {kategorija.naziv}
              </option>
            ))}
          </select>
        </label>{" "}
        <label>
          Datum začetka <input name="datum" type="date" />
        </label>{" "}
        <button className="primary" type="submit">Poišči <Icon name="arrow" /></button>{" "}
        <button
          className="quiet"
          type="reset"
          onClick={() => {
            nastaviFiltre("");
            nastaviIzbraniId(null);
          }}
        >
          Počisti filtre
        </button>
      </form>

      {izbor?.napaka && !seznam?.napaka && <p role="alert">{izbor.napaka}</p>}
      {!seznam && <p className="empty-state" role="status">Nalaganje dogodkov …</p>}
      {seznam?.napaka && (
        <div className="empty-state">
          <Icon name="calendar" />
          <h3>Dogodkov trenutno ni mogoče naložiti</h3>
          <p role="alert">{seznam.napaka}</p>
          <button type="button" onClick={() => nastaviOsvezitev((prejsnja) => prejsnja + 1)}>Poskusi znova</button>
        </div>
      )}
      {seznam?.podatki?.dogodki.length === 0 && (
        <div className="empty-state">
          <Icon name="calendar" />
          <h3>{filtri ? "Ni zadetkov" : "Trenutno ni prihajajočih dogodkov"}</h3>
          {filtri && <p>Spremeni ali počisti filtre in poskusi znova.</p>}
        </div>
      )}

      <div className="event-grid">
        {seznam?.podatki?.dogodki.map((vnos) => (
          <article className="event-card" key={vnos.id}>
            <div className="event-banner" data-category={vnos.kategorija}>
              <span className="pill">{vnos.kategorija}</span>
              <Icon name="wave" />
            </div>
            <div className="event-copy">
              <h3>{vnos.naslov}</h3>
              <p><Icon name="calendar" /> <time dateTime={vnos.zacetek}>{datum(vnos.zacetek)}</time></p>
              <p><Icon name="pin" /> {vnos.lokacija}</p>
              <div className="event-actions">
                <span>{vnos.prosta_mesta === 0 ? "Zapolnjeno" : `Prosta mesta: ${vnos.prosta_mesta}`}</span>
                <button className="quiet" type="button" onClick={() => nastaviIzbraniId(vnos.id)}>
                  Podrobnosti <Icon name="arrow" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <dialog ref={dialog} onClose={() => nastaviIzbraniId(null)} aria-label="Podrobnosti dogodka">
        <div className="dialog-inner">
          <button className="close-button" type="button" aria-label="Zapri podrobnosti"
            onClick={() => dialog.current.close()}><Icon name="close" /></button>
          {!podrobnosti && <p role="status">Nalaganje podrobnosti …</p>}
          {podrobnosti?.napaka && <p role="alert">{podrobnosti.napaka}</p>}
          {dogodek && (
            <>
              <span className="pill">{dogodek.kategorija}</span>
              <h2>{dogodek.naslov}</h2>
              <p className="event-description">{dogodek.opis}</p>
              <p>Lokacija: {dogodek.lokacija}</p>
              <p>Začetek: {datum(dogodek.zacetek)}</p>
              <p>Konec: {datum(dogodek.konec)}</p>
              <p>Rok prijave: {datum(dogodek.rok_prijave)}</p>
              <p>Prosta mesta: {dogodek.prosta_mesta}</p>
              <PrijavaNaDogodek
                key={dogodek.id}
                dogodek={dogodek}
                uporabnik={uporabnik}
                poPrijavi={() => nastaviOsvezitev((prejsnja) => prejsnja + 1)}
              />
            </>
          )}
        </div>
      </dialog>
    </section>
  );
}