import RutasLista from "@/components/RutasLista";

export const metadata = { title: "Rutas — Móntese" };

export default function Rutas() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-10 pt-8 md:px-6">
      <h1 className="display text-[clamp(4.5rem,22vw,9rem)]">
        <span className="mask"><span>Rutas</span></span>
      </h1>
      <p className="rise mb-6 mt-3 max-w-[38ch] text-xl" style={{ ["--d" as string]: "400ms" }}>
        Todas las rutas de bus del área metropolitana, con su horario, frecuencia y pasaje.
      </p>
      <RutasLista />
    </main>
  );
}
