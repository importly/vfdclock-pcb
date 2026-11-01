// vfdclock ESP32-S3 VFD carrier, rev 0.3 (WROOM): a backpack the size of the Noritake GU256X128C-3900,
// on the VFD's own M3 holes, with a bare ESP32-S3-WROOM-1 module instead of the devkit. Every part sits
// on the top face, the outside of the stack, behind a clear back.
// Frame: mm, origin at the top-left corner, x right, y down; the top view is the VFD's rear view, the
// top edge is the VFD's I/O-hole edge. Shared geometry: lib/frame.ts. Nets and parts: pcb.sch.ts.
// Top middle: the module, antenna up over a notch in the top edge. Right: U1 and U2 beside J2 and
// the power corner. Left: the 3.3 V regulator and buttons along the top, the expansion header J8 and
// the two sensor breakouts down the left side, USB-C low on the left edge.
import PCB from '@pcbjs/fab/JLCPCB/2-Layer'
import { keepout, pour, reference, route, stitch, via, type FootprintProps } from '@pcbjs/core'
import { MountingHole, circle } from '@pcbjs/lib'
import * as sch from './pcb.sch'
import {
  C1, C2, C3, C4, C5, C6, C7, C8, C9, D1, D2, D3, GND, J1, J2, J5, J8, R1, R5, R6, R7, R8, R_RDY1, R_RDY2,
  RDY, SW1, SW2, TP1, TP2, TP3, TP4, TP5, TP6, TP7, U1, U2, U3, U4, U5, U6, U7, V5, VFD_WR,
} from './pcb.sch'
import {
  ANT_NOTCH, BOARD_H, BOARD_W, BREAKOUT_GAP, BREAKOUT_TAIL, C1_HEIGHT, CARRIER_HOLE_D, HOLES, IDC_PITCH, J2_AT,
  NOTCH, STANDOFF_CLEAR_D, STANDOFF_LEN, THT_TAIL, VFD_THICKNESS, WROOM_AT,
} from './lib/frame'
import { GPIO, WROOM_PADS } from './lib/pinout'
import { JACK_FRONT } from './lib/barrelJack'

// ---------------------------------------------------------------- outline: VFD size, antenna notch at the top, CN4 notch at the right
const N = NOTCH
const A = ANT_NOTCH
const OUTLINE =
  `M 0 0 H ${A.x0} V ${A.depth - A.r} A ${A.r} ${A.r} 0 0 0 ${A.x0 + A.r} ${A.depth} ` +
  `H ${A.x1 - A.r} A ${A.r} ${A.r} 0 0 0 ${A.x1} ${A.depth - A.r} V 0 ` +
  `H ${BOARD_W} V ${N.y0} H ${N.x + N.r} A ${N.r} ${N.r} 0 0 0 ${N.x} ${N.y0 + N.r} ` +
  `V ${N.y1 - N.r} A ${N.r} ${N.r} 0 0 0 ${N.x + N.r} ${N.y1} H ${BOARD_W} V ${BOARD_H} H 0 Z`
const Hole = MountingHole(CARRIER_HOLE_D)

// ---------------------------------------------------------------- body heights above the carrier (mm)
const DIP_BODY_H = 5.3 // DIP-20 body plus standoff
const DISC_H = 8.0 // 5 mm radial cap standing on its leads
const RA_HEADER_H = 2.6 // right-angle header lying on its side

// ---------------------------------------------------------------- placement anchors
// U1 and U2 stand beside J2, pin 1 at the top: A column (inputs) on the left, B column (outputs)
// facing J2. U1's A column takes the bus top-down D7..D0; U2's A1 takes /WR below it.
const U1_P1: [number, number] = [89.0, 4.5]
const U2_P1: [number, number] = [89.0, 33.0]
// The sensor breakouts' header rows, pin 1 (VIN) at the left; each board stands up from its header.
const U3_P1: [number, number] = [21.62, 27.74]
const U4_P1: [number, number] = [21.62, 52.32]
// J8 near the left edge, pins pointing at it and ending 0.4 mm inside it (tips 10.04 mm from the pads);
// pad 1 at the bottom. The sensors stand clear to its right.
const J8_P1: [number, number] = [10.45, 29.78]
const J2_PIN1_Y = J2_AT[1] - 3.5 * IDC_PITCH
const j2y = (pin: number) => J2_PIN1_Y + Math.floor((pin - 1) / 2) * IDC_PITCH
const C1_C: [number, number] = [110.5, 43.5]
const SILK = 'F.SilkS'
const TOP = ['F.Cu'] as const
const BOTH = ['B.Cu', 'F.Cu'] as const

