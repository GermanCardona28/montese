/**
 * Escena animada (ciclo de 20 s). La cámara sigue al bus: el bus queda fijo y el mundo (edificios, línea de
 * la carretera) se desplaza hacia atrás. A los 5 s aparece el semáforo en rojo con el pato, la mujer y el
 * hombre esperando en la acera; cuando se enciende la luz peatonal cruzan y se quedan quietos al otro lado.
 * Luego el semáforo se pone en verde, el bus arranca, sale de la escena y el ciclo vuelve a empezar.
 * Todo es SVG plano con los colores de la marca; las animaciones son CSS y comparten el mismo ciclo.
 */

const CICLO = 20; // segundos

// Línea de tiempo (en % del ciclo)
// amarillo: 0 → el semáforo ya está en amarillo cuando el bus se le acerca; camIni = rojo + 1 s (la luz peatonal tarda 1 s)
const T = { frena: 25, arranca: 60, acelera: 70, amarillo: 0, rojo: 21, verde: 56, camIni: 26, camFin: 50 };

// Distancias de desplazamiento del mundo (unidades del viewBox 1200 × 260)
const S_PARADA = 500; // lo que recorre el mundo hasta que el bus se detiene
const S_ARRANQUE = 700; // al terminar de acelerar
const S_TOTAL = 2500; // = 2 mosaicos de edificios, para que el ciclo cierre sin saltos
const MOSAICO = 1250; // ancho del mosaico de edificios (periodo del fondo)
const PERIODO_LINEA = 125; // periodo de las rayas de la carretera (divide a MOSAICO)
const X_BUS = 480;
const X_SEMAFORO = 1250; // posición del semáforo en el mundo: queda en pantalla en 1250 - S_PARADA = 750
const GRADOS_PX = 4; // grados de giro de rueda por unidad recorrida
const Y_ACERA_ATRAS = 168;
const Y_ACERA_FRENTE = 252;

/** Balanceo de piernas/brazos o del pato: oscila solo mientras cruzan (entre `ini` y `fin`, % del ciclo). */
function marcha(nombre: string, ini: number, fin: number, amp: number) {
  const pasos = Math.max(2, Math.round((((fin - ini) / 100) * CICLO) / 0.3));
  let k = `@keyframes ${nombre}{0%{transform:rotate(0deg)}`;
  for (let i = 0; i <= pasos; i++) {
    const p = (ini + ((fin - ini) * i) / pasos).toFixed(2);
    k += `${p}%{transform:rotate(${i % 2 === 0 ? amp : -amp}deg)}`;
  }
  k += `${(fin + 0.6).toFixed(2)}%{transform:rotate(0deg)}100%{transform:rotate(0deg)}}`;
  return k;
}

/** Espera en la acera de atrás, cruza entre `ini` y `fin` y se queda quieto en la acera de adelante. */
function cruce(nombre: string, ini: number, fin: number) {
  return `@keyframes ${nombre}{0%,${ini}%{transform:translate(0px,${Y_ACERA_ATRAS}px) scale(.82)}${fin}%,100%{transform:translate(0px,${Y_ACERA_FRENTE}px) scale(1.08)}}`;
}

const PERSONAS = [
  { id: "pato", ini: T.camIni, fin: T.camIni + 17, amp: 9 },
  { id: "mujer", ini: T.camIni + 1, fin: T.camIni + 19, amp: 22 },
  { id: "hombre", ini: T.camIni + 2, fin: T.camIni + 21, amp: 22 },
];

