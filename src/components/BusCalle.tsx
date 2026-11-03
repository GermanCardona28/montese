/**
 * Escena animada: un bus recorre la calle y pasa por paradas que laten.
 * Todo es SVG plano con los colores de la marca.
 */
export default function BusCalle({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <svg viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice" className="block h-full w-full">
        {/* edificios de fondo, bloques planos */}
        <rect x="40" y="60" width="90" height="110" fill="#2a2a2a" />
        <rect x="150" y="90" width="70" height="80" fill="#333" />
        <rect x="260" y="40" width="110" height="130" fill="#2a2a2a" />
        <rect x="400" y="100" width="80" height="70" fill="#333" />
        <rect x="520" y="70" width="100" height="100" fill="#2a2a2a" />
        <rect x="660" y="30" width="90" height="140" fill="#333" />
        <rect x="790" y="85" width="120" height="85" fill="#2a2a2a" />
        <rect x="950" y="55" width="80" height="115" fill="#333" />
        <rect x="1060" y="95" width="110" height="75" fill="#2a2a2a" />

        {/* paradas */}
        {[180, 560, 940].map((x, i) => (
          <g key={x}>
            <circle cx={x} cy="148" r="9" fill="#ffd500" className="parada-pulso" style={{ ["--d" as string]: `${i * 500}ms` }} />
            <rect x={x - 3} y="118" width="6" height="52" fill="#ffd500" />
            <rect x={x - 22} y="108" width="44" height="22" rx="6" fill="#ffd500" />
            <text x={x} y="124" textAnchor="middle" fontSize="13" fontWeight="700" fill="#111">
              BUS
            </text>
          </g>
        ))}

        {/* calle */}
        <rect y="170" width="1200" height="50" fill="#0f0f0f" />
        <g className="calle-marcas">
          {Array.from({ length: 16 }).map((_, i) => (
            <rect key={i} x={i * 96} y="192" width="48" height="6" rx="3" fill="#ffd500" />
          ))}
        </g>
      </svg>

      {/* bus */}
      <div className="bus-ruta absolute bottom-[3%] left-0 w-[34vw] min-w-[170px] max-w-[320px]">
        <svg viewBox="0 0 320 130" className="bus-body block w-full">
          <rect x="4" y="14" width="312" height="90" rx="22" fill="#ffd500" />
          <rect x="4" y="72" width="312" height="18" fill="#1f9d55" />
          <rect x="24" y="26" width="58" height="42" rx="8" fill="#1a2a30" />
          <rect x="92" y="26" width="58" height="42" rx="8" fill="#1a2a30" />
          <rect x="160" y="26" width="58" height="42" rx="8" fill="#1a2a30" />
          <rect x="228" y="26" width="72" height="56" rx="8" fill="#1a2a30" />
          <rect x="234" y="31" width="60" height="11" rx="4" fill="#fff" />
          <text x="264" y="40" textAnchor="middle" fontSize="9" fontWeight="800" fill="#111">
            MÓNTESE
          </text>
          <circle cx="306" cy="90" r="5" fill="#fff" />
          <g>
            <circle cx="70" cy="106" r="19" fill="#111" />
            <circle cx="70" cy="106" r="8" fill="#ffd500" className="rueda" />
            <rect x="68" y="98" width="4" height="16" fill="#111" className="rueda" />
          </g>
          <g>
            <circle cx="248" cy="106" r="19" fill="#111" />
            <circle cx="248" cy="106" r="8" fill="#ffd500" className="rueda" />
            <rect x="246" y="98" width="4" height="16" fill="#111" className="rueda" />
          </g>
        </svg>
      </div>
    </div>
  );
}
