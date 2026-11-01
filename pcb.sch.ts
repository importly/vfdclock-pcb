// vfdclock carrier: nets and parts. The layout is in pcb.tsx, the shared geometry in lib/frame.ts,
// the devkit and VFD CN4 pinouts in lib/pinout.ts.
// Rule from the owner: parts already bought stay through-hole (both SN74AHCT245N, the 1000 uF can,
// the 0.1 uF discs, the barrel jack); everything bought new is SMD. Every part sits on the top face,
// the outside of the stack, where a clear back panel shows it.
import { bus, nets, NC, type Net } from '@pcbjs/core'
import { kicadFootprint, kicadModel } from '@pcbjs/kicad'
import { C0805, LED0805, R0805, TestPad } from '@pcbjs/lib'
import { BarrelJack10811 } from './lib/barrelJack'
import { BreakoutRow, DevkitRow } from './lib/devkitRow'
import { C1_HEIGHT, IDC_PITCH } from './lib/frame'
import { CARRIER_NET_OF, CN4, DEVKIT_J1, DEVKIT_J3 } from './lib/pinout'

// ---------------------------------------------------------------- nets
// power: V5 carries the VFD's 1.1 A (2.2 A at switch-on) on the zone and wide copper;
// these classes size the branches the router lays.
export const { GND, V5, V5_ESP, WR, RDY, VFD_WR, SDA, SCL, LED_A, GPIO14, GPIO15, GPIO16, GPIO17, GPIO18, GPIO21 } = nets({
  GND: { class: 'gnd' },
  V5: { class: 'power' },
  V5_ESP: { class: 'power' },
  WR: { class: 'sig' },
  RDY: { class: 'sig' },
  VFD_WR: { class: 'sig' },
  SDA: { class: 'sig' },
  SCL: { class: 'sig' },
  LED_A: { class: 'sig' },
  GPIO14: { class: 'sig' },
  GPIO15: { class: 'sig' },
  GPIO16: { class: 'sig' },
  GPIO17: { class: 'sig' },
  GPIO18: { class: 'sig' },
  GPIO21: { class: 'sig' },
})
/** The devkit's 3.3 V output, net "3V3". */
export const V3V3 = nets({ '3V3': { class: 'v33' } })['3V3']
/** 3.3 V side of the data bus, ESP32 GPIO4..11. */
export const D = bus('D', 8, { class: 'sig' })
/** 5 V side of the data bus, to VFD CN4. */
export const VFD_D = bus('VFD_D', 8, { class: 'sig' })

const NET: Record<string, Net> = {
  GND, V5, V5_ESP, WR, RDY, VFD_WR, SDA, SCL, GPIO14, GPIO15, GPIO16, GPIO17, GPIO18, GPIO21,
  '3V3': V3V3,
  ...Object.fromEntries(D.map((n, i) => [`D${i}`, n])),
  ...Object.fromEntries(VFD_D.map((n, i) => [`VFD_D${i}`, n])),
}

// ---------------------------------------------------------------- footprints
// KiCad's library silk is 0.12 mm, under JLCPCB's 0.15 mm; those parts take silk: 'none' and
// pcb.tsx draws their outlines at 0.15 mm.
// KiCad's D10 can model is 10 mm tall; the owned Rubycon 16YXJ1000MT810X16 stands 17.5 mm, so it is stretched in z.
const CapRadial = kicadFootprint('Capacitor_THT:CP_Radial_D10.0mm_P5.00mm', {
  silk: 'none',
  model: { file: kicadModel('${KICAD10_3DMODEL_DIR}/Capacitor_THT.3dshapes/CP_Radial_D10.0mm_P5.00mm.step'), scale: [1, 1, C1_HEIGHT / 10] },
})
const CapDisc = kicadFootprint('Capacitor_THT:C_Disc_D5.0mm_W2.5mm_P5.00mm', { silk: 'none' })
const SOD123 = kicadFootprint('Diode_SMD:D_SOD-123', { silk: 'none', pinNames: { 1: 'K', 2: 'A' } })
// Keyed SMD box header; the key slot is on the odd-pin (-x) side, as on the VFD's CN4.
const BoxHeader = kicadFootprint(`Connector_IDC:IDC-Header_2x08_P${IDC_PITCH.toFixed(2)}mm_Vertical_SMD`, { prefix: 'J', silk: 'none' })
// Right-angle 2.54 mm header at the bottom edge, pins out past it for Dupont leads.
const HeaderRA8 = kicadFootprint('Connector_PinHeader_2.54mm:PinHeader_1x08_P2.54mm_Horizontal', { prefix: 'J', silk: 'none' })
const DIP20_245 = kicadFootprint('Package_DIP:DIP-20_W7.62mm', {
  prefix: 'U',
  silk: 'none',
  pinNames: ['DIR', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'GND', 'B8', 'B7', 'B6', 'B5', 'B4', 'B3', 'B2', 'B1', 'OE', 'VCC'],
})