const css = `
.bc-mundo{animation:bc-mundo ${CICLO}s infinite}
@keyframes bc-mundo{
  0%{transform:translateX(0);animation-timing-function:cubic-bezier(.215,.61,.355,1)}
  ${T.frena}%{transform:translateX(-${S_PARADA}px)}
  ${T.arranca}%{transform:translateX(-${S_PARADA}px);animation-timing-function:cubic-bezier(.55,.055,.675,.19)}
  ${T.acelera}%{transform:translateX(-${S_ARRANQUE}px);animation-timing-function:linear}
  100%{transform:translateX(-${S_TOTAL}px)}
}
.bc-vibra{animation:bc-vibra .32s ease-in-out infinite alternate}
@keyframes bc-vibra{from{transform:translateY(0)}to{transform:translateY(-1.2px)}}
.bc-rueda{transform-box:fill-box;transform-origin:center;animation:bc-giro ${CICLO}s infinite}
@keyframes bc-giro{
  0%{transform:rotate(0deg);animation-timing-function:cubic-bezier(.215,.61,.355,1)}
  ${T.frena}%{transform:rotate(${S_PARADA * GRADOS_PX}deg)}
  ${T.arranca}%{transform:rotate(${S_PARADA * GRADOS_PX}deg);animation-timing-function:cubic-bezier(.55,.055,.675,.19)}
  ${T.acelera}%{transform:rotate(${S_ARRANQUE * GRADOS_PX}deg);animation-timing-function:linear}
  100%{transform:rotate(${S_TOTAL * GRADOS_PX}deg)}
}
.bc-luz-r{animation:bc-r ${CICLO}s step-end infinite}
.bc-luz-a{animation:bc-a ${CICLO}s step-end infinite}
.bc-luz-v{animation:bc-v ${CICLO}s step-end infinite}
@keyframes bc-r{0%{opacity:.18}${T.rojo}%{opacity:1}${T.verde}%{opacity:.18}}
.bc-mundo2{animation:bc-mundo ${CICLO}s infinite}
@keyframes bc-a{0%{opacity:1}${T.rojo}%{opacity:.18}}
@keyframes bc-v{0%{opacity:.18}${T.verde}%{opacity:1}}
.bc-pe-r{animation:bc-per ${CICLO}s step-end infinite}
.bc-pe-v{animation:bc-pev ${CICLO}s step-end infinite}
@keyframes bc-per{0%{opacity:1}${T.camIni}%{opacity:.18}${T.camFin}%{opacity:1}}
@keyframes bc-pev{0%{opacity:.18}${T.camIni}%{opacity:1}${T.camFin}%{opacity:.18}}
.bc-parada{transform-box:fill-box;transform-origin:center;animation:bc-pulso 2s ease-out infinite}
@keyframes bc-pulso{0%{transform:scale(.6);opacity:.9}100%{transform:scale(2.2);opacity:0}}
.bc-pierna,.bc-brazo{transform-box:fill-box;transform-origin:50% 0%}
.bc-pato-cuerpo{transform-box:fill-box;transform-origin:50% 100%}
${PERSONAS.map(
  (p) => `
.bc-${p.id}{animation:bc-cruza-${p.id} ${CICLO}s linear infinite}
${cruce(`bc-cruza-${p.id}`, p.ini, p.fin)}
${marcha(`bc-m-${p.id}-a`, p.ini, p.fin, p.amp)}
${marcha(`bc-m-${p.id}-b`, p.ini, p.fin, -p.amp)}
.bc-${p.id} .a{animation:bc-m-${p.id}-a ${CICLO}s infinite}
.bc-${p.id} .b{animation:bc-m-${p.id}-b ${CICLO}s infinite}`
).join("")}
.bc-pato .bc-pato-cuerpo{animation:bc-m-pato-a ${CICLO}s infinite}
@media (prefers-reduced-motion:reduce){
  .bc-mundo,.bc-mundo2{animation:none;transform:translateX(-${S_PARADA}px)}
  .bc-vibra,.bc-rueda,.bc-parada,.bc-pato .bc-pato-cuerpo,.bc-pierna,.bc-brazo{animation:none!important}
  .bc-luz-r{animation:none;opacity:1}.bc-luz-a,.bc-luz-v{animation:none;opacity:.18}
  .bc-pe-r{animation:none;opacity:1}.bc-pe-v{animation:none;opacity:.18}
  .bc-pato,.bc-mujer,.bc-hombre{animation:none;transform:translate(0px,${Y_ACERA_ATRAS}px) scale(.82)}
}
`;

