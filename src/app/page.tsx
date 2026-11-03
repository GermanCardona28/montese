import Link from "next/link";
import { Wordmark, LogoMark } from "@/components/Logo";
import BusCalle from "@/components/BusCalle";
import Planificador from "@/components/Planificador";
import Cifras from "@/components/Cifras";

const pasos = [
  {
    titulo: "Dile a dónde vas.",
    fondo: "bg-yellow text-[#111]",
    dibujo: (
      <svg viewBox="0 0 240 140" className="h-14 w-20 shrink-0 md:h-32 md:w-full" aria-hidden="true">
        <path d="M24 112C70 112 70 40 120 40s56 72 96 72" fill="none" stroke="#111" strokeWidth="7" strokeLinecap="round" pathLength="1" className="dibuja" />
        <circle cx="24" cy="112" r="16" fill="#1f9d55" />
        <text x="24" y="119" textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff">A</text>
        <circle cx="216" cy="112" r="16" fill="#1e6fd9" />
        <text x="216" y="119" textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff">B</text>
      </svg>
    ),
  },
  {
    titulo: "Mira cuánto tarda y cuánto cuesta.",
    fondo: "bg-blue text-white",
    dibujo: (
      <div className="flex shrink-0 items-center gap-3 md:h-32 md:gap-4">
        <span className="cartel !min-w-[3.4rem] !text-2xl md:!min-w-[5.5rem] md:!py-2 md:!text-[2.4rem]">28</span>
        <div className="hidden text-left md:block">
          <p className="display text-5xl">24 min</p>
          <p className="mt-1 text-lg font-medium">$3.600</p>
        </div>
      </div>
    ),
  },
  {
    titulo: "Suba y móntese.",
    fondo: "bg-green text-white",
    dibujo: (
      <div className="flex shrink-0 items-end md:h-32">
        <LogoMark size={56} className="md:h-[120px] md:w-[120px]" />
      </div>
    ),
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Primera pantalla: el titular y la acción */}
      <section className="px-5 pt-6 md:px-8 md:pt-10">
        <div className="mx-auto max-w-6xl">
          <div className="md:hidden">
            <Wordmark />
          </div>

          <h1 className="display mt-10 text-[17vw] md:mt-6 md:text-[min(12.5vw,190px)]">
            <span className="mask"><span style={{ ["--d" as string]: "0ms" }}>Móntese</span></span>
            <span className="mask md:text-right"><span style={{ ["--d" as string]: "110ms" }} className="text-yellow">en el bus</span></span>
          </h1>

          <p className="rise mt-6 max-w-[44ch] text-[1.3rem] leading-snug" style={{ ["--d" as string]: "700ms" }}>
            Qué bus tomar, cuánto tarda y cuánto cuesta en Bucaramanga, Floridablanca, Girón y Piedecuesta.
          </p>

          <div className="rise mx-auto mt-8 max-w-3xl md:mt-10" style={{ ["--d" as string]: "850ms" }}>
            <Planificador />
          </div>
        </div>
      </section>

      <BusCalle className="mt-12 h-[180px] md:h-[240px]" />

      {/* Cómo funciona: tres paneles de color a ras */}
      <section className="mt-2 grid gap-2 px-2 md:grid-cols-3" aria-label="Cómo funciona">
        {pasos.map((p) => (
          <div key={p.titulo} className={`flex items-center gap-4 rounded-[var(--r)] px-5 py-4 md:min-h-[300px] md:flex-col md:items-start md:justify-between md:p-7 ${p.fondo}`}>
            {p.dibujo}
            <h2 className="heading text-[1.25rem] md:mt-8 md:text-[2.3rem]">{p.titulo}</h2>
          </div>
        ))}
      </section>

      {/* Cifras reales */}
      <section className="mt-2 px-2">
        <h2 className="heading px-3 pb-4 pt-10 text-[clamp(1.6rem,4vw,3rem)] md:px-6 md:pt-14">Todo el transporte, en un solo lugar.</h2>
        <Cifras />
      </section>

      {/* Cierre invertido */}
      <section className="mt-2 flex min-h-[44svh] flex-col justify-between gap-8 rounded-[var(--r)] bg-yellow p-6 text-[#111] md:mx-2 md:min-h-[80svh] md:p-12">
        <h2 className="display text-[clamp(2.8rem,13vw,11rem)]">
          <span className="block">Ya sabe</span>
          <span className="block">cuál coger.</span>
        </h2>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <p className="max-w-[34ch] text-lg font-medium md:text-xl">Mire el mapa con todas las rutas o planee su próximo viaje.</p>
          <Link href="/mapa/" className="btn btn-dark md:min-w-64">
            Ver el mapa
          </Link>
        </div>
      </section>

      {/* Pie: la marca construida con bloques */}
      <footer className="px-2 pb-6 pt-2">
        <div className="flex h-[13svh] min-h-[84px] items-end gap-1 md:h-[34svh]" aria-label="Móntese">
          {[
            ["M", "var(--green)", "100%"],
            ["ó", "var(--blue)", "72%"],
            ["n", "var(--yellow)", "84%", "#111"],
            ["t", "var(--green)", "92%"],
            ["e", "var(--green)", "68%"],
            ["s", "var(--blue)", "80%"],
            ["e", "var(--yellow)", "96%", "#111"],
          ].map(([l, bg, h, ink], i) => (
            <div
              key={i}
              className="display grid flex-1 place-items-center rounded-[calc(var(--r)/2)] text-[clamp(1.6rem,11vw,9rem)]"
              style={{ background: bg, height: h, color: ink ?? "#fff" }}
              aria-hidden="true"
            >
              {l}
            </div>
          ))}
        </div>
        <p className="px-3 pt-6 text-sm text-muted">
          Datos de rutas y horarios: Área Metropolitana de Bucaramanga. Mapa © OpenStreetMap contributors. Los tiempos son
          estimaciones.
        </p>
      </footer>
    </main>
  );
}