// ---------------------------------------------------------------- power
/** 5.5/2.1 mm DC jack (SparkFun PRT-10811), centre positive; pin 3 is the sleeve switch, tied to GND. Owned; opening on the right edge. */
export const J1 = BarrelJack10811('DC jack 5.5/2.1').source({ MPN: '10811', Manufacturer: 'SparkFun', Description: 'DC barrel jack 5.5x2.1 mm, right angle THT (4UCON 18742), owned' }).connect({ 1: V5, 2: GND, 3: GND })
/** Bulk 1000 uF at the VFD connector: the VFD's switch-on surge. Owned, THT radial D10 P5, 17.5 mm tall. */
export const C1 = CapRadial('1000u 16V').source({ MPN: '16YXJ1000MT810X16', Manufacturer: 'Rubycon', Description: 'Al electrolytic 1000 uF 16 V radial D10 x 16 P5.0, owned' }).connect({ 1: V5, 2: GND })
export const C2 = C0805('10u').source({ MPN: 'CL21A106KAYNNNE', 'MPN:LCSC': 'C15850' }).connect(V5, GND)
export const R1 = R0805('1k').source({ MPN: '0805W8F1001T5E', 'MPN:LCSC': 'C17513' }).connect(V5, LED_A)
export const D1 = LED0805('green').source({ MPN: 'KT-0805G', 'MPN:LCSC': 'C2297' }).connect({ A: LED_A, K: GND })
/** Keeps the devkit's USB 5 V from back-feeding the VFD supply. */
export const D2 = SOD123('B5819W').source({ MPN: 'B5819W', 'MPN:LCSC': 'C8598' }).connect({ A: V5, K: V5_ESP })

// ---------------------------------------------------------------- level shifters, owned DIPs
// U1 carries D0..D7: channel n carries bit 8-n (A1/B1 = D7 ... A8/B8 = D0), so both rows keep the
// devkit's left-to-right order (D7 at the left) and the bus has no crossing on the way to J2.
export const U1 = DIP20_245('SN74AHCT245N').source({ MPN: 'SN74AHCT245N', Manufacturer: 'Texas Instruments' }).connect({
  DIR: V5, OE: GND, VCC: V5, GND,
  A1: D[7], A2: D[6], A3: D[5], A4: D[4], A5: D[3], A6: D[2], A7: D[1], A8: D[0],
  B1: VFD_D[7], B2: VFD_D[6], B3: VFD_D[5], B4: VFD_D[4], B5: VFD_D[3], B6: VFD_D[2], B7: VFD_D[1], B8: VFD_D[0],
})
/** /WR buffer: A1 = WR (GPIO12), B1 = VFD_WR; unused inputs to GND, unused outputs open. */
export const U2 = DIP20_245('SN74AHCT245N').source({ MPN: 'SN74AHCT245N', Manufacturer: 'Texas Instruments' }).connect({
  DIR: V5, OE: GND, VCC: V5, GND,
  A1: WR, A2: GND, A3: GND, A4: GND, A5: GND, A6: GND, A7: GND, A8: GND,
  B1: VFD_WR, B2: NC, B3: NC, B4: NC, B5: NC, B6: NC, B7: NC, B8: NC,
})
export const C3 = CapDisc('100n').source({ MPN: 'owned 100nF disc P5', Description: 'ceramic disc 0.1 uF P5.0, owned' }).connect(V5, GND)
export const C4 = CapDisc('100n').source({ MPN: 'owned 100nF disc P5', Description: 'ceramic disc 0.1 uF P5.0, owned' }).connect(V5, GND)

