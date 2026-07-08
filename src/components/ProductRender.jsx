/**
 * ProductRender — SVG architectural renders for each block type
 * Isometric / elevation views styled like product catalog renders
 */

const renders = {

  /* ── Furniture ── */
  'FUR-001': ({ c }) => ( // Modern Najdi Sofa
    <svg viewBox="0 0 280 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="seat" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c[2]}/><stop offset="100%" stopColor={c[1]}/></linearGradient>
        <linearGradient id="back" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c[1]}/><stop offset="100%" stopColor={c[0]}/></linearGradient>
        <pattern id="boucle" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.2" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5"/></pattern>
      </defs>
      {/* Shadow */}
      <ellipse cx="140" cy="192" rx="110" ry="6" fill="rgba(0,0,0,0.12)"/>
      {/* Seat base */}
      <rect x="30" y="118" width="220" height="55" rx="10" fill="url(#seat)"/>
      <rect x="30" y="118" width="220" height="55" rx="10" fill="url(#boucle)"/>
      {/* Back rest */}
      <rect x="30" y="72" width="220" height="52" rx="10" fill="url(#back)"/>
      <rect x="30" y="72" width="220" height="52" rx="10" fill="url(#boucle)"/>
      {/* Left arm */}
      <rect x="18" y="88" width="22" height="75" rx="8" fill={c[0]}/>
      {/* Right arm */}
      <rect x="240" y="88" width="22" height="75" rx="8" fill={c[0]}/>
      {/* Legs */}
      {[48, 88, 178, 218].map((x, i) => <rect key={i} x={x} y="172" width="10" height="18" rx="3" fill={c[0]}/>)}
      {/* Cushions divider */}
      <line x1="140" y1="72" x2="140" y2="124" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5"/>
      {/* Accent pillow */}
      <rect x="105" y="80" width="32" height="34" rx="6" fill={c[3]}/>
    </svg>
  ),

  'FUR-002': ({ c }) => ( // Premium Majlis Set
    <svg viewBox="0 0 280 200" className="w-full h-full">
      <defs>
        <linearGradient id="majG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={c[1]}/><stop offset="100%" stopColor={c[0]}/></linearGradient>
        <pattern id="vlt" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0,4 L4,0 L8,4 L4,8 Z" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/></pattern>
      </defs>
      <ellipse cx="140" cy="194" rx="115" ry="5" fill="rgba(0,0,0,0.10)"/>
      {/* Back wall sofa — bottom */}
      <rect x="20" y="100" width="240" height="60" rx="8" fill="url(#majG)"/>
      <rect x="20" y="100" width="240" height="60" rx="8" fill="url(#vlt)"/>
      <rect x="20" y="78" width="240" height="28" rx="8" fill={c[0]}/>
      {/* Left side sofa */}
      <rect x="20" y="50" width="56" height="60" rx="8" fill="url(#majG)"/>
      <rect x="8" y="50" width="22" height="60" rx="8" fill={c[0]}/>
      {/* Right side sofa */}
      <rect x="204" y="50" width="56" height="60" rx="8" fill="url(#majG)"/>
      <rect x="250" y="50" width="22" height="60" rx="8" fill={c[0]}/>
      {/* Center table */}
      <ellipse cx="140" cy="152" rx="38" ry="14" fill={c[2]}/>
      <ellipse cx="140" cy="148" rx="38" ry="14" fill={c[3]}/>
      {/* Gold accent pillows */}
      {[55, 130, 200].map((x, i) => <rect key={i} x={x} y="84" width="22" height="26" rx="5" fill={c[2]}/>)}
    </svg>
  ),

  /* ── Lighting ── */
  'LGT-001': ({ c }) => ( // Arabesque Brass Pendant
    <svg viewBox="0 0 280 200" className="w-full h-full">
      <defs>
        <radialGradient id="glow" cx="50%" cy="60%" r="40%"><stop offset="0%" stopColor={c[2]} stopOpacity="0.6"/><stop offset="100%" stopColor="transparent"/></radialGradient>
        <radialGradient id="shadeG" cx="50%" cy="30%" r="60%"><stop offset="0%" stopColor={c[1]}/><stop offset="100%" stopColor={c[0]}/></radialGradient>
        <pattern id="arab" width="16" height="16" patternUnits="userSpaceOnUse">
          <polygon points="8,0 16,8 8,16 0,8" fill="none" stroke={c[2]} strokeWidth="0.8" opacity="0.5"/>
          <polygon points="8,4 12,8 8,12 4,8" fill="none" stroke={c[2]} strokeWidth="0.4" opacity="0.3"/>
        </pattern>
      </defs>
      {/* Glow */}
      <ellipse cx="140" cy="120" rx="70" ry="60" fill="url(#glow)"/>
      {/* Cord */}
      <rect x="137" y="10" width="6" height="50" rx="3" fill={c[0]}/>
      {/* Canopy */}
      <ellipse cx="140" cy="60" rx="20" ry="8" fill={c[0]}/>
      {/* Shade body */}
      <path d="M90,68 Q80,120 72,148 A90,22 0 0,0 208,148 Q200,120 190,68 Z" fill="url(#shadeG)"/>
      <path d="M90,68 Q80,120 72,148 A90,22 0 0,0 208,148 Q200,120 190,68 Z" fill="url(#arab)"/>
      {/* Top rim */}
      <ellipse cx="140" cy="68" rx="50" ry="14" fill={c[1]}/>
      {/* Bottom rim */}
      <ellipse cx="140" cy="148" rx="68" ry="18" fill={c[0]}/>
      <ellipse cx="140" cy="145" rx="68" ry="18" fill={c[1]}/>
      {/* Bulb glow */}
      <ellipse cx="140" cy="130" rx="12" ry="10" fill={c[2]} opacity="0.7"/>
      {/* Shadow on floor */}
      <ellipse cx="140" cy="195" rx="55" ry="5" fill="rgba(0,0,0,0.08)"/>
    </svg>
  ),

  'HOS-001': ({ c }) => ( // Grand Hotel Chandelier
    <svg viewBox="0 0 280 220" className="w-full h-full">
      <defs>
        <radialGradient id="cGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={c[1]} stopOpacity="0.5"/><stop offset="100%" stopColor="transparent"/></radialGradient>
      </defs>
      <ellipse cx="140" cy="110" rx="90" ry="80" fill="url(#cGlow)"/>
      {/* Main rod */}
      <rect x="137" y="5" width="6" height="40" rx="3" fill={c[0]}/>
      {/* Center body */}
      <ellipse cx="140" cy="55" rx="18" ry="12" fill={c[0]}/>
      <rect x="134" y="55" width="12" height="30" rx="4" fill={c[0]}/>
      {/* Tiers of arms */}
      {[
        { y: 68, arms: [[-70,0],[-45,10],[45,10],[70,0]], drops: 4, r: 6 },
        { y: 90, arms: [[-90,-5],[-60,5],[60,5],[90,-5]], drops: 5, r: 5 },
        { y: 108, arms: [[-105,-8],[-70,4],[70,4],[105,-8]], drops: 6, r: 4 },
      ].map((tier, ti) => (
        <g key={ti}>
          {tier.arms.map(([dx, dy], ai) => (
            <g key={ai}>
              <line x1="140" y1={tier.y} x2={140+dx} y2={tier.y+dy} stroke={c[0]} strokeWidth="2"/>
              {/* Crystal drops */}
              {Array.from({ length: tier.drops }).map((_, di) => (
                <ellipse key={di} cx={140+dx} cy={tier.y+dy+12+(di*8)} rx={tier.r-di*0.3} ry={tier.r-di*0.3+2} fill={c[2]} opacity={0.7-di*0.1}/>
              ))}
            </g>
          ))}
        </g>
      ))}
      {/* Bottom finial */}
      <ellipse cx="140" cy="160" rx="14" ry="22" fill={c[1]}/>
      <ellipse cx="140" cy="178" rx="8" ry="6" fill={c[0]}/>
    </svg>
  ),

  /* ── Decor ── */
  'DEC-001': ({ c }) => ( // Mashrabiya Screen
    <svg viewBox="0 0 280 200" className="w-full h-full">
      <defs>
        <pattern id="mash" width="28" height="28" patternUnits="userSpaceOnUse">
          <polygon points="14,0 28,14 14,28 0,14" fill="none" stroke={c[2]} strokeWidth="1.4"/>
          <polygon points="14,5 23,14 14,23 5,14" fill="none" stroke={c[2]} strokeWidth="0.7" opacity="0.5"/>
          <circle cx="14" cy="14" r="2.5" fill={c[2]} opacity="0.3"/>
        </pattern>
        <linearGradient id="screenG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={c[0]}/><stop offset="100%" stopColor={c[1]}/></linearGradient>
      </defs>
      {/* Panel shadow */}
      <rect x="48" y="22" width="190" height="165" rx="6" fill="rgba(0,0,0,0.18)" transform="translate(5,5)"/>
      {/* Panel background */}
      <rect x="48" y="22" width="190" height="165" rx="6" fill="url(#screenG)"/>
      {/* Mashrabiya pattern */}
      <rect x="48" y="22" width="190" height="165" rx="6" fill="url(#mash)"/>
      {/* Frame */}
      <rect x="48" y="22" width="190" height="165" rx="6" fill="none" stroke={c[2]} strokeWidth="3"/>
      {/* Light through effect */}
      <rect x="48" y="22" width="190" height="165" rx="6" fill="url(#mash)" opacity="0.4"/>
      {/* Bottom rail */}
      <rect x="40" y="183" width="206" height="10" rx="4" fill={c[0]}/>
      {/* Top rail */}
      <rect x="40" y="16" width="206" height="10" rx="4" fill={c[0]}/>
    </svg>
  ),

  /* ── Wall Finishes ── */
  'WAL-001': ({ c }) => ( // Travertine Wall Panel
    <svg viewBox="0 0 280 200" className="w-full h-full">
      <defs>
        <linearGradient id="tvG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={c[2]}/><stop offset="60%" stopColor={c[1]}/><stop offset="100%" stopColor={c[0]}/></linearGradient>
      </defs>
      {/* Stack of panels isometric */}
      {[0,1,2].map(row =>
        [0,1].map(col => {
          const x = 30 + col * 112, y = 20 + row * 60;
          return (
            <g key={`${row}-${col}`}>
              <rect x={x} y={y} width="108" height="56" rx="2" fill="url(#tvG)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
              {/* Travertine veining */}
              <path d={`M${x+10},${y+20} Q${x+40},${y+8} ${x+70},${y+28} Q${x+95},${y+40} ${x+108},${y+25}`} stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" fill="none"/>
              <path d={`M${x+5},${y+38} Q${x+35},${y+28} ${x+65},${y+44} Q${x+85},${y+52} ${x+108},${y+42}`} stroke="rgba(255,255,255,0.14)" strokeWidth="1" fill="none"/>
              {/* Pore holes */}
              {[20,45,70,90].map(px => <circle key={px} cx={x+px} cy={y+30} r="1.5" fill="rgba(0,0,0,0.08)"/>)}
              <rect x={x} y={y} width="108" height="56" rx="2" fill="none" stroke="rgba(200,180,150,0.3)" strokeWidth="1"/>
            </g>
          );
        })
      )}
    </svg>
  ),

  /* ── Doors ── */
  'DOR-001': ({ c }) => ( // Arched Pivot Entry Door
    <svg viewBox="0 0 280 220" className="w-full h-full">
      <defs>
        <linearGradient id="doorG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={c[1]}/><stop offset="50%" stopColor={c[2]}/><stop offset="100%" stopColor={c[0]}/></linearGradient>
        <pattern id="grain" width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="2" x2="4" y2="2.5" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5"/>
        </pattern>
      </defs>
      {/* Shadow */}
      <ellipse cx="140" cy="214" rx="80" ry="5" fill="rgba(0,0,0,0.12)"/>
      {/* Frame */}
      <rect x="52" y="18" width="176" height="196" rx="0" fill={c[0]}/>
      {/* Arched door panel */}
      <path d="M70,210 L70,90 Q70,22 140,22 Q210,22 210,90 L210,210 Z" fill="url(#doorG)"/>
      <path d="M70,210 L70,90 Q70,22 140,22 Q210,22 210,90 L210,210 Z" fill="url(#grain)"/>
      {/* Center panel recess */}
      <path d="M90,210 L90,110 Q90,50 140,50 Q190,50 190,110 L190,210 Z" fill={c[1]} opacity="0.4"/>
      {/* Door handle */}
      <circle cx="192" cy="148" r="5" fill={c[2]}/>
      <rect x="190" y="140" width="4" height="30" rx="2" fill={c[2]}/>
      {/* Vertical grain lines */}
      {[100, 120, 140, 160, 180].map((x, i) => (
        <line key={i} x1={x} y1="55" x2={x} y2="210" stroke="rgba(0,0,0,0.05)" strokeWidth="0.8"/>
      ))}
      {/* Frame edge highlight */}
      <path d="M70,210 L70,90 Q70,22 140,22 Q210,22 210,90 L210,210 Z" fill="none" stroke={c[2]} strokeWidth="2" opacity="0.4"/>
    </svg>
  ),

  /* ── Flooring ── */
  'FLR-001': ({ c }) => ( // Saudi Limestone Tile
    <svg viewBox="0 0 280 200" className="w-full h-full">
      <defs>
        <linearGradient id="tileG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={c[2]}/><stop offset="100%" stopColor={c[1]}/></linearGradient>
        <pattern id="tileP" width="56" height="56" patternUnits="userSpaceOnUse">
          <rect width="54" height="54" rx="1" fill="url(#tileG)" stroke={c[0]} strokeWidth="2"/>
          {/* Stone veining */}
          <path d="M8,28 Q22,18 40,32 Q50,38 54,28" stroke="rgba(0,0,0,0.06)" strokeWidth="1" fill="none"/>
          <path d="M5,40 Q18,34 32,42" stroke="rgba(0,0,0,0.04)" strokeWidth="0.7" fill="none"/>
        </pattern>
      </defs>
      {/* Perspective floor */}
      <g transform="translate(140,100) rotate(-15) scale(1,0.55) rotate(15) translate(-140,-100)">
        <rect x="10" y="10" width="260" height="180" fill="url(#tileP)"/>
      </g>
      {/* Highlight tile in front */}
      <rect x="88" y="118" width="104" height="68" rx="2" fill="url(#tileG)" stroke={c[0]} strokeWidth="2.5"/>
      <path d="M102,145 Q130,132 164,150 Q176,158 192,148" stroke="rgba(0,0,0,0.07)" strokeWidth="1.5" fill="none"/>
      {/* Gloss highlight */}
      <path d="M95,125 Q130,118 180,128" stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none"/>
    </svg>
  ),

  /* ── Kitchen ── */
  'KIT-001': ({ c }) => ( // Calacatta Marble Kitchen Island
    <svg viewBox="0 0 280 200" className="w-full h-full">
      <defs>
        <linearGradient id="marbG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FAFAF8"/><stop offset="100%" stopColor={c[0]}/></linearGradient>
        <linearGradient id="baseG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c[1]}/><stop offset="100%" stopColor="#111"/></linearGradient>
      </defs>
      {/* Shadow */}
      <ellipse cx="140" cy="196" rx="105" ry="5" fill="rgba(0,0,0,0.12)"/>
      {/* Cabinet base — left face */}
      <path d="M28,90 L28,172 L140,172 L140,90 Z" fill="url(#baseG)"/>
      {/* Cabinet base — right face */}
      <path d="M140,90 L140,172 L228,150 L228,68 Z" fill={c[1]}/>
      {/* Cabinet base — top of side */}
      <path d="M28,90 L140,90 L228,68 L116,68 Z" fill="#2A2A2A"/>
      {/* Marble top */}
      <path d="M14,68 L14,82 L140,82 L252,58 L252,44 L126,44 Z" fill="url(#marbG)"/>
      {/* Marble veining */}
      <path d="M40,60 Q90,48 150,70 Q190,80 240,55" stroke="rgba(180,160,140,0.6)" strokeWidth="1.5" fill="none"/>
      <path d="M30,72 Q80,62 120,76 Q160,88 200,68" stroke="rgba(180,160,140,0.4)" strokeWidth="1" fill="none"/>
      {/* Marble top edge */}
      <path d="M14,82 L126,58 L252,58 L252,44 L126,44 L14,68 Z" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
      {/* Sink */}
      <ellipse cx="82" cy="74" rx="26" ry="8" fill="rgba(0,0,0,0.15)"/>
      {/* Faucet */}
      <rect x="100" y="58" width="3" height="18" rx="1.5" fill="#999"/>
      <path d="M103,64 Q112,60 112,70" stroke="#999" strokeWidth="2.5" fill="none"/>
      {/* Cabinet handles */}
      {[52, 84, 116].map((x, i) => <line key={i} x1={x} y1="130" x2={x} y2="145" stroke="rgba(201,168,76,0.7)" strokeWidth="2"/>)}
      {[160, 186, 210].map((x, i) => {
        const y = 108 - i*3;
        return <line key={i} x1={x} y1={y} x2={x} y2={y+12} stroke="rgba(201,168,76,0.7)" strokeWidth="1.5"/>;
      })}
    </svg>
  ),

  /* ── Bathroom ── */
  'BTH-001': ({ c }) => ( // Freestanding Marble Bathtub
    <svg viewBox="0 0 280 200" className="w-full h-full">
      <defs>
        <linearGradient id="tubG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FAFAF8"/><stop offset="100%" stopColor={c[0]}/></linearGradient>
        <radialGradient id="inner" cx="50%" cy="40%" r="50%"><stop offset="0%" stopColor="rgba(200,220,240,0.4)"/><stop offset="100%" stopColor="rgba(180,200,220,0.1)"/></radialGradient>
      </defs>
      {/* Shadow */}
      <ellipse cx="140" cy="192" rx="100" ry="6" fill="rgba(0,0,0,0.10)"/>
      {/* Tub body outer */}
      <path d="M32,150 Q30,80 140,72 Q250,80 248,150 Q246,185 140,188 Q34,185 32,150 Z" fill="url(#tubG)"/>
      {/* Marble veining */}
      <path d="M60,130 Q100,110 160,135 Q200,148 240,125" stroke="rgba(180,160,140,0.35)" strokeWidth="1.5" fill="none"/>
      <path d="M50,155 Q90,140 150,158 Q190,168 240,150" stroke="rgba(180,160,140,0.25)" strokeWidth="1" fill="none"/>
      {/* Inner bath */}
      <path d="M55,148 Q55,100 140,94 Q225,100 225,148 Q224,175 140,178 Q56,175 55,148 Z" fill="url(#inner)"/>
      {/* Water surface */}
      <path d="M62,142 Q100,132 140,134 Q180,132 218,142 Q218,148 140,150 Q62,148 62,142 Z" fill="rgba(160,200,220,0.35)"/>
      {/* Gold faucet */}
      <path d="M118,92 L118,102 L140,102 L162,102 L162,92" stroke={c[2]} strokeWidth="3" fill="none" strokeLinecap="round"/>
      <rect x="136" y="82" width="8" height="22" rx="3" fill={c[2]}/>
      {/* Drain */}
      <circle cx="140" cy="172" r="5" fill="rgba(0,0,0,0.15)"/>
      {/* Highlight */}
      <path d="M70,120 Q110,105 160,118" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" fill="none"/>
    </svg>
  ),

  /* ── Office ── */
  'OFF-001': ({ c }) => ( // Riyadh Executive Desk
    <svg viewBox="0 0 280 200" className="w-full h-full">
      <defs>
        <linearGradient id="topG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={c[1]}/><stop offset="100%" stopColor={c[0]}/></linearGradient>
        <linearGradient id="sideG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c[1]}/><stop offset="100%" stopColor={c[0]}/></linearGradient>
      </defs>
      <ellipse cx="140" cy="196" rx="110" ry="5" fill="rgba(0,0,0,0.10)"/>
      {/* Desk top surface */}
      <path d="M18,78 L18,92 L210,92 L262,62 L262,48 L70,48 Z" fill={c[2]}/>
      {/* Travertine inlay strip */}
      <path d="M70,52 L210,52 L210,88 L70,88 Z" fill={c[1]} opacity="0.5"/>
      <path d="M90,65 Q130,55 180,70 Q210,78 240,65" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none"/>
      {/* Desk front face */}
      <path d="M18,92 L18,168 L84,168 L84,92 Z" fill="url(#sideG)"/>
      {/* Desk drawer column */}
      <path d="M84,92 L84,168 L148,168 L148,92 Z" fill={c[0]}/>
      {/* Desk side face */}
      <path d="M148,92 L148,168 L210,168 L210,92 Z" fill="url(#sideG)"/>
      {/* Right return */}
      <path d="M210,92 L210,168 L262,148 L262,62 Z" fill={c[1]}/>
      {/* Drawer pulls */}
      {[115, 135, 155].map(y => <line key={y} x1="120" y1={y} x2="135" y2={y} stroke={c[2]} strokeWidth="2" strokeLinecap="round"/>)}
      {/* Brass legs */}
      {[[26,168],[72,168],[162,168],[202,168]].map(([x,y],i) => <rect key={i} x={x} y={y} width="8" height="22" rx="2" fill={c[2]}/>)}
      {/* Monitor placeholder */}
      <rect x="220" y="32" width="36" height="28" rx="3" fill="rgba(0,0,0,0.3)"/>
      <rect x="234" y="60" width="8" height="8" rx="1" fill="rgba(0,0,0,0.3)"/>
    </svg>
  ),

  /* ── Outdoor ── */
  'OUT-001': ({ c }) => ( // Cedar Pergola
    <svg viewBox="0 0 280 200" className="w-full h-full">
      <defs>
        <linearGradient id="beamG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c[2]}/><stop offset="100%" stopColor={c[0]}/></linearGradient>
        <pattern id="woodG" width="8" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="2" x2="8" y2="2.3" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <ellipse cx="140" cy="196" rx="115" ry="5" fill="rgba(0,0,0,0.08)"/>
      {/* Posts */}
      {[30, 222].map((x, i) => (
        <g key={i}>
          <rect x={x} y="72" width="16" height="118" rx="3" fill="url(#beamG)"/>
          <rect x={x} y="72" width="16" height="118" rx="3" fill="url(#woodG)"/>
        </g>
      ))}
      {/* Cross beams */}
      <rect x="22" y="60" width="236" height="18" rx="3" fill="url(#beamG)"/>
      <rect x="22" y="60" width="236" height="18" rx="3" fill="url(#woodG)"/>
      {/* Rafters */}
      {[50, 82, 114, 146, 178, 210].map((x, i) => (
        <rect key={i} x={x} y="32" width="10" height="80" rx="2" fill={c[1]}/>
      ))}
      {/* Top cross beam */}
      <rect x="18" y="28" width="244" height="14" rx="3" fill="url(#beamG)"/>
      {/* Louvre lines */}
      {[35, 52, 69, 86, 103, 120, 137, 154, 171, 188, 205, 222, 239, 256].map((x, i) => (
        <line key={i} x1={x} y1="28" x2={x-3} y2="78" stroke="rgba(0,0,0,0.12)" strokeWidth="0.5"/>
      ))}
      {/* Column bases */}
      {[26, 218].map((x, i) => <rect key={i} x={x} y="184" width="24" height="12" rx="3" fill={c[0]}/>)}
      {/* Shadow under posts */}
      <ellipse cx="38" cy="193" rx="18" ry="4" fill="rgba(0,0,0,0.08)"/>
      <ellipse cx="230" cy="193" rx="18" ry="4" fill="rgba(0,0,0,0.08)"/>
    </svg>
  ),
};

