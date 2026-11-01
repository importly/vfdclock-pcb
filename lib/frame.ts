// Mechanical frame shared by the carrier (pcb.tsx) and its reference boards (refs/*).
// Frame: mm, x right, y down, origin at the top-left corner. The carrier's top view is the
// VFD module's rear (component side) view: the "top" long edge is the VFD's 14 I/O-hole edge.
// reference() compiles each entry in its own process, so only plain constants live here.

// ---------------------------------------------------------------- VFD module and carrier outline
// Noritake GU256X128C-3900 PCB, 131.0 +-0.4 x 66.0 +-0.7 (DS-1604-0001-02).
export const BOARD_W = 131.0
export const BOARD_H = 66.0

// VFD mounting holes, pitch 125.0 x 58.0. The VFD's are 3.5 mm; the carrier's are M3 clearance.
export const HOLES: readonly (readonly [number, number])[] = [
  [3.0, 4.0],
  [128.0, 4.0],
  [3.0, 62.0],
  [128.0, 62.0],
]
export const VFD_HOLE_D = 3.5
export const CARRIER_HOLE_D = 3.2
/** Copper and parts kept clear around each hole for the standoff / nut. */
export const STANDOFF_CLEAR_D = 6.5
/** M3 standoff length, VFD rear face to carrier bottom face; VFD rear parts are <= 10 mm. */
export const STANDOFF_LEN = 15.0
export const VFD_THICKNESS = 1.6

// Notch above the VFD's CN4, open to the carrier's right edge, so the IDC socket and ribbon
// pass up through the carrier. Inner corners rounded with r.
export const NOTCH = { x: 119.0, y0: 7.0, y1: 40.0, r: 2.0 } as const

// ---------------------------------------------------------------- VFD CN4 (parallel port) and J2
/** CN4 / J2 pitch. CN4 is an IRISO IMSA-9032B-16P box header, measured 2.54 mm. */
export const IDC_PITCH = 2.54
/** CN4 pin 1 on the VFD rear: odd column nearer the board centre (-x), pin 1 at the I/O edge end. */
export const CN4_PIN1: readonly [number, number] = [124.7, 14.3]
/** CN4 box header body height. */
export const CN4_HEIGHT = 9.0

/**
 * J2 centre (male SMD box header, top side): same y as CN4 and the same orientation, key slot -x,
 * pin 1 at -y, odd pins -x, just -x of the notch; a straight ribbon then lands pin 1 on pin 1.
 */
export const J2_AT: readonly [number, number] = [111.9, CN4_PIN1[1] + 3.5 * IDC_PITCH]

// VFD CN1 (JST B7B-XH-A, serial + 5 V, unused): pin row 4.4 mm from the left edge, y 36.9 to 51.9.
export const CN1_AT: readonly [number, number] = [4.4, (36.9 + 51.9) / 2]
export const CN1_HEIGHT = 7.0
// VFD rear collision bodies, measured from the user's photo (+-2 mm). Each box is grown by that
// tolerance plus the 1.5 mm clearance the carrier's underside parts must keep, sideways, and by the
// 1.5 mm clearance upwards; so reference-collision passing means >= 1.5 mm to every VFD part.
export const VFD_POS_TOL = 2.0
export const VFD_CLEAR = 1.5
const G = VFD_POS_TOL + VFD_CLEAR
/** [x, y, w, h, height]: nominal centre and size, then the grown box is built from them. */
const grown = (x: number, y: number, w: number, h: number, height: number) =>
  ({ x, y, w: w + 2 * G, h: h + 2 * G, height: height + VFD_CLEAR }) as const
