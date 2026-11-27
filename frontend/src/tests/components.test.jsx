// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import Prijava from "../Prijava.jsx";
import JavniDogodki from "../JavniDogodki.jsx";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async (url) => {
    if (url.includes("/api/auth/me")) {
      return {
        ok: false,
        status: 401,
      };
    }

    return {
      ok: true,
      json: async () =>
        url.includes("/api/kategorije")
          ? { kategorije: [] }
          : { dogodki: [] },
    };
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function prikaziPrijavo(registriran = false) {
  return render(
    <Prijava
      vidna={true}
      uporabnik={null}
      nastaviUporabnika={vi.fn()}
      registriran={registriran}
      poPrijavi={vi.fn()}
    />
  );
}

describe("Prijavni obrazec", () => {
  it("Prikaže prijavni obrazec", async () => {
    prikaziPrijavo();

    expect(
      await screen.findByRole("heading", { name: "Prijava" })
    ).toBeInTheDocument();
  });

  it("Zahteva vnos emaila", async () => {
    prikaziPrijavo();

    const email = await screen.findByLabelText("E-pošta");

    expect(email).toBeRequired();
    expect(email).toHaveAttribute("type", "email");
  });

  it("Zahteva vnos gesla in skrije njegovo vrednost", async () => {
    prikaziPrijavo();

    const geslo = await screen.findByLabelText("Geslo");

    expect(geslo).toBeRequired();
    expect(geslo).toHaveAttribute("type", "password");
  });

  it("Prikaže obvestilo po uspešni registraciji", async () => {
    prikaziPrijavo(true);

    expect(
      await screen.findByText(
        "Račun je ustvarjen. Zdaj se lahko prijaviš."
      )
    ).toBeInTheDocument();
  });
});

describe("Javni dogodki", () => {
  it("Prikaže naslov kataloga dogodkov", async () => {
    render(<JavniDogodki aktiven={true} uporabnik={null} />);

    expect(
      await screen.findByRole("heading", {
        name: "Prihajajoči dogodki",
      })
    ).toBeInTheDocument();
  });

  it("Prikaže iskalno polje", async () => {
    render(<JavniDogodki aktiven={true} uporabnik={null} />);

    expect(
      await screen.findByPlaceholderText("Vnesi naslov dogodka")
    ).toBeInTheDocument();
  });

  it("Prikaže sporočilo pri praznem seznamu dogodkov", async () => {
    render(<JavniDogodki aktiven={true} uporabnik={null} />);

    expect(
      await screen.findByText("Trenutno ni prihajajočih dogodkov")
    ).toBeInTheDocument();
  });

  it("Prikaže sporočilo, kadar iskanje nima zadetkov", async () => {
    render(<JavniDogodki aktiven={true} uporabnik={null} />);

    fireEvent.change(
      screen.getByPlaceholderText("Vnesi naslov dogodka"),
      { target: { value: "Neobstojec dogodek" } }
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Poišči" })
    );

    expect(
      await screen.findByText("Ni zadetkov")
    ).toBeInTheDocument();
  });
});