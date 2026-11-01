// A single row of plated holes for a board soldered straight onto the carrier by its own male header
// pins: the Adafruit sensor breakouts (1x5).
// The breakouts come with their headers, so these rows are left out of the BOM and the placement file.
// The 3D view shows the header itself, KiCad's 1x5 vertical male header, plastic on the carrier.
// Frame: pin 1 at the origin, pins down +y, as PinHeader.
import { defineFootprint, type FootprintProps } from '@pcbjs/core'
import { kicadModel } from '@pcbjs/kicad'

const PITCH = 2.54
const PAD = 1.7
const DRILL = 1.0

function rowFootprint(id: string, value: string, pins: number) {
  function RowFootprint({ children, ...rest }: FootprintProps) {
    const pads = []
    for (let n = 1; n <= pins; n++) {
      pads.push(<pad num={n} at={`0 ${(n - 1) * PITCH}`} size={PAD} drill={DRILL} shape={n === 1 ? 'rect' : 'circle'} />)
    }
    const len = (pins - 1) * PITCH
    return (
      <footprint id={id} value={value} bom={false} pos={false} model={{ file: kicadModel(`${'${KICAD10_3DMODEL_DIR}'}/Connector_PinHeader_2.54mm.3dshapes/PinHeader_1x0${pins}_P2.54mm_Vertical.step`) }} {...rest}>
        {pads}
        <rect layer="F.Fab" x={-1.27} y={-1.27} w={2.54} h={len + 2.54} />
        <rect layer="F.CrtYd" x={-1.3} y={-1.3} w={2.6} h={len + 2.6} />
        {children}
      </footprint>
    )
  }
  return defineFootprint(RowFootprint, {
    pins: Array.from({ length: pins }, (_, i) => String(i + 1)),
    prefix: 'J',
    id,
  })
}

/** The 1x5 header of an Adafruit STEMMA QT breakout: VIN, 3V, GND, SCL, SDA. */
export const BreakoutRow = rowFootprint('vfdclock:BreakoutRow_1x05_P2.54mm', 'breakout row', 5)
