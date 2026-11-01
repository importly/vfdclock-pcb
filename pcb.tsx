// vfdclock ESP32-S3 VFD carrier, rev 0.2: a backpack the size of the Noritake GU256X128C-3900, on the
// VFD's own M3 holes. Every part sits on the top face, the outside of the stack, behind a clear back.
// Frame: mm, origin at the top-left corner, x right, y down; the top view is the VFD's rear view, the
// top edge is the VFD's I/O-hole edge. Shared geometry: lib/frame.ts. Nets and parts: pcb.sch.ts.
// Left: the devkit, soldered straight in, USB-C out of the left edge, antenna pointing into the board
// over a copper-free keep-out. Above it U1 (data bus); below it the SGP40 and the expansion header J8.
// Right: U2 (/WR), the SCD-41, and the power corner: J2 to the VFD, C1, the barrel jack, the LED.
import PCB from '@pcbjs/fab/JLCPCB/2-Layer'
import { keepout, pour, reference, route, stitch, via, type FootprintProps } from '@pcbjs/core'
import { MountingHole, circle } from '@pcbjs/lib'
import * as sch from './pcb.sch'
import {
  C1, C2, C3, C4, D1, D2, GND, J1, J2, J3, J4, J8, R1, R_RDY1, R_RDY2, RDY, VFD_WR,
  TP1, TP2, TP3, TP4, U1, U2, U3, U4, V5,
} from './pcb.sch'
import {
  ANTENNA_KEEPOUT, BOARD_H, BOARD_W, BREAKOUT_GAP, BREAKOUT_TAIL, C1_HEIGHT, CARRIER_HOLE_D, DEVKIT_GAP,
  DEVKIT_TAIL, HOLES, IDC_PITCH, J2_AT, NOTCH, ROW_J1_Y, ROW_J3_Y, STANDOFF_CLEAR_D, STANDOFF_LEN, THT_TAIL,
  VFD_THICKNESS, pinX,
} from './lib/frame'
import { DEVKIT_NET_OF } from './lib/pinout'
import { JACK_FRONT } from './lib/barrelJack'

// ---------------------------------------------------------------- outline: VFD size, CN4 notch open to the right edge
const N = NOTCH
const OUTLINE =
  `M 0 0 H ${BOARD_W} V ${N.y0} H ${N.x + N.r} A ${N.r} ${N.r} 0 0 0 ${N.x} ${N.y0 + N.r} ` +
  `V ${N.y1 - N.r} A ${N.r} ${N.r} 0 0 0 ${N.x + N.r} ${N.y1} H ${BOARD_W} V ${BOARD_H} H 0 Z`
const Hole = MountingHole(CARRIER_HOLE_D)

// ---------------------------------------------------------------- body heights above the carrier (mm)
const DIP_BODY_H = 5.3 // DIP-20 body plus standoff
const DISC_H = 8.0 // 5 mm disc cap standing on its leads
const RA_HEADER_H = 2.6 // right-angle header lying on its side

// ---------------------------------------------------------------- placement anchors
// U1 lies above the devkit's J1 row, pin 1 at the left of its lower (A) row: A1 = D7 at the left ...
// A8 = D0 at the right, under the devkit's GPIO4..7, so D3..D0 drop straight in. Its B row feeds the
// bus up into the top band and right to J2.
const U1_P1: [number, number] = [33.0, 18.0]
// U2, pin 1 at the right of its upper (A) row: A1 near the right end, VCC (pin 20) below pin 1.
const U2_P1: [number, number] = [99.0, 23.0]
// The breakouts' header rows, pin 1 (VIN) at the left; each board stands up from its header.
const U3_P1: [number, number] = [40.0, 62.96]
const U4_P1: [number, number] = [83.62, 62.96]
const HDR_Y = BOARD_H - 10.45 // right-angle header pad row: pins point at the edge and end 0.4 mm inside it
const J8_P1X = 27.78 // J8 pad 1 (3V3), pads run left
const J2_PIN1_Y = J2_AT[1] - 3.5 * IDC_PITCH
const j2y = (pin: number) => J2_PIN1_Y + Math.floor((pin - 1) / 2) * IDC_PITCH
const C1_C: [number, number] = [110.5, 43.5]
const SILK = 'F.SilkS'
const TOP = ['F.Cu'] as const
const BOTH = ['B.Cu', 'F.Cu'] as const

