/**
 * Escena animada (ciclo de 18 s): el bus avanza, frena en el semáforo cuando pasa a rojo,
 * y mientras espera cruzan la cebra un pato, una mujer y un hombre. Cuando vuelve el verde, el bus arranca.
 * Todo es SVG plano con los colores de la marca; las animaciones son CSS y comparten el mismo ciclo.
 */

const CICLO = 18; // segundos

// Línea de tiempo (en % del ciclo)
const T = { frena: 30, arranca: 72, amarillo: 28, rojo: 33 };

// Posiciones (unidades del viewBox 1200 × 260)
const X_PARADA = 335; // dónde queda el bus detenido
const X_FUERA = 1260;
const Y_ACERA_ATRAS = 168;
const Y_ACERA_FRENTE = 252;

/** Trayecto de un peatón (siempre visible): entra por la izquierda por la acera de atrás, cruza la cebra
 * cuando el bus ya está parado y sigue por la acera de adelante hasta salir; al repetir el ciclo entra de nuevo. */
function cruce(nombre: string, x: number, ini: number, fin: number) {
  const atras = (px: number) => `translate(${px}px,${Y_ACERA_ATRAS}px) scale(.82)`;
  const frente = (px: number) => `translate(${px}px,${Y_ACERA_FRENTE}px) scale(1.08)`;
  return `@keyframes ${nombre}{0%{transform:${atras(-60)}}${ini}%{transform:${atras(x)}}${fin}%{transform:${frente(x)}}97%{transform:${frente(X_FUERA)}}97.01%{transform:${atras(-60)}}100%{transform:${atras(-60)}}}`;
}

const PERSONAS = [
  { id: "pato", x: 632, ini: 38, fin: 56, pasos: 16, amp: 9 },
  { id: "mujer", x: 668, ini: 40, fin: 62, pasos: 14, amp: 22 },
  { id: "hombre", x: 704, ini: 44, fin: 66, pasos: 14, amp: 22 },
];

const css = `
.bc-bus{animation:bc-bus-x ${CICLO}s infinite;transform:translateX(${X_FUERA}px)}
@keyframes bc-bus-x{
  0%{transform:translateX(-260px);animation-timing-function:cubic-bezier(.2,.7,.3,1)}
  ${T.frena}%{transform:translateX(${X_PARADA}px)}
  ${T.arranca}%{transform:translateX(${X_PARADA}px);animation-timing-function:cubic-bezier(.6,0,.9,.4)}
  100%{transform:translateX(${X_FUERA}px)}
}
.bc-vibra{animation:bc-vibra .32s ease-in-out infinite alternate}
@keyframes bc-vibra{from{transform:translateY(0)}to{transform:translateY(-1.2px)}}
.bc-rueda{transform-box:fill-box;transform-origin:center;animation:bc-giro ${CICLO}s infinite}
@keyframes bc-giro{
  0%{transform:rotate(0deg);animation-timing-function:cubic-bezier(.2,.7,.3,1)}
  ${T.frena}%{transform:rotate(1000deg)}
  ${T.arranca}%{transform:rotate(1000deg);animation-timing-function:cubic-bezier(.6,0,.9,.4)}
  100%{transform:rotate(2800deg)}
}
.bc-luz-r{animation:bc-r ${CICLO}s step-end infinite}
.bc-luz-a{animation:bc-a ${CICLO}s step-end infinite}
.bc-luz-v{animation:bc-v ${CICLO}s step-end infinite}
@keyframes bc-r{0%{opacity:.18}${T.rojo}%{opacity:1}${T.arranca}%{opacity:.18}}
@keyframes bc-a{0%{opacity:.18}${T.amarillo}%{opacity:1}${T.rojo}%{opacity:.18}}
@keyframes bc-v{0%{opacity:1}${T.amarillo}%{opacity:.18}${T.arranca}%{opacity:1}}
.bc-parada{transform-box:fill-box;transform-origin:center;animation:bc-pulso 2s ease-out infinite}
@keyframes bc-pulso{0%{transform:scale(.6);opacity:.9}100%{transform:scale(2.2);opacity:0}}
.bc-pierna,.bc-brazo{transform-box:fill-box;transform-origin:50% 0%}
.bc-pato-cuerpo{transform-box:fill-box;transform-origin:50% 100%}
${PERSONAS.map(
  (p) => `
