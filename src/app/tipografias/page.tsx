export const metadata = { title: "Tipografías — Móntese" };

const OPCIONES = [
  { nombre: "Plus Jakarta Sans", nota: "La que está activa ahora: moderna, clara y confiable.", titulo: "'Plus Jakarta Sans'", cuerpo: "'Plus Jakarta Sans'", peso: 800, familia: "Plus+Jakarta+Sans:wght@400;600;800" },
  { nombre: "Sora", nota: "Geométrica y tecnológica; transmite precisión.", titulo: "'Sora'", cuerpo: "'Sora'", peso: 700, familia: "Sora:wght@400;600;800" },
  { nombre: "Manrope", nota: "Neutra y muy legible en pantallas pequeñas.", titulo: "'Manrope'", cuerpo: "'Manrope'", peso: 800, familia: "Manrope:wght@400;600;800" },
  { nombre: "IBM Plex Sans", nota: "Institucional y seria; recuerda a entidades públicas.", titulo: "'IBM Plex Sans'", cuerpo: "'IBM Plex Sans'", peso: 700, familia: "IBM+Plex+Sans:wght@400;600;700" },
  { nombre: "Archivo", nota: "Grotesca firme y compacta, con carácter de señalización.", titulo: "'Archivo'", cuerpo: "'Archivo'", peso: 800, familia: "Archivo:wght@400;600;800" },
  { nombre: "Source Serif 4 + Manrope", nota: "Títulos con serifa para más autoridad, texto en Manrope.", titulo: "'Source Serif 4'", cuerpo: "'Manrope'", peso: 700, familia: "Source+Serif+4:wght@600;700&family=Manrope:wght@400;600" },
];

export default function Tipografias() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-12 pt-8 md:px-6">
      {OPCIONES.map((o) => (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link key={o.nombre} rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${o.familia}&display=swap`} />
      ))}
      <h1 className="heading text-[clamp(2rem,6vw,3rem)]">Tipografías para Móntese</h1>
      <p className="mt-2 max-w-[58ch] text-muted">
        Compara cómo se ven los títulos, el texto y una tarjeta de ruta. Dime cuál prefieres y la dejo en toda la app.
      </p>

      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {OPCIONES.map((o) => (
          <section key={o.nombre} className="rounded-[var(--r)] bg-surface p-6">
            <p className="text-sm font-semibold text-yellow">{o.nombre}</p>
            <h2 className="mt-3 text-[2.6rem] leading-[0.95] tracking-[-0.03em] text-white" style={{ fontFamily: `${o.titulo}, sans-serif`, fontWeight: o.peso }}>
              Móntese en el bus.
            </h2>
            <p className="mt-4 text-lg leading-snug" style={{ fontFamily: `${o.cuerpo}, sans-serif` }}>
              Qué bus tomar, cuánto tarda y cuánto cuesta en Bucaramanga, Floridablanca, Girón y Piedecuesta.
            </p>
            <div className="mt-5 flex items-center gap-3 rounded-[var(--r-sm)] bg-bg p-3" style={{ fontFamily: `${o.cuerpo}, sans-serif` }}>
              <span className="grid h-10 min-w-12 place-items-center rounded-[var(--r-sm)] bg-yellow px-2 text-xl text-[#111]" style={{ fontFamily: `${o.titulo}, sans-serif`, fontWeight: o.peso }}>31</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">Bahondo – Carrera 33</p>
                <p className="text-sm text-muted">Transportes Girón · cada 7 min</p>
              </div>
              <span className="text-right text-xl" style={{ fontFamily: `${o.titulo}, sans-serif`, fontWeight: o.peso }}>24 min</span>
            </div>
            <p className="mt-4 text-sm text-muted">{o.nota}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
