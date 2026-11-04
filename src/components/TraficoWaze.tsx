/**
 * Mapa de tráfico en vivo de Waze (iFrame oficial del Live Map), centrado en el área metropolitana de Bucaramanga.
 * Es solo para ver: Waze no expone los reportes como datos. Se muestra aparte de nuestro mapa de rutas.
 */
const LAT = 7.1193;
const LON = -73.1227;
const ZOOM = 13;

export default function TraficoWaze() {
  const src = `https://embed.waze.com/es/iframe?zoom=${ZOOM}&lat=${LAT}&lon=${LON}&ct=livemap`;
  return (
    <section className="rounded-[var(--r)] bg-surface p-5 md:p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="heading text-2xl">Tráfico en vivo</h2>
          <p className="mt-1 text-muted">Así está el tráfico ahora en Bucaramanga, según Waze.</p>
        </div>
        <a
          href={`https://waze.com/ul?ll=${LAT},${LON}&utm_source=montese`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-full bg-yellow px-4 py-2 text-sm font-bold text-black"
        >
          Abrir en Waze
        </a>
      </div>
      <iframe
        title="Mapa de tráfico en vivo de Waze en Bucaramanga"
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="mt-4 h-[360px] w-full rounded-2xl border-0 md:h-[440px]"
      />
    </section>
  );
}
