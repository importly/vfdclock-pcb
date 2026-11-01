// vfdclock carrier, WROOM revision: nets and parts. The layout is in pcb.tsx, the shared geometry in
// lib/frame.ts, the module pads, GPIO map and VFD CN4 pinout in lib/pinout.ts.
// Rule from the owner: parts already bought stay through-hole (both SN74AHCT245N, the 1000 uF can,
// the 0.1 uF radials, the barrel jack, the sensor breakouts); everything bought new is SMD and carries
// an LCSC number for JLCPCB assembly. Every part sits on the top face, the outside of the stack.
import { bus, nets, NC, type Net } from '@pcbjs/core'
import { kicadFootprint, kicadModel } from '@pcbjs/kicad'
import { C0805, LED0805, R0805, SOT223, SOT23, TactSwitch, TestPad, USBC, withPins } from '@pcbjs/lib'
import { BarrelJack10811 } from './lib/barrelJack'
import { ESP32S3Wroom1 } from './lib/esp32s3Wroom1'
import { BreakoutRow } from './lib/headerRow'
import { C1_HEIGHT, IDC_PITCH } from './lib/frame'
import { CN4, GPIO } from './lib/pinout'

// ---------------------------------------------------------------- nets
// power: V5 carries the VFD's 1.1 A (2.2 A at switch-on) on the zone and wide copper;
// these classes size the branches the router lays.
export const { GND, V5, V5_SYS, VBUS, WR, RDY, VFD_WR, SDA, SCL, LED_A, EN, BOOT, USB_DP, USB_DN, CC1, CC2, TXD0, RXD0 } = nets({
  GND: { class: 'gnd' },
  V5: { class: 'power' },
  V5_SYS: { class: 'power' },
  VBUS: { class: 'power' },
  WR: { class: 'sig' },
  RDY: { class: 'sig' },
  VFD_WR: { class: 'sig' },
  SDA: { class: 'sig' },
  SCL: { class: 'sig' },
  LED_A: { class: 'sig' },
  EN: { class: 'sig' },
  BOOT: { class: 'sig' },
  USB_DP: { class: 'sig' },
  USB_DN: { class: 'sig' },
  CC1: { class: 'sig' },
  CC2: { class: 'sig' },
  TXD0: { class: 'sig' },
  RXD0: { class: 'sig' },
})
/** The 3.3 V rail from U7, net "3V3". */
export const V3V3 = nets({ '3V3': { class: 'v33' } })['3V3']
/** 3.3 V side of the data bus, from the module. */
export const D = bus('D', 8, { class: 'sig' })
/** 5 V side of the data bus, to VFD CN4. */
export const VFD_D = bus('VFD_D', 8, { class: 'sig' })
/** The expansion GPIOs, named by GPIO. */
export const EXP = GPIO.EXP.map(io => nets({ [io]: { class: 'sig' } })[io])