// ─── Fallback by category ─────────────────────────────────────────────────────
const categoryFallback = {
  furniture:     ({ c }) => <text x="140" y="110" textAnchor="middle" fontSize="80" dominantBaseline="middle">🛋️</text>,
  lighting:      ({ c }) => <text x="140" y="110" textAnchor="middle" fontSize="80" dominantBaseline="middle">💡</text>,
  decor:         ({ c }) => <text x="140" y="110" textAnchor="middle" fontSize="80" dominantBaseline="middle">🎨</text>,
  doors:         ({ c }) => <text x="140" y="110" textAnchor="middle" fontSize="80" dominantBaseline="middle">🚪</text>,
  'wall-finishes': ({ c }) => <text x="140" y="110" textAnchor="middle" fontSize="80" dominantBaseline="middle">🧱</text>,
  flooring:      ({ c }) => <text x="140" y="110" textAnchor="middle" fontSize="80" dominantBaseline="middle">⬛</text>,
  kitchen:       ({ c }) => <text x="140" y="110" textAnchor="middle" fontSize="80" dominantBaseline="middle">🍳</text>,
  bathroom:      ({ c }) => <text x="140" y="110" textAnchor="middle" fontSize="80" dominantBaseline="middle">🛁</text>,
  outdoor:       ({ c }) => <text x="140" y="110" textAnchor="middle" fontSize="80" dominantBaseline="middle">🌿</text>,
  office:        ({ c }) => <text x="140" y="110" textAnchor="middle" fontSize="80" dominantBaseline="middle">💼</text>,
  hospitality:   ({ c }) => <text x="140" y="110" textAnchor="middle" fontSize="80" dominantBaseline="middle">🏨</text>,
};

export default function ProductRender({ block }) {
  const Render = renders[block.id] || categoryFallback[block.category];
  if (!Render) return null;
  return (
    <svg viewBox="0 0 280 200" className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <Render c={block.colors} />
    </svg>
  );
}