// The V5 copper from the jack to J2 pins 15/16, C1 and C2: a solid zone, far wider than 2 mm.
const V5_ZONE = 'M 104.3 30.9 H 119.4 V 51.2 H 104.3 Z'
// /WR and RDY reach J2's even column through these vias, between J2's GND stubs.
const WR_VIA = via(VFD_WR, `101.5 ${j2y(9) + IDC_PITCH / 2}`)
const RDY_VIA = via(RDY, `101.5 ${j2y(11) + IDC_PITCH / 2}`)
const pin = (name: (typeof WROOM_PADS)[number]) => U5.pin(name)

/** A body with no pads, centred on at: solder tails of top-side THT parts, below the carrier. */
function TailBody({ children, w, h, ...rest }: FootprintProps & { w: number; h: number }) {
  return (
    <footprint id="carrier:THT-tails" bom={false} pos={false} model={{ kind: 'ic', w, h, height: rest.height as number, color: '#9a9a9a' }} {...rest}>
      <rect layer="F.Fab" x={-w / 2} y={-h / 2} w={w} h={h} />
      {children}
    </footprint>
  )
}
// [x, y, w, h, height]: header pins and leads below the carrier, checked against the VFD's rear parts.
const TAILS: [number, number, number, number, number][] = [
  [C1_C[0], C1_C[1], 7, 2, THT_TAIL],
  [U3_P1[0] + 5.08, U3_P1[1], 12.7, 2, BREAKOUT_TAIL],
  [U4_P1[0] + 5.08, U4_P1[1], 12.7, 2, BREAKOUT_TAIL],
]

// J8 labels, top to bottom (pad 8 at the top).
const J8_LABELS = ['3V3', 'G', '4', '5', '6', '7', '15', '16']

