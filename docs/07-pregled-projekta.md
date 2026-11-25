# EventTide – pregled prevzetega projekta

## Pregled projekta

EventTide je spletna aplikacija za objavljanje dogodkov in upravljanje prijav nanje. Frontend je izdelan z Reactom in Vite, backend z Node.js in Express, za shranjevanje podatkov pa se uporablja PostgreSQL.

Pregled temelji na dokumentaciji projekta, predvsem na dokumentih `02-funkcionalnosti-in-obseg.md` in `05-uporabniske-zgodbe.md`, ter analizi izvorne kode frontenda in backenda.

## Implementirane MVP funkcionalnosti

| Funkcionalnost | Stanje | Ugotovitve |
| --- | --- | --- |
| Objava dogodka | Implementirana | Organizator lahko ustvari osnutek in ga objavi. Sistem preverja obvezne podatke, termine in kapaciteto. |
| Iskanje dogodkov | Implementirana | Omogočeno je iskanje po naslovu ter filtriranje po kategoriji in datumu. |
| Prijava na dogodek | Implementirana | Sistem preverja rok za prijavo in razpoložljiva mesta ter preprečuje podvojene prijave. |
| Čakalni seznam | Delno ustrezna | Uvrščanje in samodejno potrjevanje sta implementirana, vendar pri samodejni potrditvi manjka preverjanje roka za prijavo. |
| Upravljanje lastnih prijav | Delno ustrezna | Udeleženec lahko pregleda in odpove svoje prijave, vendar backend ne prepreči odpovedi po začetku dogodka. |
| Evidentiranje prisotnosti | Delno ustrezna | Organizator lahko evidentira prisotnost potrjenih udeležencev svojih dogodkov, vendar backend ne preverja, ali se je dogodek že začel. |
| Administratorsko upravljanje | Delno ustrezna | Omogočeni so pregled računov, dodelitev vloge organizatorja, deaktivacija računov in umik dogodkov. Manjkata možnost vrnitve vloge udeleženca in vnos razloga za umik dogodka. |

Poleg sedmih MVP funkcionalnosti so implementirani tudi osnovna registracija, prijava, odjava in preverjanje uporabniških pravic.

## Pregled uporabniških zgodb

### US-01 – Objava dogodka

Organizator lahko vnese vse zahtevane podatke, ustvari osnutek in ga objavi. Backend preverja obvezna polja, pozitivno celoštevilsko kapaciteto ter časovno zaporedje začetka, konca in roka za prijavo. Objavljeni javni prihajajoči dogodki so vključeni v javni seznam.

**Ocena:** implementacija ustreza sprejemnim kriterijem.

### US-02 – Iskanje in filtriranje dogodkov

Iskanje po naslovu ni občutljivo na velikost črk. Rezultate je mogoče omejiti s kategorijo in datumom začetka dogodka. Prikazani so naslov, datum, lokacija in razpoložljivost mest. Ob neuspešnem iskanju se prikaže sporočilo »Ni zadetkov« namesto predvidenega »Ni najdenih dogodkov«.

**Ocena:** funkcionalno izpolnjena, z manjšim odstopanjem v besedilu sporočila.

### US-03 – Prijava na dogodek

Prijava je omejena na prijavljene udeležence, objavljene javne dogodke in veljaven rok za prijavo. Če je mesto prosto, prijava dobi status `potrjena`. Podvojene prijave preprečuje omejitev enoličnosti v podatkovni bazi, sočasne prijave pa so obravnavane s transakcijami in zaklepanjem dogodka (`FOR UPDATE`). Implementacija preprečuje tudi ponovno prijavo po odpovedi, čeprav zgodba zahteva le preprečevanje podvojenih aktivnih prijav.

**Ocena:** implementacija ustreza osnovnim sprejemnim kriterijem; sočasnost ni bila praktično testirana.

### US-04 – Uvrstitev na čakalni seznam

Če je kapaciteta dogodka zapolnjena in rok za prijavo še ni potekel, nova prijava dobi status `cakalna`. Udeleženec lahko status spremlja v pregledu svojih prijav. Pri izbiri prvega čakajočega sistem upošteva čas prijave in ob enakem času ID prijave.

**Ocena:** implementacija ustreza sprejemnim kriterijem.

### US-05 – Samodejna potrditev čakajočega

Ob odpovedi potrjene prijave na objavljenem dogodku sistem samodejno spremeni status prvega čakajočega v `potrjena`. Odpoved in premik se izvedeta znotraj transakcije z zaklepom dogodka. Premiki se ne izvajajo za dogodke, ki niso objavljeni.

V končni točki `/api/moje-prijave/:id/odpoved` v datoteki `backend/src/server.js` pa manjka preverjanje roka za prijavo. Zato se lahko čakajoči potrdi tudi po izteku tega roka.

**Ocena:** delno izpolnjena, saj časovna omejitev samodejnega potrjevanja ni implementirana.

## Zaključek

Vseh sedem predvidenih MVP funkcionalnosti je vsaj delno implementiranih. Od petih podrobneje pregledanih uporabniških zgodb štiri funkcionalno ustrezajo sprejemnim kriterijem, pri čemer ima US-02 manjše besedilno odstopanje. US-05 je delno izpolnjena zaradi manjkajočega preverjanja roka za prijavo.

Glavni proces aplikacije je implementiran, vendar bi bilo za popolno skladnost z zahtevami treba dopolniti predvsem časovne omejitve pri čakalnem seznamu, odpovedovanju prijav in evidentiranju prisotnosti ter nekatere administratorske funkcije.