const EDIFICIOS = [
  [40, 90, 90, "#2a2a2a"],
  [150, 62, 70, "#333"],
  [260, 112, 110, "#2a2a2a"],
  [400, 52, 80, "#333"],
  [520, 82, 60, "#2a2a2a"],
  [660, 100, 70, "#333"],
  [760, 122, 90, "#2a2a2a"],
  [880, 67, 120, "#333"],
  [1020, 97, 80, "#2a2a2a"],
  [1110, 57, 90, "#333"],
];

export default function BusCalle({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <style>{css}</style>
      <svg viewBox="0 0 1200 260" preserveAspectRatio="xMidYMax slice" className="block h-full w-full">
        {/* mundo: se desplaza hacia atrás mientras el bus (fijo) avanza */}
        <g className="bc-mundo">
          {/* edificios y paraderos: mosaico que se repite */}
          {[0, 1, 2].map((k) => (
            <g key={k} transform={`translate(${k * MOSAICO} 0)`}>
              {EDIFICIOS.map(([x, h, w, f], i) => (
                <rect key={i} x={x as number} y={150 - (h as number)} width={w as number} height={h as number} fill={f as string} />
              ))}
              <circle cx="215" cy="140" r="9" fill="#ffd500" className="bc-parada" />
              <rect x="212" y="112" width="6" height="40" fill="#ffd500" />
              <rect x="193" y="102" width="44" height="22" rx="6" fill="#ffd500" />
              <text x="215" y="118" textAnchor="middle" fontSize="13" fontWeight="800" fill="#111">
                BUS
              </text>
            </g>
          ))}

          {/* aceras y calle */}
          <rect y="150" width="3900" height="22" fill="#2c2c2c" />
          <rect y="172" width="3900" height="66" fill="#0f0f0f" />
          <rect y="238" width="3900" height="22" fill="#2c2c2c" />
          {Array.from({ length: 32 }).map((_, i) => (
            <rect key={i} x={i * PERIODO_LINEA + 10} y="203" width="55" height="5" rx="2.5" fill="#ffd500" />
          ))}

          {/* cruce: semáforo, cebra y peatones (el origen local es el poste del semáforo) */}
          <g transform={`translate(${X_SEMAFORO} 0)`}>
            {Array.from({ length: 7 }).map((_, i) => (
              <rect key={i} x={10 + i * 18} y="172" width="11" height="66" rx="1" fill="#f1f1f1" />
            ))}

            <rect x="-3" y="108" width="6" height="46" fill="#555" />
            <rect x="-15" y="46" width="30" height="66" rx="9" fill="#111" />
            <circle cx="0" cy="62" r="8" fill="#e5484d" className="bc-luz-r" />
            <circle cx="0" cy="80" r="8" fill="#ffd500" className="bc-luz-a" />
            <circle cx="0" cy="98" r="8" fill="#1f9d55" className="bc-luz-v" />
            {/* luz peatonal */}
            <rect x="-7" y="118" width="14" height="24" rx="4" fill="#111" />
            <circle cx="0" cy="125" r="3.6" fill="#e5484d" className="bc-pe-r" />
            <circle cx="0" cy="135" r="3.6" fill="#1f9d55" className="bc-pe-v" />

          </g>
        </g>

        {/* bus: fijo en pantalla (la cámara lo sigue) */}
        <g transform={`translate(${X_BUS} 128)`}>
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
        {/* peatones: van por encima del bus, en el mismo mundo que se desplaza */}
        <g className="bc-mundo2">
          <g transform={`translate(${X_SEMAFORO} 0)`}>
            {/* pato */}
            <g transform="translate(30 0)">
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
            </g>

            {/* mujer */}
            <g transform="translate(66 0)">
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
            </g>

            {/* hombre */}
            <g transform="translate(102 0)">
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
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
