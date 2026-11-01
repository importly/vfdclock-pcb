// Mechanical reference of an Adafruit STEMMA QT breakout, for the carrier's reference() mate.
// Used by refs/sgp40 and refs/scd41; never ordered.
// Frame: the breakout's top view turned 90 deg clockwise, so its header runs down +y from pin 1:
// u (x) is the distance from the header edge, v (y) is the distance from the board's left end.
import PCB, { nets, type FootprintProps } from '@pcbjs/core'
import { MountingHole, PinHeader, rect } from '@pcbjs/lib'
import { BREAKOUT_GAP, BREAKOUT_HDR_EDGE, BREAKOUT_LEN, BREAKOUT_PIN1_ALONG } from './frame'

/** A body with no pads: a Fab box the reference collision check and the 3D view use. */
function BodyFootprint({ children, w, h, ...rest }: FootprintProps & { w: number; h: number }) {
  return (
    <footprint id="ref:Body" {...rest}>
      <rect layer="F.Fab" x={-w / 2} y={-h / 2} w={w} h={h} />
      {children}
    </footprint>
  )
}

/** A part on the breakout's top: centre (u, v), size w (along u) x h (along v), height. */
export type BreakoutBody = { ref: string; value: string; u: number; v: number; w: number; h: number; height: number }

export function breakoutBoard(o: { name: string; depth: number; holeD: number; holeU: readonly number[]; bodies: readonly BreakoutBody[] }) {
  const N = nets()
  // Header on the bottom side, pins going down from pin 1 (VIN). The 3V output pin is left open.
  const J1 = PinHeader(5, { value: 'header 1x5', silk: 'none' }).connect({ 1: N.VIN, 2: N.V3, 3: N.GND, 4: N.SCL, 5: N.SDA })
  const Hole = MountingHole(o.holeD)
  const holes = o.holeU.flatMap(u => [[u, 2.54], [u, BREAKOUT_LEN - 2.54]] as const)
  return (
    <PCB name={o.name} revision="adafruit" silkRefs={false}>
      <path layer="Edge.Cuts" d={rect(o.depth, BREAKOUT_LEN)} />
      {holes.map(([u, v], i) => <Hole ref={`H${i + 1}`} at={`${u} ${v}`} />)}
      <J1 at={`${BREAKOUT_HDR_EDGE} ${BREAKOUT_PIN1_ALONG}`} side="B" height={BREAKOUT_GAP} />
      {o.bodies.map(b => <BodyFootprint ref={b.ref} value={b.value} at={`${b.u} ${b.v}`} w={b.w} h={b.h} height={b.height} />)}
    </PCB>
  )
}