// Bit k of the bus: devkit J1 row pin carrying it; U1 channel 8-k (A/B), VFD CN4 pin 8-k.
const BUS_SOCKET_PIN = [4, 5, 6, 7, 12, 15, 16, 17] as const
// The V5 copper from the jack to J2 pins 15/16, C1 and C4: a solid zone, far wider than 2 mm.
const V5_ZONE = 'M 104.3 30.9 H 119.4 V 51.2 H 104.3 Z'
// /WR and RDY reach J2 on B.Cu and come up through these vias, between J2's GND stubs.
const WR_VIA = via(VFD_WR, `101.5 ${j2y(9) + IDC_PITCH / 2}`)
const RDY_VIA = via(RDY, `101.5 ${j2y(11) + IDC_PITCH / 2}`)
// The 3V3 run from the devkit's antenna end, round the antenna keep-out, to the sensors and J8.
const V33_X = 71.5
const V33_Y = 50.5

/** A body with no pads, centred on at: solder tails of top-side THT parts, below the carrier. */
function TailBody({ children, w, h, ...rest }: FootprintProps & { w: number; h: number }) {
  return (
    <footprint id="carrier:THT-tails" bom={false} pos={false} model={{ kind: 'ic', w, h, height: rest.height as number, color: '#9a9a9a' }} {...rest}>
      <rect layer="F.Fab" x={-w / 2} y={-h / 2} w={w} h={h} />
      {children}
    </footprint>
  )
}
const ROW_CX = (pinX(1) + pinX(22)) / 2
const ROW_LEN = pinX(1) - pinX(22) + 2
// [x, y, w, h, height]: header pins and leads below the carrier, checked against the VFD's rear parts.
const TAILS: [number, number, number, number, number][] = [
  [ROW_CX, ROW_J1_Y, ROW_LEN, 2, DEVKIT_TAIL],
  [ROW_CX, ROW_J3_Y, ROW_LEN, 2, DEVKIT_TAIL],
  [C1_C[0], C1_C[1], 7, 2, THT_TAIL],
  [U3_P1[0] + 5.08, U3_P1[1], 12.7, 2, BREAKOUT_TAIL],
  [U4_P1[0] + 5.08, U4_P1[1], 12.7, 2, BREAKOUT_TAIL],
]

// J8 labels, left to right in the top view (pad 8 at the left, pad 1 at the right).
const J8_LABELS = ['21', '18', '17', '16', '15', '14', 'G', '3V3']
const J8_X0 = J8_P1X - 7 * 2.54
const breakoutNets = (n: string) => (n === '3V3' ? 'VIN' : n)

