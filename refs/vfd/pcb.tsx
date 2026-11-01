// vfd: mechanical-only reference of the Noritake GU256X128C-3900 module, for the carrier's
// reference() stack. Never ordered: it is not in pcb.config.ts entries.
// Frame: mm, the VFD seen from its rear (component side), origin top-left, the 14 I/O holes on the
// top edge; this board's top face is the VFD's rear, the glass is on its bottom (front) face.
// Data: DS-1604-0001-02, DS-903-0001-00; rear part positions from the user's photo, +-2 mm.
// Every rear body is grown by that tolerance plus 1.5 mm clearance (lib/frame.ts), so a clean
// reference-collision on the carrier means >= 1.5 mm from every carrier underside body.
import PCB, { nets, route, type FootprintProps } from '@pcbjs/core'
import { JST_XH, MountingHole, PinHeader, rect } from '@pcbjs/lib'
import { kicadModel } from '@pcbjs/kicad'
import {
  BOARD_H, BOARD_W, CN1_AT, CN4_PIN1, HOLES, IDC_PITCH, VFD_C36, VFD_CN1, VFD_CN4, VFD_GLASS, VFD_HOLE_D,
  VFD_INDUCTORS, VFD_LOW_CORNER, VFD_REAR_3MM, VFD_SW1, VFD_THICKNESS,
} from '../../lib/frame'
import { CN4 } from '../../lib/pinout'

const N = nets()

// CN4: IRISO IMSA-9032B-16P box header, odd pins in the column nearer the board centre (-x),
// pin 1 at the I/O-edge end, key slot facing the board centre. Nets as the carrier's J2.
// Drawn with KiCad's shrouded 2x8 box header, the same shape as the IRISO part.
const J4 = PinHeader(8, {
  rows: 2, pitch: IDC_PITCH, value: 'CN4 IMSA-9032B-16P', silk: 'none',
  model: { file: kicadModel('${KICAD10_3DMODEL_DIR}/Connector_IDC.3dshapes/IDC-Header_2x08_P2.54mm_Vertical.step') },
})
  .ref('CN4')
  .connect(Object.fromEntries(CN4.map((n, i) => [i + 1, N[n]])))
// CN1: JST B7B-XH-A, serial + 5 V, unused by the carrier.
const J1 = JST_XH(7, { value: 'CN1 B7B-XH-A', silk: 'none' }).ref('CN1')
  .connect(Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map(p => [p, N[`CN1_${p}`]])))
const Hole = MountingHole(VFD_HOLE_D)

/** A body with no pads, centred on at: a Fab box at a height, for the reference collision check and the 3D view. */
function BodyFootprint({ children, w, h, ...rest }: FootprintProps & { w: number; h: number }) {
  return (
    <footprint id="ref:Body" {...rest}>
      <rect layer="F.Fab" x={-w / 2} y={-h / 2} w={w} h={h} />
      {children}
    </footprint>
  )
}
type Box = { x: number; y: number; w: number; h: number; height: number }
const Body = ({ id, value, b }: { id: string; value: string; b: Box }) => (
  <BodyFootprint ref={id} value={value} at={`${b.x} ${b.y}`} w={b.w} h={b.h} height={b.height} />
)

type Rect = { x0: number; y0: number; x1: number; y1: number; height: number }
const Block = ({ id, value, r }: { id: string; value: string; r: Rect }) => (
  <BodyFootprint ref={id} value={value} at={`${(r.x0 + r.x1) / 2} ${(r.y0 + r.y1) / 2}`} w={r.x1 - r.x0} h={r.y1 - r.y0} height={r.height} />
)

export default (
  <PCB name="vfd" revision="GU256X128C-3900" silkRefs={false} thickness={VFD_THICKNESS}>
    <path layer="Edge.Cuts" d={rect(BOARD_W, BOARD_H)} />
    {HOLES.map(([x, y], i) => <Hole ref={`H${i + 1}`} at={`${x} ${y}`} />)}

    <J4 at={`${CN4_PIN1[0]} ${CN4_PIN1[1]}`} height={VFD_CN4.height} />
    <J1 at={`${CN1_AT[0]} ${CN1_AT[1]} 90deg`} height={VFD_CN1.height} />

    {/* rear parts, each grown by the photo tolerance and the clearance */}
    <Body id="C36" value="C36 electrolytic" b={VFD_C36} />
    {VFD_INDUCTORS.map((b, i) => <Body id={`L${i + 1}`} value="power inductor" b={b} />)}
    <Body id="SW1" value="SW1 DIP switch" b={VFD_SW1} />
    <Body id="X4" value="CN1 housing" b={VFD_CN1} />
    <Body id="X5" value="CN4 shroud" b={VFD_CN4} />
    {/* everything else: <= 3 mm, except the bottom-right corner, which holds only <= 1.5 mm parts */}
    {VFD_REAR_3MM.map((r, i) => <Block id={`X${10 + i}`} value="VFD rear parts <= 3 mm" r={r} />)}
    <Block id="X6" value="VFD low corner <= 1.5 mm" r={VFD_LOW_CORNER} />
    {/* the display glass on the front face, the side away from the carrier */}
    <BodyFootprint ref="X3" value="VFD glass" side="B" at={`${BOARD_W / 2} ${BOARD_H / 2}`} w={VFD_GLASS.w} h={VFD_GLASS.h} height={VFD_GLASS.height} />

    {/* the VFD's own copper joins CN4's GND pins and its V5 pins */}
    {route(J4[9]).Z(J4[11]).width(0.3)}
    {route(J4[11]).Z(J4[13]).width(0.3)}
    {route(J4[13]).Z(J4[14]).width(0.3)}
    {route(J4[15]).Z(J4[16]).width(0.3)}

    <text layer="F.SilkS" at={`${BOARD_W / 2} ${BOARD_H - 3}`} size={1.5}>GU256X128C-3900 rear</text>
  </PCB>
)
