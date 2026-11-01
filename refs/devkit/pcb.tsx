// devkit: mechanical-only reference of the ESP32-S3-DevKitC-1 (v1.1, N16R8; USB-C clones alike),
// for the carrier's reference() mate. Never ordered: it is not in pcb.config.ts entries.
// Frame: mm, top view with the antenna end up, origin at the top-left corner, x right, y down.
// Devkit J1 on the left, J3 on the right, both as 1 x 22 male headers on the bottom side,
// pin 1 at the antenna end. Nets are named by GPIO.
import PCB, { nets, route, type FootprintProps } from '@pcbjs/core'
import { PinHeader } from '@pcbjs/lib'
import {
  ANTENNA_OVERHANG, DEVKIT_CHAMFER, DEVKIT_EDGE_TO_ROW, DEVKIT_LEN, DEVKIT_PIN1_FROM_USB, DEVKIT_PINS,
  DEVKIT_ROW, DEVKIT_W, MODULE_LEN, MODULE_W, USB_C_X,
} from '../../lib/frame'
import { DEVKIT_J1, DEVKIT_J3 } from '../../lib/pinout'

const N = nets()
const byPin = (names: readonly string[]) => Object.fromEntries(names.map((n, i) => [i + 1, N[n]]))

// The two header rows, on the bottom side, pins going down from pin 1 at the antenna end.
const J1 = PinHeader(DEVKIT_PINS, { value: 'devkit J1', silk: 'none' }).connect(byPin(DEVKIT_J1))
const J3 = PinHeader(DEVKIT_PINS, { value: 'devkit J3', silk: 'none' }).connect(byPin(DEVKIT_J3))
const PIN1_Y = DEVKIT_LEN - DEVKIT_PIN1_FROM_USB

/** A body with no pads: a Fab box the reference collision check and the 3D view use. */
function BodyFootprint({ children, w, h, ...rest }: FootprintProps & { w: number; h: number }) {
  return (
    <footprint id="ref:Body" {...rest}>
      <rect layer="F.Fab" x={-w / 2} y={-h / 2} w={w} h={h} />
      {children}
    </footprint>
  )
}

const c = DEVKIT_CHAMFER
const W = DEVKIT_W
const L = DEVKIT_LEN
const OUTLINE = `M ${c} 0 H ${W - c} L ${W} ${c} V ${L - c} L ${W - c} ${L} H ${c} L 0 ${L - c} V ${c} Z`
const USB_W = 8.94
const USB_D = 7.35

export default (
  <PCB name="devkit" revision="1.1" silkRefs={false}>
    <path layer="Edge.Cuts" d={OUTLINE} />
    {/* height: the 2.5 mm header plastic; the pins go on through the carrier (its tail bodies) */}
    <J1 at={`${DEVKIT_EDGE_TO_ROW} ${PIN1_Y}`} side="B" height={2.5} />
    <J3 at={`${DEVKIT_EDGE_TO_ROW + DEVKIT_ROW} ${PIN1_Y}`} side="B" height={2.5} />

    {/* WROOM-1 module on top, its antenna overhanging the antenna-end edge */}
    <BodyFootprint ref="U1" value="ESP32-S3-WROOM-1" at={`${W / 2} ${MODULE_LEN / 2 - ANTENNA_OVERHANG}`} w={MODULE_W} h={MODULE_LEN} height={3.2} />
    {/* two USB-C receptacles at the USB end */}
    {USB_C_X.map((x, i) => (
      <BodyFootprint ref={`J${10 + i}`} value="USB-C" at={`${x} ${L - USB_D / 2 + 0.5}`} w={USB_W} h={USB_D} height={3.2} />
    ))}

    {/* the devkit's own copper joins its 3V3 pins and its GND pins */}
    {route(J1[1]).Z(J1[2]).width(0.5)}
    {route(J3[21]).Z(J3[22]).width(0.5)}
    {route(J1[22]).V(L - 2).H(DEVKIT_EDGE_TO_ROW + DEVKIT_ROW).Z(J3[22]).width(0.5)}
    {route(J3[1]).h(-2.5).V(L - 6).h(2.5).Z(J3[21]).width(0.5)}

    <text layer="F.SilkS" at={`${W / 2} ${L - 12}`} size={1.2}>ESP32-S3-DevKitC-1</text>
  </PCB>
)