const NET: Record<string, Net> = {
  GND, V5, WR, RDY, VFD_WR,
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
// Right-angle 2.54 mm header at the left edge, pins out past it for Dupont leads.
const HeaderRA8 = kicadFootprint('Connector_PinHeader_2.54mm:PinHeader_1x08_P2.54mm_Horizontal', { prefix: 'J', silk: 'none' })
const DIP20_245 = kicadFootprint('Package_DIP:DIP-20_W7.62mm', {
  prefix: 'U',
  silk: 'none',
  pinNames: ['DIR', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'GND', 'B8', 'B7', 'B6', 'B5', 'B4', 'B3', 'B2', 'B1', 'OE', 'VCC'],
})
// USBLC6-2SC6: I/O1 on pads 1 and 6, I/O2 on 3 and 4, a pass-through clamp for each USB line.
const USBLC6 = SOT23(6, { pinNames: ['IO1', 'GND', 'IO2', 'IO2', 'VBUS', 'IO1'] })
const LDO = withPins(SOT223, ['GND', 'VOUT', 'VIN'])
const Tact = TactSwitch('5.1x5.1')

/** JLCPCB basic parts, checked against its parts list. */
const LCSC = {
  R1k: 'C17513', R5k1: 'C27834', R10k: 'C17414', R47k: 'C17713',
  C100n: 'C49678', C1u: 'C28323', C10u: 'C15850', C22u: 'C45783',
  B5819W: 'C8598', LED: 'C2297', AMS1117: 'C6186', TACT: 'C318884',
} as const

// ---------------------------------------------------------------- the module
/**
 * ESP32-S3-WROOM-1-N16R8 (16 MB flash, 8 MB octal PSRAM: IO35-37 are taken, left open).
 * USB-C programs it through its own USB-Serial-JTAG; TX/RX test pads are the fallback.
 */
export const U5 = ESP32S3Wroom1('ESP32-S3-WROOM-1-N16R8')
  .source({ MPN: 'ESP32-S3-WROOM-1-N16R8', Manufacturer: 'Espressif', 'MPN:LCSC': 'C2913202' })
  .connect({
    GND, '3V3': V3V3, EN,
    [GPIO.BOOT]: BOOT, [GPIO.WR]: WR, [GPIO.RDY]: RDY,
    ...Object.fromEntries(GPIO.D.map((io, k) => [io, D[k]])),
    ...Object.fromEntries(GPIO.EXP.map((io, k) => [io, EXP[k]])),
    [GPIO.SDA]: SDA, [GPIO.SCL]: SCL, [GPIO.USB_DN]: USB_DN, [GPIO.USB_DP]: USB_DP,
    TXD0, RXD0,
    IO8: NC, IO46: NC, IO45: NC, IO35: NC, IO36: NC, IO37: NC, IO38: NC, IO39: NC, IO40: NC, IO41: NC, IO42: NC,
    IO1: NC, IO2: NC,
  })
/** Reset: 10 k pull-up and 1 uF on EN, Espressif's power-up delay, and the RESET button. */
export const R7 = R0805('10k').source({ MPN: '0805W8F1002T5E', 'MPN:LCSC': LCSC.R10k }).connect(EN, V3V3)
export const C8 = C0805('1u').source({ MPN: 'CL21B105KBFNNNE', 'MPN:LCSC': LCSC.C1u }).connect(EN, GND)
export const SW1 = Tact('RESET').source({ MPN: 'TS-1187A-B-A-B', 'MPN:LCSC': LCSC.TACT }).connect({ A: EN, B: GND })
/** BOOT: hold IO0 low through a reset for the ROM download mode; IO0 has its own pull-up. */
export const SW2 = Tact('BOOT').source({ MPN: 'TS-1187A-B-A-B', 'MPN:LCSC': LCSC.TACT }).connect({ A: BOOT, B: GND })
/** Holds /WR high, inactive, while the module boots and its pins float. */
export const R8 = R0805('10k').source({ MPN: '0805W8F1002T5E', 'MPN:LCSC': LCSC.R10k }).connect(WR, V3V3)

// ---------------------------------------------------------------- 3.3 V and USB
/** 3.3 V for the module and sensors from V5_SYS: the jack's 5 V or USB, whichever is higher. */
export const U7 = LDO('AMS1117-3.3').source({ MPN: 'AMS1117-3.3', Manufacturer: 'Advanced Monolithic Systems', 'MPN:LCSC': LCSC.AMS1117 })
  .connect({ GND, VOUT: V3V3, VIN: V5_SYS })
export const C5 = C0805('10u').source({ MPN: 'CL21A106KAYNNNE', 'MPN:LCSC': LCSC.C10u }).connect(V5_SYS, GND)
export const C6 = C0805('22u').source({ MPN: 'CL21A226MAQNNNE', 'MPN:LCSC': LCSC.C22u }).connect(V3V3, GND)
/** At the module's 3V3 pad: 10 uF and 100 nF, Espressif's decoupling. */
export const C9 = C0805('10u').source({ MPN: 'CL21A106KAYNNNE', 'MPN:LCSC': LCSC.C10u }).connect(V3V3, GND)
export const C7 = C0805('100n').source({ MPN: 'CC0805KRX7R9BB104', 'MPN:LCSC': LCSC.C100n }).connect(V3V3, GND)
/** The jack's 5 V into V5_SYS; keeps USB from back-feeding the VFD. */
export const D2 = SOD123('B5819W').source({ MPN: 'B5819W', 'MPN:LCSC': LCSC.B5819W }).connect({ A: V5, K: V5_SYS })
/** USB's 5 V into V5_SYS; keeps the jack from back-feeding the USB host. */
export const D3 = SOD123('B5819W').source({ MPN: 'B5819W', 'MPN:LCSC': LCSC.B5819W }).connect({ A: VBUS, K: V5_SYS })
/** USB-C, a USB 2.0 device: 5.1 k on each CC asks the host or charger for 5 V. */
export const J5 = USBC('full16').source({ MPN: 'TYPE-C-31-M-12', Manufacturer: 'Korean Hroparts', 'MPN:LCSC': 'C165948' })
  .connect({ GND, VBUS, CC1, CC2, DP: USB_DP, DN: USB_DN, SBU1: NC, SBU2: NC, SHIELD: GND })
export const R5 = R0805('5.1k').source({ MPN: '0805W8F5101T5E', 'MPN:LCSC': LCSC.R5k1 }).connect(CC1, GND)
export const R6 = R0805('5.1k').source({ MPN: '0805W8F5101T5E', 'MPN:LCSC': LCSC.R5k1 }).connect(CC2, GND)
/** ESD clamp on D+, D- and VBUS, at the connector. */
export const U6 = USBLC6('USBLC6-2SC6').source({ MPN: 'USBLC6-2SC6', Manufacturer: 'STMicroelectronics', 'MPN:LCSC': 'C7519' })
  .connect({ IO1: USB_DP, IO2: USB_DN, GND, VBUS })

// ---------------------------------------------------------------- power for the VFD
/** 5.5/2.1 mm DC jack (SparkFun PRT-10811), centre positive; pin 3 is the sleeve switch, tied to GND. Owned; opening on the right edge. */
export const J1 = BarrelJack10811('DC jack 5.5/2.1').source({ MPN: '10811', Manufacturer: 'SparkFun', Description: 'DC barrel jack 5.5x2.1 mm, right angle THT (4UCON 18742), owned' }).connect({ 1: V5, 2: GND, 3: GND })
/** Bulk 1000 uF at the VFD connector: the VFD's switch-on surge. Owned, THT radial D10 P5, 17.5 mm tall. */
export const C1 = CapRadial('1000u 16V').source({ MPN: '16YXJ1000MT810X16', Manufacturer: 'Rubycon', Description: 'Al electrolytic 1000 uF 16 V radial D10 x 16 P5.0, owned' }).connect({ 1: V5, 2: GND })
export const C2 = C0805('10u').source({ MPN: 'CL21A106KAYNNNE', 'MPN:LCSC': LCSC.C10u }).connect(V5, GND)
export const R1 = R0805('1k').source({ MPN: '0805W8F1001T5E', 'MPN:LCSC': LCSC.R1k }).connect(V5, LED_A)
export const D1 = LED0805('green').source({ MPN: 'KT-0805G', 'MPN:LCSC': LCSC.LED }).connect({ A: LED_A, K: GND })

// ---------------------------------------------------------------- level shifters, owned DIPs
// U1 carries D0..D7: channel n carries bit 8-n (A1/B1 = D7 ... A8/B8 = D0). The bus leaves the module
// with D7 innermost, so it reaches U1's A column top-down D7..D0 and J2 the same way, with no crossing.
export const U1 = DIP20_245('SN74AHCT245N').source({ MPN: 'SN74AHCT245N', Manufacturer: 'Texas Instruments' }).connect({
  DIR: V5, OE: GND, VCC: V5, GND,
  A1: D[7], A2: D[6], A3: D[5], A4: D[4], A5: D[3], A6: D[2], A7: D[1], A8: D[0],
  B1: VFD_D[7], B2: VFD_D[6], B3: VFD_D[5], B4: VFD_D[4], B5: VFD_D[3], B6: VFD_D[2], B7: VFD_D[1], B8: VFD_D[0],
})
/** /WR buffer: A1 = WR, B1 = VFD_WR; unused inputs to GND, unused outputs open. */
export const U2 = DIP20_245('SN74AHCT245N').source({ MPN: 'SN74AHCT245N', Manufacturer: 'Texas Instruments' }).connect({
  DIR: V5, OE: GND, VCC: V5, GND,
  A1: WR, A2: GND, A3: GND, A4: GND, A5: GND, A6: GND, A7: GND, A8: GND,
  B1: VFD_WR, B2: NC, B3: NC, B4: NC, B5: NC, B6: NC, B7: NC, B8: NC,
})
export const C3 = CapDisc('100n').source({ MPN: 'K104K15X7RF5TL2', Manufacturer: 'Vishay', Description: '100 nF 50 V X7R radial P5.0, owned' }).connect(V5, GND)
export const C4 = CapDisc('100n').source({ MPN: 'K104K15X7RF5TL2', Manufacturer: 'Vishay', Description: '100 nF 50 V X7R radial P5.0, owned' }).connect(V5, GND)

// ---------------------------------------------------------------- RDY readback
// VFD RDY is open collector with 47 k to 5 V inside the module. 10 k to 3V3 and 47 k to GND
// hold the node at about 3.06 V high (3.0 to 3.13 V worst case: above V_IH 2.475 V, below 3V3)
// and 0.2 V low.
export const R_RDY1 = R0805('10k').ref('R_RDY1').source({ MPN: '0805W8F1002T5E', 'MPN:LCSC': LCSC.R10k }).connect(RDY, V3V3)
export const R_RDY2 = R0805('47k').ref('R_RDY2').source({ MPN: '0805W8F4702T5E', 'MPN:LCSC': LCSC.R47k }).connect(RDY, GND)

// ---------------------------------------------------------------- connectors
/** To VFD CN4 by a straight 16-way IDC ribbon (female-female), pin 1 to pin 1. */
export const J2 = BoxHeader('VFD CN4 2x8 box').source({ MPN: '2x8P 2.54 SMD box header', Description: 'male shrouded IDC box header 2x8 2.54 mm SMD vertical' })
  .connect(Object.fromEntries(CN4.map((n, i) => [i + 1, NET[n]])))

// J8 lies on the left edge, pad 1 (square) at its bottom end. Top to bottom it reads 3V3, GND, then
// IO4, IO5, IO6, IO7, IO15, IO16, the order of the module's left-side pads, so the routes never cross.
/** Expansion: pad 8 .. pad 1 = 3V3, GND, IO4, IO5, IO6, IO7, IO15, IO16. */
export const J8 = HeaderRA8('EXP 1x8 RA').source({ MPN: '1x8P 2.54 male header right-angle' })
  .connect({ 8: V3V3, 7: GND, 6: EXP[0], 5: EXP[1], 4: EXP[2], 3: EXP[3], 2: EXP[4], 1: EXP[5] })

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
export const TP5 = TestPad()('3V3').connect(V3V3)
/** UART0, the fallback way in: a 3.3 V USB-serial adapter and the BOOT button can always flash it. */
export const TP6 = TestPad()('TX').connect(TXD0)
export const TP7 = TestPad()('RX').connect(RXD0)