export default (
  <PCB
    name="vfdclock-carrier"
    revision="0.2"
    schematic={sch}
    classes={{
      sig: { width: 0.25 },
      v33: { width: 0.5 },
      power: { width: 0.8 },
      gnd: { width: 0.6 },
    }}
  >
    <path layer="Edge.Cuts" d={OUTLINE} />
    {HOLES.map(([x, y], i) => <Hole ref={`H${i + 1}`} at={`${x} ${y}`} />)}

    {/* ---------------------------------------------------------------- the devkit and the bus */}
    {/* the devkit's two rows of plated holes; it is soldered straight in, USB end at the left edge */}
    <J3 at={`${pinX(1)} ${ROW_J1_Y} 270deg`} />
    <J4 at={`${pinX(1)} ${ROW_J3_Y} 270deg`} />
    <U1 at={`${U1_P1[0]} ${U1_P1[1]} 90deg`} height={DIP_BODY_H} />
    <C3 at={`${U1_P1[0] - 3.4} ${U1_P1[1] - 7.62} 270deg`} height={DISC_H} />
    <D2 at={`${pinX(21)} 17.5 90deg`} />
    <R_RDY1 at={`${pinX(1)} 18.2 270deg`} />
    <R_RDY2 at={`${pinX(1) + 2.7} 18.2 270deg`} />
    <TP3 at={`${pinX(1) + 5.9} 17.25`} />

    {/* ---------------------------------------------------------------- /WR buffer */}
    <U2 at={`${U2_P1[0]} ${U2_P1[1]} 270deg`} height={DIP_BODY_H} />
    <C4 at={`${U2_P1[0]} 33.6 180deg`} height={DISC_H} />
    <TP4 at="89.5 34.5" />

    {/* ---------------------------------------------------------------- sensors and expansion */}
    <U3 at={`${U3_P1[0]} ${U3_P1[1]} 90deg`} />
    <U4 at={`${U4_P1[0]} ${U4_P1[1]} 90deg`} />
    <J8 at={`${J8_P1X} ${HDR_Y} 270deg`} height={RA_HEADER_H} />

    {/* ---------------------------------------------------------------- power corner */}
    {/* VFD connector beside the notch, oriented as CN4: key slot -x, pin 1 at -y, odd pins -x */}
    <J2 at={`${J2_AT[0]} ${J2_AT[1]}`} thermal={{ 9: 'solid', 11: 'solid', 13: 'solid', 14: 'solid' }} />
    <C1 at={`${C1_C[0] - 2.5} ${C1_C[1]}`} height={C1_HEIGHT} />
    <C2 at="104.3 38.5 180deg" />
    {/* barrel jack, opening on the right edge */}
    <J1 at={`${BOARD_W + 0.3 - JACK_FRONT} 48.0`} thermal={{ 2: 'solid', 3: 'solid' }} />
    <R1 at="106.5 53.5 270deg" />
    <D1 at="110.5 54.5" />
    <TP1 at="106.5 58.0" />
    <TP2 at="110.5 58.0" />
    {TAILS.map(([x, y, w, h, height], i) => <TailBody ref={`X${i + 1}`} at={`${x} ${y}`} side="B" w={w} h={h} height={height} />)}

    {/* ---------------------------------------------------------------- power, drawn first */}
    {/* V5 to U1 and the devkit: from C1 up under J2 on B.Cu, along the top edge, down to U1 */}
    {route(C1[1]).layer('B.Cu').V(38.2).H(113.6).V(2.6).H(U1_P1[0]).Z(U1.pin('VCC')).width(0.8)}
    {route(U1.pin('VCC')).Z(C3[1]).width(0.8)}
    {route(U1.pin('VCC')).Z(U1.pin('DIR'))}
    {route(C3[1]).layer('F.Cu').H(pinX(21)).Z(D2.pin('A')).width(0.8)}
    {route(D2.pin('K')).Z(J3[21]).width(0.8)}
    {/* V5 to U2 from the zone */}
    {route(C4[1]).Z('105.5 33.6').width(0.8)}
    {route(C4[1]).Z(U2.pin('VCC'))}
    {route(U2.pin('VCC')).Z(U2.pin('DIR'))}
    {/* 3V3 from the devkit's antenna end: the RDY pull-up, then round the keep-out to the sensors and J8 */}
    {route(J3[1]).layer('B.Cu').Z(J3[2])}
    {route(J3[1]).Z(R_RDY1[2])}
    {route(J3[1]).H(V33_X).V(V33_Y).H(U4_P1[0]).Z(U4[1])}
    {route(U3[1]).V(V33_Y).Z(`${V33_X} ${V33_Y}`)}
    {route(J8[1]).X(U3[1]).layers([...BOTH])}

    {/* ---------------------------------------------------------------- data bus, F.Cu */}
    {BUS_SOCKET_PIN.map((pin, k) => route(J3[pin]).X(U1.pin(`A${8 - k}`)).layers([...TOP]))}
    {BUS_SOCKET_PIN.map((_, k) => route(U1.pin(`B${8 - k}`)).X(J2[8 - k]).layers([...BOTH]))}

    {/* /WR and RDY run right along B.Cu under the bus, and come up next to J2 */}
    {route(J3[18]).X(U2.pin('A1')).layers([...BOTH])}
    {route(U2.pin('B1')).X(WR_VIA).layers([...BOTH])}
    {WR_VIA}
    {route(WR_VIA).X(J2[10]).layers([...TOP])}
    {route(TP4[1]).X(U2.pin('B1')).layers([...TOP])}
    {route(J3[19]).X(R_RDY1[1]).layers([...BOTH])}
    {route(R_RDY1[1]).Z(R_RDY2[1])}
    {route(R_RDY2[1]).Z(TP3[1])}
    {route(TP3[1]).X(RDY_VIA).layers([...BOTH])}
    {RDY_VIA}
    {route(RDY_VIA).X(J2[12]).layers([...TOP])}

    {/* I2C: devkit GPIO1/2 down to the SGP40, on to the SCD-41 */}
    {route(J4[4]).X(U3[5]).layers([...BOTH])}
    {route(J4[5]).X(U3[4]).layers([...BOTH])}
    {route(U3[5]).X(U4[5]).layers([...BOTH])}
    {route(U3[4]).X(U4[4]).layers([...BOTH])}

    {/* expansion: GPIO14..18 cross under the devkit, GPIO21 drops from its J3 row */}
    {[20, 8, 9, 10, 11].map((pin, i) => route(J3[pin]).X(J8[3 + i]).layers([...BOTH]))}
    {route(J4[18]).X(J8[8]).layers([...BOTH])}
    {route(R1[2]).X(D1.A).layers([...TOP])}
    {route(R1[1]).Z('106.5 50.6')}
    {route(TP1[1]).X(R1[1]).layers([...TOP])}

    {/* J2's GND return: each odd GND pad gets a 0.8 mm stub to two vias, 13 and 14 are bridged */}
    {[9, 11, 13].map(p => [
      route(J2[p]).Z(`103.2 ${j2y(p)}`).width(0.8),
      via(GND, `103.2 ${j2y(p)}`),
      via(GND, `104.3 ${j2y(p)}`),
    ])}
    {route(J2[13]).Z(J2[14]).width(0.8)}
    {via(GND, `${J2_AT[0]} ${j2y(13) + IDC_PITCH / 2}`)}

    {/* ---------------------------------------------------------------- pours */}
    {pour(V5, 'F.Cu', V5_ZONE, { priority: 1, connect: 'solid' })}
    {pour(GND, 'F.Cu', `M 0 0 H ${BOARD_W} V ${BOARD_H} H 0 Z`)}
    {pour(GND, 'B.Cu', `M 0 0 H ${BOARD_W} V ${BOARD_H} H 0 Z`)}
    {stitch(GND, { pitch: 6, padClearance: 0.5 })}

    {/* keep-outs: antenna (no copper on either layer; no parts placed there), standoffs */}
    {keepout('all', `M ${ANTENNA_KEEPOUT.x0} ${ANTENNA_KEEPOUT.y0} H ${ANTENNA_KEEPOUT.x1} V ${ANTENNA_KEEPOUT.y1} H ${ANTENNA_KEEPOUT.x0} Z`)}
    {HOLES.map(([x, y]) => keepout('all', circle(STANDOFF_CLEAR_D, x, y)))}

    {/* the stack: devkit and breakouts above on their own header plastic, VFD 15 mm below on M3 standoffs */}
    {reference('./refs/devkit/pcb.tsx', {
      mate: [
        { local: J3, remote: 'J1', pin: 1, nets: (n: string) => DEVKIT_NET_OF[n] ?? n },
        { local: J4, remote: 'J3', pin: 1 },
      ],
      stack: 'above',
      gap: DEVKIT_GAP,
    })}
    {reference('./refs/sgp40/pcb.tsx', { mate: { local: U3, remote: 'J1', pin: 1, nets: breakoutNets }, stack: 'above', gap: BREAKOUT_GAP })}
    {reference('./refs/scd41/pcb.tsx', { mate: { local: U4, remote: 'J1', pin: 1, nets: breakoutNets }, stack: 'above', gap: BREAKOUT_GAP })}
    {reference('./refs/vfd/pcb.tsx', { at: [0, 0, -(STANDOFF_LEN + VFD_THICKNESS)] })}

    {/* ---------------------------------------------------------------- silk: polarity, pin 1 and pin names only */}
    <circle layer={SILK} cx={C1_C[0]} cy={C1_C[1]} r={5.15} />
    <path layer={SILK} d={`M ${C1_C[0] + 2.3} ${C1_C[1] - 3.98} A 4.6 4.6 0 0 1 ${C1_C[0] + 2.3} ${C1_C[1] + 3.98}`} width={0.6} />
    <text layer={SILK} at={`${C1_C[0] - 3.4} ${C1_C[1] - 2.6}`} size={1.4}>+</text>
    <path layer={SILK} d={`M ${J2_AT[0] - 4.585} ${J2_AT[1] - 9.9} V ${J2_AT[1] - 14.08} H ${J2_AT[0] + 4.585} V ${J2_AT[1] - 9.9}`} />
    <path layer={SILK} d={`M ${J2_AT[0] - 4.585} ${J2_AT[1] + 9.9} V ${J2_AT[1] + 14.08} H ${J2_AT[0] + 4.585} V ${J2_AT[1] + 9.9}`} />
    <path layer={SILK} d={`M 103.0 ${J2_PIN1_Y - 0.8} L 104.5 ${J2_PIN1_Y} L 103.0 ${J2_PIN1_Y + 0.8} Z`} fill />
    {J8_LABELS.map((l, i) => <text layer={SILK} at={`${J8_X0 + i * 2.54} ${HDR_Y - 2.2}`} size={0.7}>{l}</text>)}
    <text layer={SILK} at="106.5 60.0" size={0.8}>5V</text>
    <text layer={SILK} at="110.5 60.0" size={0.8}>GND</text>
    <text layer={SILK} at={`${pinX(1) + 5.9} 15.5`} size={0.8}>RDY</text>
    <text layer={SILK} at="89.5 36.4" size={0.8}>/WR</text>
    <text layer={SILK} at="124.5 41.9" size={0.9}>5V IN</text>
    <text layer={SILK} at="113.5 64.0" size={0.9}>vfdclock r0.2</text>
  </PCB>
)