// ---------------------------------------------------------------- RDY readback
// VFD RDY is open collector with 47 k to 5 V inside the module. 10 k to 3V3 and 47 k to GND
// hold the node at about 3.06 V high (3.0 to 3.13 V worst case: above V_IH 2.475 V, below 3V3)
// and 0.2 V low. 47 k rather than 39 k: a JLCPCB basic part.
export const R_RDY1 = R0805('10k').ref('R_RDY1').source({ MPN: '0805W8F1002T5E', 'MPN:LCSC': 'C17414' }).connect(RDY, V3V3)
export const R_RDY2 = R0805('47k').ref('R_RDY2').source({ MPN: '0805W8F4702T5E', 'MPN:LCSC': 'C17713' }).connect(RDY, GND)

// ---------------------------------------------------------------- connectors
/** To VFD CN4 by a straight 16-way IDC ribbon (female-female), pin 1 to pin 1. */
export const J2 = BoxHeader('VFD CN4 2x8 box').source({ MPN: '2x8P 2.54 SMD box header', Description: 'male shrouded IDC box header 2x8 2.54 mm SMD vertical' })
  .connect(Object.fromEntries(CN4.map((n, i) => [i + 1, NET[n]])))

const devkitRow = (names: readonly string[]) =>
  Object.fromEntries(names.map((n, i) => {
    const carrier = CARRIER_NET_OF[n as keyof typeof CARRIER_NET_OF]
    return [i + 1, carrier ? NET[carrier] : NC]
  }))
/** Devkit J1 row (all the VFD signals): bare plated holes, the devkit's own pins solder straight in. */
export const J3 = DevkitRow().connect(devkitRow(DEVKIT_J1))
/** Devkit J3 row (I2C, GPIO21, GND). */
export const J4 = DevkitRow().connect(devkitRow(DEVKIT_J3))

// J8 lies at the bottom edge with pad 1 (square) at its right end; read left to right in the top view
// it is GPIO21, 18, 17, 16, 15, 14, GND, 3V3, in the devkit's pin order so the routes barely cross.
/** Expansion: 3V3, GND, GPIO14, 15, 16, 17, 18, 21 (pad 1 .. pad 8). */
export const J8 = HeaderRA8('EXP 1x8 RA').source({ MPN: '1x8P 2.54 male header right-angle' })
  .connect({ 1: V3V3, 2: GND, 3: GPIO14, 4: GPIO15, 5: GPIO16, 6: GPIO17, 7: GPIO18, 8: GPIO21 })

// ---------------------------------------------------------------- air sensors, owned Adafruit breakouts
// Soldered on by their own 1x5 headers: VIN, 3V, GND, SCL, SDA. VIN takes 3V3, not 5 V: the SGP40's
// 10k I2C pull-ups go to VIN, and the ESP32's pins are 3.3 V only. Their pull-ups are the bus pull-ups.
const breakout = (ref: string, value: string, MPN: string) =>
  BreakoutRow(value).ref(ref).source({ MPN, Manufacturer: 'Adafruit', Description: `${value} STEMMA QT breakout, owned, soldered by its header` })
    .connect({ 1: V3V3, 2: NC, 3: GND, 4: SCL, 5: SDA })
/** Adafruit 4829, SGP40 VOC sensor. */
export const U3 = breakout('U3', 'SGP40', '4829')
/** Adafruit 5190, SCD-41 CO2, temperature and humidity sensor. */
export const U4 = breakout('U4', 'SCD-41', '5190')

// ---------------------------------------------------------------- test pads
/** V5 at the display connector: the acceptance check is >= 4.9 V here with the VFD running. */
export const TP1 = TestPad()('V5').connect(V5)
export const TP2 = TestPad()('GND').connect(GND)
export const TP3 = TestPad()('RDY').connect(RDY)
export const TP4 = TestPad()('/WR').connect(VFD_WR)
