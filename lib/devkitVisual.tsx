// What the 3D view shows of the ESP32-S3-DevKitC-1 on the carrier. The viewer blends a reference
// board's parts half-way into one tint colour, so refs/devkit keeps the mate and net checks and these
// carrier footprints draw the devkit in its own colours. Every footprint here is model-only:
// padless, so no pads, silk ref, BOM or placement entry, and height 0, so no collision body.
// The bare board is models/devkit-esp32s3-devkitc1.wrl; the parts are KiCad models of the same
// packages, placed from the owner's photo of the board (distance from the antenna end and from the
// J3 edge). The header pins are the DevkitRow footprints' own models.
import { kicadModel } from '@pcbjs/kicad'
import { DEVKIT_GAP, DEVKIT_LEN, DEVKIT_W, DEVKIT_X, DEVKIT_Y, MODULE_LEN, ANTENNA_OVERHANG, USB_C_X } from './frame'

/** The devkit's top face, from the carrier's top face. */
const Z = DEVKIT_GAP + 1.6
const kicad = (path: string) => ({ file: kicadModel(`${'${KICAD10_3DMODEL_DIR}'}/${path}`), offset: [0, 0, Z] as [number, number, number] })
/** Carrier position of a point dA from the devkit's antenna end and d3 from its J3 edge. */
const at = (dA: number, d3: number, rot = 0) => `${DEVKIT_X + DEVKIT_LEN - dA} ${DEVKIT_Y + DEVKIT_W - d3} ${rot}deg`

const PARTS: [string, string, ReturnType<typeof kicad>][] = [
  // the WROOM-1 module, antenna (its -y) turned to point right, overhanging the antenna end
  ['module', at(MODULE_LEN / 2 - ANTENNA_OVERHANG, DEVKIT_W / 2, 270), kicad('RF_Module.3dshapes/ESP32-S3-WROOM-1.step')],
  // the two USB-C ports at the USB end, mouths out of the carrier's left edge
  ['usb-uart', `${DEVKIT_X + 3.1} ${DEVKIT_Y + USB_C_X[0]} 270deg`, kicad('Connector_USB.3dshapes/USB_C_Receptacle_GCT_USB4105-xx-A_16P_TopMnt_Horizontal.step')],
  ['usb-otg', `${DEVKIT_X + 3.1} ${DEVKIT_Y + USB_C_X[1]} 270deg`, kicad('Connector_USB.3dshapes/USB_C_Receptacle_GCT_USB4105-xx-A_16P_TopMnt_Horizontal.step')],
  ['ldo', at(25.6, 12.3, 270), kicad('Package_TO_SOT_SMD.3dshapes/SOT-223.step')],
  ['usb-serial', at(41.6, 13.9), kicad('Package_DFN_QFN.3dshapes/QFN-28-1EP_5x5mm_P0.5mm_EP3.35x3.35mm.step')],
  ['rgb-led', at(33.3, 18.5), kicad('LED_SMD.3dshapes/LED_WS2812B_PLCC4_5.0x5.0mm_P3.2mm.step')],
  ['reset', at(48.0, 8.3, 90), kicad('Button_Switch_SMD.3dshapes/SW_SPST_TL3342.step')],
  ['boot', at(48.0, 18.6, 90), kicad('Button_Switch_SMD.3dshapes/SW_SPST_TL3342.step')],
]

/** The devkit, as model-only footprints on the carrier. */
export const DEVKIT_VISUAL = [
  <footprint id="devkit:visual-board" ref="W0" at="0 0" height={0} bom={false} pos={false} model={{ file: '../models/devkit-esp32s3-devkitc1.wrl' }} />,
  ...PARTS.map(([name, place, model], i) => (
    <footprint id={`devkit:visual-${name}`} ref={`W${i + 1}`} value={`devkit ${name}`} at={place} height={0} bom={false} pos={false} model={model} />
  )),
]