.bc-${p.id}{animation:bc-cruza-${p.id} ${CICLO}s infinite}
${cruce(`bc-cruza-${p.id}`, p.x, p.ini, p.fin)}
`
).join("")}
.bc-pierna.a,.bc-brazo.a{animation:bc-paso .55s ease-in-out infinite alternate}
.bc-pierna.b,.bc-brazo.b{animation:bc-paso .55s ease-in-out infinite alternate-reverse}
@keyframes bc-paso{from{transform:rotate(-22deg)}to{transform:rotate(22deg)}}
.bc-pato .bc-pato-cuerpo{animation:bc-pato-paso .4s ease-in-out infinite alternate}
@keyframes bc-pato-paso{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}
@media (prefers-reduced-motion:reduce){
  .bc-bus{animation:none;transform:translateX(${X_PARADA}px)}
  .bc-vibra,.bc-rueda,.bc-parada,.bc-pato .bc-pato-cuerpo,.bc-pierna,.bc-brazo{animation:none!important}
  .bc-luz-r{animation:none;opacity:1}.bc-luz-a,.bc-luz-v{animation:none;opacity:.18}
  .bc-pato{animation:none;transform:translate(632px,210px) scale(.95)}
  .bc-mujer{animation:none;transform:translate(668px,210px) scale(.95)}
  .bc-hombre{animation:none;transform:translate(704px,210px) scale(.95)}
}
`;

