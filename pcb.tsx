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
import { VFD_VISUAL } from './lib/vfdVisual'

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
const U3_P1: [number, number] = [21.62, 28.74]
const U4_P1: [number, number] = [21.62, 53.32]
// J8 near the left edge, pins pointing at it and ending 0.4 mm inside it (tips 10.04 mm from the pads);
// pad 1 at the bottom. The sensors stand clear to its right.
const J8_P1: [number, number] = [10.45, 27.78]
const J2_PIN1_Y = J2_AT[1] - 3.5 * IDC_PITCH
const j2y = (pin: number) => J2_PIN1_Y + Math.floor((pin - 1) / 2) * IDC_PITCH
const C1_C: [number, number] = [110.5, 43.5]
const SILK = 'F.SilkS'
const TOP = ['F.Cu'] as const
const BOTH = ['B.Cu', 'F.Cu'] as const

// The V5 copper from the jack to J2 pins 15/16, C1 and C2: a solid zone, far wider than 2 mm.
const V5_ZONE = 'M 104.3 30.9 H 119.4 V 51.2 H 104.3 Z'
// /WR comes from U2 on B.Cu and up through this via, then threads J2's odd column like the bus.
const WR_VIA = via(VFD_WR, `102.2 ${j2y(9) + IDC_PITCH / 2}`)
const pin = (name: (typeof WROOM_PADS)[number]) => U5.pin(name)

// ---------------------------------------------------------------- hand-drawn lanes
// The 3.3 V bus leaves the module's bottom pads straight down, runs right in a lane per bit, rises
// beside U1 and turns into its A column: D7 innermost (top lane, first riser, A1), D0 outermost.
const LANE = 0.635
const BUS_LANE_Y = 28.0 // D7's lane
const BUS_RISER_X = 76.2 // D7's riser
const uA = (n: number) => U1_P1[1] + n * IDC_PITCH // U1 An, and Bn one pitch lower
// The 5 V bus from U1's B column to J2. J2's even pads sit behind the odd ones, so an even bit runs
// between two odd pads, jogs up in the gap between the columns, and enters its pad from the left.
// Bits that drop keep their verticals right to left, bits that climb left to right: no crossings.
const B_X = [101.0, 100.2, 99.4, 98.6, 98.6, 99.4, 100.2, 101.0]
const J2_GAP_X = J2_AT[0]
// Expansion lanes leave the module's left pads and drop to J8 at x 15.0 + 0.7 per bit; I2C drops at
// the sensor headers; USB runs down at x 41 and along the bottom to the clamp.
const EXP_X = (k: number) => 15.0 + 0.7 * k
const USB_X = 41.0

/** A body with no pads, centred on at: solder tails of top-side THT parts, below the carrier. */
function TailBody({ children, w, h, ...rest }: FootprintProps & { w: number; h: number }) {
  return (
    <footprint id="carrier:THT-tails" bom={false} pos={false} model={{ kind: 'ic', w, h, height: rest.height as number, color: '#9a9a9a' }} {...rest}>
      <rect layer="F.Fab" x={-w / 2} y={-h / 2} w={w} h={h} />
      {children}
    </footprint>
  )
}
/**
 * An Adafruit breakout's board, as Adafruit's own model, on its header: the same frame as the header row
 * (pin 1 at the origin, pins down +y). The model's frame is the Eagle board's (header pin 1 at
 * (7.62, 2.54), the board running +y away from the header), so it turns -90 and lies flush on the
 * carrier (BREAKOUT_GAP).
 */