export default (
  <PCB
    name="vfdclock-carrier"
    revision="0.3"
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

    {/* ---------------------------------------------------------------- the module and its support */}
    <U5 at={`${WROOM_AT[0]} ${WROOM_AT[1]}`} />
    <U7 at="22 6" />
    <C5 at="15.5 6 90deg" />
    <C6 at="28.5 6 90deg" />
    <C9 at="45.6 7.2" />
    <C7 at="49.3 7.2" />
    <TP5 at="36.0 8.4" />
    <R7 at="42.0 9.4 90deg" />
    <C8 at="39.0 10.6" />
    <SW1 at="33.5 3.6" />
    <SW2 at="80.0 44.0" />
    <TP6 at="74.2 11.3" />
    <TP7 at="74.2 13.4" />
    <R8 at="52.2 30.0 90deg" />

    {/* ---------------------------------------------------------------- USB-C, low on the left edge */}
    <J5 at="3.0 51.0 270deg" />
    <U6 at="13.0 59.5" />
    <R5 at="9.5 62.5" />
    <R6 at="11.5 43.2" />
    <D3 at="20.0 62.5" />
    <D2 at="26.0 62.5" />

    {/* ---------------------------------------------------------------- expansion and sensors, down the left side */}
    <J8 at={`${J8_P1[0]} ${J8_P1[1]} 180deg`} height={RA_HEADER_H} />
    <U3 at={`${U3_P1[0]} ${U3_P1[1]} 90deg`} />
    <U4 at={`${U4_P1[0]} ${U4_P1[1]} 90deg`} />

    {/* ---------------------------------------------------------------- level shifters */}
    <U1 at={`${U1_P1[0]} ${U1_P1[1]}`} height={DIP_BODY_H} />
    <C3 at={`${U1_P1[0] + 10.5} ${U1_P1[1]}`} height={DISC_H} />
    <U2 at={`${U2_P1[0]} ${U2_P1[1]}`} height={DIP_BODY_H} />
    <C4 at={`${U2_P1[0] + 10.5} ${U2_P1[1]} 270deg`} height={DISC_H} />
    <R_RDY1 at="91.0 30.4" />
    <R_RDY2 at="94.6 30.4" />
    <TP3 at="84.5 30.4" />
    <TP4 at="85.5 42.0" />

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
    {/* V5 to U1: from C1 up under J2 on B.Cu, along the top edge, down to C3 */}
    {route(C1[1]).layer('B.Cu').V(38.2).H(113.6).V(2.6).H(U1_P1[0] + 10.5).Z(C3[1]).width(0.8)}
    {route(U1.pin('VCC')).Z(C3[1]).width(0.8)}
    {route(U1.pin('VCC')).Z(U1.pin('DIR'))}
    {route(U2.pin('VCC')).Z(C4[1]).width(0.8)}
    {route(U2.pin('VCC')).Z(U2.pin('DIR'))}
    {route(C4[1]).X(C2[1]).layers([...BOTH]).width(0.8)}
    {route(R1[1]).Z('106.5 50.6')}
    {route(TP1[1]).X(R1[1]).layers([...TOP])}

    {/* ---------------------------------------------------------------- the display bus */}
    {GPIO.D.map((io, k) => route(pin(io)).X(U1.pin(`A${8 - k}`)).layers([...BOTH]))}
    {GPIO.D.map((_, k) => route(U1.pin(`B${8 - k}`)).X(J2[8 - k]).layers([...BOTH]))}
    {route(pin(GPIO.WR)).X(U2.pin('A1')).layers([...BOTH])}
    {route(R8[1]).X(pin(GPIO.WR)).layers([...BOTH])}
    {route(U2.pin('B1')).X(WR_VIA).layers([...BOTH])}
    {WR_VIA}
    {route(WR_VIA).X(J2[10]).layers([...TOP])}
    {route(TP4[1]).X(U2.pin('B1')).layers([...BOTH])}
    {route(pin(GPIO.RDY)).X(TP3[1]).layers([...BOTH])}
    {route(TP3[1]).X(R_RDY1[1]).layers([...BOTH])}
    {route(R_RDY1[1]).X(R_RDY2[1]).layers([...TOP])}
    {route(R_RDY2[1]).X(RDY_VIA).layers([...BOTH])}
    {RDY_VIA}
    {route(RDY_VIA).X(J2[12]).layers([...TOP])}

    {/* ---------------------------------------------------------------- module support */}
    {route(U7.pin('VOUT')).X(C6[1]).layers([...TOP])}
    {route(U7.pin('VOUT')).X(C9[1]).layers([...TOP])}
    {route(C9[1]).X(C7[1]).layers([...TOP])}
    {route(C7[1]).X(pin('3V3')).layers([...TOP])}
    {route(R7[2]).X(pin('3V3')).layers([...TOP])}
    {route(TP5[1]).X(R7[2]).layers([...TOP])}
    {route(pin('EN')).X(R7[1]).layers([...TOP])}
    {route(R7[1]).X(C8[1]).layers([...TOP])}
    {route(C8[1]).X(SW1.A).layers([...BOTH])}
    {/* pads of one pin, joined in copper: the buttons' two A pads, the LDO tab, USB-C's flipped D+/D- */}
    {[SW1, SW2].map(sw => route(sw[1]).X(sw[2]).layers([...TOP]))}
    {route(U7[2]).X(U7[4]).layers([...TOP])}
    {route(J5['A6']).X(J5['B6']).layers([...BOTH])}
    {route(J5['A7']).X(J5['B7']).layers([...BOTH])}
    {route(pin(GPIO.BOOT)).X(SW2.A).layers([...BOTH])}
    {route(pin('TXD0')).X(TP6[1]).layers([...TOP])}
    {route(pin('RXD0')).X(TP7[1]).layers([...TOP])}
    {route(C5[1]).X(U7.pin('VIN')).layers([...TOP])}

    {/* 3V3 to the sensors, J8 and the pull-ups, on B.Cu under the lanes */}
    {route(C6[1]).X(J8[8]).layers([...BOTH])}
    {route(J8[8]).X(U3[1]).layers([...BOTH])}
    {route(U3[1]).X(U4[1]).layers([...BOTH])}
    {route(TP5[1]).X(R8[2]).layers([...BOTH])}
    {route(R8[2]).X(R_RDY1[2]).layers([...BOTH])}

    {/* ---------------------------------------------------------------- USB and the 5 V feeds */}
    {/* through the clamp: in on pads 1 and 3, out on 6 and 4, each pair also joined under the chip */}
    {route(J5.DP).X(U6[1]).layers([...TOP])}
    {route(J5.DN).X(U6[3]).layers([...TOP])}
    {route(U6[1]).Z(U6[6])}
    {route(U6[3]).Z(U6[4])}
    {route(U6[6]).X(pin(GPIO.USB_DP)).layers([...BOTH])}
    {route(U6[4]).X(pin(GPIO.USB_DN)).layers([...BOTH])}
    {route(U6.pin('GND')).X(R5[2]).layers([...TOP])}
    {route(R5[2]).Z('10.48 64.4')}
    {via(GND, '10.48 64.4')}
    {route(J5['A4']).X(J5['B4']).layers([...BOTH]).width(0.8)}
    {route(J5.CC1).X(R5[1]).layers([...BOTH])}
    {route(J5.CC2).X(R6[1]).layers([...BOTH])}
    {route(J5.VBUS).X(U6.pin('VBUS')).layers([...BOTH])}
    {route(U6.pin('VBUS')).X(D3.pin('A')).layers([...BOTH])}
    {route(D3.pin('K')).X(D2.pin('K')).layers([...TOP])}
    {route(D2.pin('K')).X(C5[1]).layers([...BOTH])}
    {route(D2.pin('A')).X(C4[1]).layers([...BOTH])}

    {/* ---------------------------------------------------------------- I2C, expansion */}
    {route(pin(GPIO.SDA)).X(U3[5]).layers([...BOTH])}
    {route(pin(GPIO.SCL)).X(U3[4]).layers([...BOTH])}
    {route(U3[5]).X(U4[5]).layers([...BOTH])}
    {route(U3[4]).X(U4[4]).layers([...BOTH])}
    {GPIO.EXP.map((io, k) => route(pin(io)).X(J8[6 - k]).layers([...BOTH]))}
    {route(R1[2]).X(D1.A).layers([...TOP])}

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
    {HOLES.map(([x, y]) => keepout('all', circle(STANDOFF_CLEAR_D, x, y)))}

    {/* the stack: breakouts above on their own header plastic, VFD 15 mm below on M3 standoffs */}
    {reference('./refs/sgp40/pcb.tsx', { mate: { local: U3, remote: 'J1', pin: 1, nets: (n: string) => (n === '3V3' ? 'VIN' : n) }, stack: 'above', gap: BREAKOUT_GAP })}
    {reference('./refs/scd41/pcb.tsx', { mate: { local: U4, remote: 'J1', pin: 1, nets: (n: string) => (n === '3V3' ? 'VIN' : n) }, stack: 'above', gap: BREAKOUT_GAP })}
    {reference('./refs/vfd/pcb.tsx', { at: [0, 0, -(STANDOFF_LEN + VFD_THICKNESS)] })}

    {/* ---------------------------------------------------------------- silk: polarity, pin 1 and pin names only */}
    <circle layer={SILK} cx={C1_C[0]} cy={C1_C[1]} r={5.15} />
    <path layer={SILK} d={`M ${C1_C[0] + 2.3} ${C1_C[1] - 3.98} A 4.6 4.6 0 0 1 ${C1_C[0] + 2.3} ${C1_C[1] + 3.98}`} width={0.6} />
    <text layer={SILK} at={`${C1_C[0] - 3.4} ${C1_C[1] - 2.6}`} size={1.4}>+</text>
    <path layer={SILK} d={`M ${J2_AT[0] - 4.585} ${J2_AT[1] - 9.9} V ${J2_AT[1] - 14.08} H ${J2_AT[0] + 4.585} V ${J2_AT[1] - 9.9}`} />
    <path layer={SILK} d={`M ${J2_AT[0] - 4.585} ${J2_AT[1] + 9.9} V ${J2_AT[1] + 14.08} H ${J2_AT[0] + 4.585} V ${J2_AT[1] + 9.9}`} />
    <path layer={SILK} d={`M 103.0 ${J2_PIN1_Y - 0.8} L 104.5 ${J2_PIN1_Y} L 103.0 ${J2_PIN1_Y + 0.8} Z`} fill />
    {J8_LABELS.map((l, i) => <text layer={SILK} at={`${J8_P1[0] + 1.45} ${J8_P1[1] - (7 - i) * 2.54}`} size={0.7} anchor="start">{l}</text>)}
    <text layer={SILK} at="106.5 60.0" size={0.8}>5V</text>
    <text layer={SILK} at="110.5 60.0" size={0.8}>GND</text>
    <text layer={SILK} at="84.5 28.6" size={0.8}>RDY</text>
    <text layer={SILK} at="85.5 43.9" size={0.8}>/WR</text>
    <text layer={SILK} at="36.0 10.2" size={0.8}>3V3</text>
    <text layer={SILK} at="76.2 11.3" size={0.7} anchor="start">TX</text>
    <text layer={SILK} at="76.2 13.4" size={0.7} anchor="start">RX</text>
    <text layer={SILK} at="124.5 41.9" size={0.9}>5V IN</text>
    <text layer={SILK} at="113.5 64.0" size={0.9}>vfdclock r0.3</text>
  </PCB>
)