export default function BusCalle({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <style>{css}</style>
      <svg viewBox="0 0 1200 260" preserveAspectRatio="xMidYMax slice" className="block h-full w-full">
        {/* edificios de fondo */}
        {[
          [40, 90, 90, "#2a2a2a"],
          [150, 62, 70, "#333"],
          [260, 112, 110, "#2a2a2a"],
          [400, 52, 80, "#333"],
          [520, 82, 60, "#2a2a2a"],
          [760, 122, 90, "#333"],
          [880, 67, 120, "#2a2a2a"],
          [1020, 97, 80, "#333"],
          [1110, 57, 90, "#2a2a2a"],
        ].map(([x, h, w, f], i) => (
          <rect key={i} x={x as number} y={150 - (h as number)} width={w as number} height={h as number} fill={f as string} />
        ))}

        {/* aceras y calle */}
        <rect y="150" width="1200" height="22" fill="#2c2c2c" />
        <rect y="172" width="1200" height="66" fill="#0f0f0f" />
        <rect y="238" width="1200" height="22" fill="#2c2c2c" />
        {Array.from({ length: 13 }).map((_, i) => (
          <rect key={i} x={i * 96 + 10} y="203" width="48" height="5" rx="2.5" fill="#ffd500" />
        ))}

        {/* paradero de bus */}
        <g>
          <circle cx="215" cy="140" r="9" fill="#ffd500" className="bc-parada" />
          <rect x="212" y="112" width="6" height="40" fill="#ffd500" />
          <rect x="193" y="102" width="44" height="22" rx="6" fill="#ffd500" />
          <text x="215" y="118" textAnchor="middle" fontSize="13" fontWeight="800" fill="#111">
            BUS
          </text>
        </g>

        {/* cebra */}
        {Array.from({ length: 7 }).map((_, i) => (
          <rect key={i} x={598 + i * 18} y="172" width="11" height="66" rx="1" fill="#f1f1f1" />
        ))}

        {/* semáforo */}
        <rect x="586" y="108" width="6" height="46" fill="#555" />
        <rect x="574" y="46" width="30" height="66" rx="9" fill="#111" />
        <circle cx="589" cy="62" r="8" fill="#e5484d" className="bc-luz-r" />
        <circle cx="589" cy="80" r="8" fill="#ffd500" className="bc-luz-a" />
        <circle cx="589" cy="98" r="8" fill="#1f9d55" className="bc-luz-v" />

        {/* bus */}
        <g transform="translate(0 128)">
          <g className="bc-bus">
            <g className="bc-vibra">
              <g transform="scale(.75)">
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
                {[70, 248].map((cx) => (
                  <g key={cx}>
                    <circle cx={cx} cy="106" r="19" fill="#111" />
                    <g className="bc-rueda">
                      <circle cx={cx} cy="106" r="9" fill="#ffd500" />
                      <rect x={cx - 1.5} y="97" width="3" height="18" fill="#111" />
                    </g>
                  </g>
                ))}
              </g>
            </g>
          </g>
        </g>

        {/* pato */}
        <g className="bc-pato">
          <g className="bc-pato-cuerpo">
            <ellipse cx="0" cy="-10" rx="9" ry="7" fill="#ffd500" />
            <ellipse cx="-9" cy="-10" rx="2.6" ry="5" fill="#f2b705" />
            <ellipse cx="9" cy="-10" rx="2.6" ry="5" fill="#f2b705" />
            <circle cx="0" cy="-20" r="6" fill="#ffd500" />
            <ellipse cx="0" cy="-17.5" rx="4" ry="2.4" fill="#f08c00" />
            <circle cx="-2.6" cy="-21" r="1" fill="#111" />
            <circle cx="2.6" cy="-21" r="1" fill="#111" />
          </g>
          <ellipse cx="-3.4" cy="-1" rx="3.4" ry="1.5" fill="#f08c00" />
          <ellipse cx="3.4" cy="-1" rx="3.4" ry="1.5" fill="#f08c00" />
        </g>

        {/* mujer */}
        <g className="bc-mujer">
          <rect className="bc-pierna a" x="-5" y="-14" width="4" height="14" fill="#e0a97a" />
          <rect className="bc-pierna b" x="1" y="-14" width="4" height="14" fill="#e0a97a" />
          <rect className="bc-brazo b" x="-11" y="-33" width="3" height="13" rx="1.5" fill="#e0a97a" />
          <rect className="bc-brazo a" x="8" y="-33" width="3" height="13" rx="1.5" fill="#e0a97a" />
          <path d="M-9 -14 L-6 -35 L6 -35 L9 -14 Z" fill="#f06aa8" />
          <rect x="-7.4" y="-46" width="3.4" height="17" rx="1.7" fill="#2b1d16" />
          <rect x="4" y="-46" width="3.4" height="17" rx="1.7" fill="#2b1d16" />
          <circle cx="0" cy="-41" r="7" fill="#2b1d16" />
          <circle cx="0" cy="-39.5" r="5.6" fill="#e0a97a" />
        </g>

        {/* hombre */}
        <g className="bc-hombre">
          <rect className="bc-pierna a" x="-5.2" y="-16" width="4.4" height="16" fill="#2f3640" />
          <rect className="bc-pierna b" x="0.8" y="-16" width="4.4" height="16" fill="#2f3640" />
          <rect className="bc-brazo b" x="-11" y="-34" width="3.6" height="15" rx="1.8" fill="#1f9d55" />
          <rect className="bc-brazo a" x="7.4" y="-34" width="3.6" height="15" rx="1.8" fill="#1f9d55" />
          <rect x="-7" y="-35" width="14" height="20" rx="3" fill="#1f9d55" />
          <circle cx="0" cy="-41.5" r="6.6" fill="#c68d5e" />
          <path d="M-6.8 -42 A6.8 6.8 0 0 1 6.8 -42 L6.8 -44 A6.8 6.8 0 0 0 -6.8 -44 Z" fill="#2b1d16" />
          <rect x="-6.6" y="-48" width="13.2" height="5" rx="2.5" fill="#2b1d16" />
        </g>
      </svg>
    </div>
  );
}