function BreakoutBody({ children, file, w, h, ...rest }: FootprintProps & { file: string; w: number; h: number }) {
  return (
    <footprint id="carrier:Adafruit-breakout" bom={false} pos={false} model={{ file, rotate: [0, 0, 90], offset: [-2.54, 7.62, BREAKOUT_GAP] }} {...rest}>
      <rect layer="F.Fab" x={-2.54} y={-7.62} w={h} h={w} />
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
    <C8 at="39.0 8.6" />
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
    <D3 at="20.0 63.3 180deg" />
    <D2 at="26.0 63.3" />

    {/* ---------------------------------------------------------------- expansion and sensors, down the left side */}
    <J8 at={`${J8_P1[0]} ${J8_P1[1]} 180deg`} height={RA_HEADER_H} />
    <U3 at={`${U3_P1[0]} ${U3_P1[1]} 90deg`} />
    <U4 at={`${U4_P1[0]} ${U4_P1[1]} 90deg`} />
    <BreakoutBody ref="X6" value="Adafruit 4829 SGP40" file="./models/adafruit-4829-sgp40.step" w={25.4} h={17.78} at={`${U3_P1[0]} ${U3_P1[1]} 90deg`} />
    <BreakoutBody ref="X7" value="Adafruit 5190 SCD-41" file="./models/adafruit-5187-scd4x.step" w={25.4} h={22.86} at={`${U4_P1[0]} ${U4_P1[1]} 90deg`} />

    {/* ---------------------------------------------------------------- level shifters */}
    <U1 at={`${U1_P1[0]} ${U1_P1[1]}`} height={DIP_BODY_H} />
    <C3 at={`${U1_P1[0] + 10.5} ${U1_P1[1]}`} height={DISC_H} />
    <U2 at={`${U2_P1[0]} ${U2_P1[1]}`} height={DIP_BODY_H} />
    <C4 at={`${U2_P1[0] + 10.5} ${U2_P1[1]} 270deg`} height={DISC_H} />
    <R_RDY1 at="84.5 30.0 90deg" />
    <R_RDY2 at="84.5 33.5 270deg" />
    <TP3 at="86.6 31.8" />
    <TP4 at="99.6 40.6" />

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
    {/* V5 to U2: DIR to VCC across the chip, VCC through C4 straight into the zone */}
    {route(U2.pin('DIR')).Z(U2.pin('VCC')).width(0.8)}
    {route(U2.pin('VCC')).Z(C4[1]).width(0.8)}
    {route(C4[1]).Z('105.0 33.0').width(0.8)}
    {route(R1[1]).V(46.6).Z(C1[1]).width(0.8)}
    {route(TP1[1]).X(R1[1]).layers([...TOP])}
    {/* V5 to D2 and the module's supply: down from TP1 and along the bottom edge */}
    {route(TP1[1]).V(65.0).H(27.65).Z(D2.pin('A')).width(0.8)}
    {/* V5_SYS: D2 and D3 share a cathode node; a B.Cu trunk climbs the left side to U7 */}
    {route(D3.pin('K')).Z(D2.pin('K')).width(0.8)}
    {route(D2.pin('K')).H(23.0).V(61.9).via('B.Cu').V(56.4).H(17.0).V(8.3).via('F.Cu').Z(U7.pin('VIN')).width(0.8)}
    {route(C5[1]).X(U7.pin('VIN')).layers([...TOP])}

    {/* ---------------------------------------------------------------- the display bus */}
    {GPIO.D.map((io, k) => route(pin(io))
      .V(BUS_LANE_Y + (7 - k) * LANE).H(BUS_RISER_X + (7 - k) * LANE).V(uA(8 - k)).Z(U1.pin(`A${8 - k}`)))}
    {B_X.map((x, i) => {
      const n = i + 1
      const src = route(U1.pin(`B${n}`)).H(x)
      return n % 2 === 1
        ? src.V(j2y(n)).Z(J2[n])
        : src.V(j2y(n) + IDC_PITCH / 2).H(J2_GAP_X).V(j2y(n)).Z(J2[n])
    })}
    {/* /WR: straight down from pad 15, right under the bus into U2 A1; out of B1 on B.Cu to the via */}
    {route(pin(GPIO.WR)).V(uA(1) + U2_P1[1] - U1_P1[1]).Z(U2.pin('A1'))}
    {route(R8[1]).X(pin(GPIO.WR)).layers([...TOP])}
    {route(U2.pin('B1')).layer('B.Cu').V(36.8).H(102.2).Z(WR_VIA)}
    {WR_VIA}
    {route(WR_VIA).layer('F.Cu').H(J2_GAP_X).V(j2y(10)).Z(J2[10])}
    {route(TP4[1]).H(97.9).V(38.08).Z(U2.pin('B1'))}
    {/* RDY: down from pad 17 under the bus, up past TP3, through the divider, between U1 and U2 to J2 */}
    {route(pin(GPIO.RDY)).V(34.0).H(82.6).V(31.8).Z(TP3[1])}
    {route(R_RDY1[1]).Z(R_RDY2[1])}
    {route(TP3[1]).H(102.2).V(j2y(11) + IDC_PITCH / 2).H(J2_GAP_X).V(j2y(12)).Z(J2[12])}
    {/* BOOT: under the bus on B.Cu */}
    {route(pin(GPIO.BOOT)).H(73.6).via('B.Cu').V(42.125).H(75.6).via('F.Cu').Z(SW2[1])}

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
    {route(pin('TXD0')).X(TP6[1]).layers([...TOP])}
    {route(pin('RXD0')).X(TP7[1]).layers([...TOP])}

    {/* 3V3: the sensors' VIN pins in one straight drop, fed on B.Cu from U7's tab; J8 and the pull-ups */}
    {route(U3[1]).Z(U4[1])}
    {route(U3[1]).layer('B.Cu').V(10.5).via('F.Cu').H(25.15).Z(U7[4])}
    {route(C6[1]).X(J8[8]).layers([...BOTH])}
    {route(TP5[1]).X(R8[2]).layers([...BOTH])}
    {route(R8[2]).X(R_RDY1[2]).layers([...BOTH])}

    {/* ---------------------------------------------------------------- USB */}
    {/* the lanes: left out of pads 13/14, down at x 41, along the bottom into the clamp's outputs */}
    {route(pin(GPIO.USB_DN)).H(USB_X).V(58.55).Z(U6[6])}
    {route(pin(GPIO.USB_DP)).H(USB_X + LANE).V(60.45).Z(U6[4])}
    {/* through the clamp: in on pads 1 and 3, out on 6 and 4, each pair also joined under the chip */}
    {route(U6[1]).Z(U6[6])}
    {route(U6[3]).Z(U6[4])}
    {route(J5.DN).X(U6[1]).layers([...BOTH])}
    {route(J5.DP).X(U6[3]).layers([...BOTH])}
    {route(U6.pin('GND')).X(R5[2]).layers([...TOP])}
    {route(R5[2]).Z('10.48 64.4')}
    {via(GND, '10.48 64.4')}
    {route(J5['A4']).X(J5['B4']).layers([...BOTH]).width(0.8)}
    {route(J5.CC1).X(R5[1]).layers([...BOTH])}
    {route(J5.CC2).X(R6[1]).layers([...BOTH])}
    {route(J5.VBUS).X(D3.pin('A')).layers([...BOTH]).width(0.8)}
    {route(U6.pin('VBUS')).H(15.9).via('B.Cu').V(61.8).H(18.35).via('F.Cu').Z(D3.pin('A')).width(0.8)}

    {/* ---------------------------------------------------------------- I2C, expansion */}
    {/* SCL and SDA: left out of pads 10/11, straight down through both sensor headers */}
    {route(pin(GPIO.SCL)).H(U3_P1[0] + 3 * IDC_PITCH).Z(U3[4])}
    {route(pin(GPIO.SDA)).H(U3_P1[0] + 4 * IDC_PITCH).Z(U3[5])}
    {route(U3[4]).Z(U4[4])}
    {route(U3[5]).Z(U4[5])}
    {/* expansion: left out of pads 4-9, down beside J8, into its pads; the top lane takes the top pad */}
    {GPIO.EXP.map((io, k) => route(pin(io)).H(EXP_X(k)).V(J8_P1[1] - (5 - k) * IDC_PITCH).Z(J8[6 - k]))}
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
    {/* no vias under the flush-mounted breakouts: their undersides sit on the carrier's solder mask */}
    {keepout('all', 'M 14.0 13.499999999999996 H 39.400000000000006 V 31.279999999999998 H 14.0 Z', { tracks: false, pours: false })}
    {keepout('all', 'M 14.0 33.0 H 39.400000000000006 V 55.86 H 14.0 Z', { tracks: false, pours: false })}

    {/* the stack: the VFD 15 mm below on M3 standoffs */}
    {/* refs/vfd checks the fit and draws the outline; lib/vfdVisual draws the display in its own colours */}
    {reference('./refs/vfd/pcb.tsx', { at: [0, 0, -(STANDOFF_LEN + VFD_THICKNESS)], show: { bodies: false, opacity: 0 } })}
    {VFD_VISUAL}

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
    <text layer={SILK} at="86.6 30.1" size={0.8}>RDY</text>
    <text layer={SILK} at="99.6 42.4" size={0.8}>/WR</text>
    <text layer={SILK} at="36.0 10.2" size={0.8}>3V3</text>
    <text layer={SILK} at="74.2 9.6" size={0.7}>TX</text>
    <text layer={SILK} at="74.2 15.1" size={0.7}>RX</text>
    <text layer={SILK} at="124.5 41.9" size={0.9}>5V IN</text>
    <text layer={SILK} at="113.5 64.0" size={0.9}>vfdclock r0.3</text>
  </PCB>
)