/** Electrolytic C36, 8 mm across, 10 mm tall: only ~5 mm free above it. */
export const VFD_C36 = grown(51.3, 54.3, 8.0, 8.0, 10.0)
/** Two power inductors, 7 mm across, 5 mm tall. */
export const VFD_INDUCTORS = [grown(27.4, 40.2, 7.0, 7.0, 5.0), grown(44.4, 31.3, 7.0, 7.0, 5.0)] as const
/** SW1, the DIP switch (No.6 = ON), about 11 x 6 mm, 4 mm tall. */
export const VFD_SW1 = grown(86.0, 56.6, 11.0, 6.0, 4.0)
/** CN1 JST-XH 7-pin housing, x about 4.4, y 36 to 57, 7 mm tall. */
export const VFD_CN1 = grown(4.4, 46.5, 5.8, 21.0, 7.0)
/** CN4 box header, x 121.7 to 130.2, y 9.3 to 37.2, 9 mm tall (the ribbon socket sits in it). */
export const VFD_CN4 = grown(125.95, 23.25, 8.5, 27.9, 9.0)
/** The bottom-right corner, x 105-131, y 40-60: only empty holes (CN5, X2) and 0603/SOT parts, <= 1.5 mm. */
export const VFD_LOW_CORNER = { x0: 105.0, y0: 40.0, x1: 131.0, y1: 60.0, height: 1.5 + VFD_CLEAR } as const
/** Every other rear part, at most 3 mm: three boxes round the low corner, grown into it by the clearance. */
export const VFD_REAR_3MM = [
  { x0: 0.0, y0: 0.0, x1: VFD_LOW_CORNER.x0 + VFD_CLEAR, y1: 66.0 },
  { x0: VFD_LOW_CORNER.x0, y0: 0.0, x1: 131.0, y1: VFD_LOW_CORNER.y0 + VFD_CLEAR },
  { x0: VFD_LOW_CORNER.x0, y0: VFD_LOW_CORNER.y1 - VFD_CLEAR, x1: 131.0, y1: 66.0 },
].map(b => ({ ...b, height: 3.0 + VFD_CLEAR }))
/** Solder tails of the carrier's top-side THT parts, below its underside. */
export const THT_TAIL = 2.0
/** Header pin tails of the soldered-on breakouts, below the carrier (trim to this). */
export const BREAKOUT_TAIL = 3.0
/** Display glass on the VFD's front face (away from the carrier): glass front to PCB rear 12.9 mm. */
export const VFD_GLASS = { w: 120.0, h: 60.0, height: 12.9 - 1.6 } as const

// ---------------------------------------------------------------- ESP32-S3-WROOM-1 on the carrier
// The bare module (18 x 25.5, lib/esp32s3Wroom1.tsx) sits on the top edge with its antenna end up.
// The antenna hangs over a notch in the board, and Espressif's keep-out (no copper, 15 mm either side
// and beyond the end) covers the rest. The module's own 3V3 comes from U7, an AMS1117 on the carrier.
/** Module centre. Its antenna end is flush with the top edge. */
export const WROOM_AT: readonly [number, number] = [62.0, 12.75]
/** Notch under the antenna: the module width plus 0.5 mm a side, 6 mm deep, inner corners r 1. */
export const ANT_NOTCH = { x0: WROOM_AT[0] - 9.5, x1: WROOM_AT[0] + 9.5, depth: 6.0, r: 1.0 } as const

// ---------------------------------------------------------------- Adafruit STEMMA QT breakouts, soldered on by their headers
// From Adafruit's Eagle boards (Adafruit-SGP40-PCB, Adafruit-SCD-4x-PCB). Both are 25.4 mm long with a
// 1x5 header 2.54 mm in from one long edge: VIN, 3V, GND, SCL, SDA, pin 1 7.62 mm from the left end
// (top view, header at the bottom). Each has 10k pull-ups on SCL/SDA and its own 3.3 V regulator.
export const BREAKOUT_LEN = 25.4
export const BREAKOUT_HDR_EDGE = 2.54
export const BREAKOUT_PIN1_ALONG = 7.62
/** Header plastic: the breakout sits this far above the carrier. */
export const BREAKOUT_GAP = 2.5
/** Adafruit 4829, SGP40 VOC: 25.4 x 17.78. */
export const SGP40_DEPTH = 17.78
/** Adafruit 5190, SCD-41 CO2 / T / RH: 25.4 x 22.86. */
export const SCD41_DEPTH = 22.86
/** C1, Rubycon 16YXJ1000MT810X16: 1000 uF 16 V, D10 x 16 body, 17.5 mm seated max. */
export const C1_HEIGHT = 17.5
