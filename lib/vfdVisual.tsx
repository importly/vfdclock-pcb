// What the 3D view shows of the Noritake GU256X128C-3900 under the carrier. The viewer blends a
// reference board's parts half-way into one tint colour, so refs/vfd keeps the mechanical job (the
// collision bodies, the outline) and these carrier footprints draw the display in its own colours.
// Every footprint here is model-only: padless, so no pads, silk ref, BOM or placement entry, and
// height 0, so no collision body. They sit at the VFD's real place, 15 mm under the carrier.
// The board, glass, dot area, small ICs and labels are models/vfd-gu256x128c-3900.wrl, written by
// a script from the same numbers; the parts the rear photo shows are KiCad models of the packages.
import { kicadModel } from '@pcbjs/kicad'
import { CN1_AT, CN4_PIN1, STANDOFF_LEN, VFD_PARTS as P, VFD_THICKNESS } from './frame'

/** The VFD's rear (component) face, from the carrier's top face. */
const Z = -(VFD_THICKNESS + STANDOFF_LEN)
const kicad = (path: string, rotate = 0) => ({ file: kicadModel(`${'${KICAD10_3DMODEL_DIR}'}/${path}`), rotate: [0, 0, rotate] as [number, number, number], offset: [0, 0, Z] as [number, number, number] })

const PARTS: [string, readonly number[], ReturnType<typeof kicad>][] = [
  ['IC6', P.IC6, kicad('Package_QFP.3dshapes/LQFP-128_14x20mm_P0.5mm.step')],
  ['IC7', P.IC7, kicad('Package_SO.3dshapes/TSOP-I-48_18.4x12mm_P0.5mm.step', 90)],
  ['IC1', P.IC1, kicad('Package_SO.3dshapes/SOIC-16_3.9x9.9mm_P1.27mm.step', 90)],
  ['IC2', P.IC2, kicad('Package_SO.3dshapes/SOIC-8_3.9x4.9mm_P1.27mm.step', 90)],
  ['IC5', P.IC5, kicad('Package_SO.3dshapes/SOIC-8_3.9x4.9mm_P1.27mm.step')],
  ['X1', P.X1, kicad('Crystal.3dshapes/Crystal_SMD_3225-4Pin_3.2x2.5mm.step')],
  ['L1', P.L1, kicad('Inductor_SMD.3dshapes/L_TDK_SLF7045.step')],
  ['L3', P.L3, kicad('Inductor_SMD.3dshapes/L_TDK_SLF7045.step')],
  ['L2', P.L2, kicad('Inductor_SMD.3dshapes/L_Bourns-SRN4018.step')],
  ['C36', P.C36, kicad('Capacitor_SMD.3dshapes/CP_Elec_8x10.step')],
  ['SW1', P.SW1, kicad('Button_Switch_SMD.3dshapes/SW_DIP_SPSTx08_Slide_KingTek_DSHP08TS_W7.62mm_P1.27mm.step', 90)],
  // CN4: KiCad's shrouded 2x8 box header, its origin on pin 1 as CN4_PIN1
  ['CN4', CN4_PIN1, kicad('Connector_IDC.3dshapes/IDC-Header_2x08_P2.54mm_Vertical.step')],
  // CN1: JST B7B-XH-A, its origin on pin 1, the row running down the left edge
  ['CN1', [CN1_AT[0], CN1_AT[1] - 7.5], kicad('Connector_JST.3dshapes/JST_XH_B7B-XH-A_1x07_P2.50mm_Vertical.step', 90)],
]

/** The display, as model-only footprints on the carrier. */
export const VFD_VISUAL = [
  <footprint id="vfd:visual-board" ref="V0" at="0 0" height={0} bom={false} pos={false} model={{ file: '../models/vfd-gu256x128c-3900.wrl' }} />,
  ...PARTS.map(([name, at, model], i) => (
    <footprint id={`vfd:visual-${name}`} ref={`V${i + 1}`} value={`VFD ${name}`} at={`${at[0]} ${at[1]}`} height={0} bom={false} pos={false} model={model} />
  )),
]
