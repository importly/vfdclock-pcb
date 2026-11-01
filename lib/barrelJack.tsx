// SparkFun PRT-10811 "DC Barrel Jack Adapter - Breadboard Compatible": a 4UCON 18742 right-angle
// 5.5/2.1 mm jack, 20 V 4 A, centre positive in use here. Land pattern from the 4UCON drawing 18742
// (cdn.sparkfun.com/datasheets/Prototyping/18742.pdf), matching SparkFun's POWER_JACK_PTH_BREAD to 0.1 mm.
// Round 1.3 mm holes as SparkFun's footprint, which take the 1.6 x 1.0 flat pins.
// Frame: origin at the body centre, the mouth facing +x; the front face is 13.6 mm from pad 1 (centre pin).
import { defineFootprint, type FootprintProps } from '@pcbjs/core'

const LEN = 14.5
const HALF_W = 4.5
const HEIGHT = 10.7
/** Front face of the jack from the body centre, along +x. */
export const JACK_FRONT = LEN / 2
/** Pad 1 (centre pin) from the body centre: 13.6 mm behind the front face. */
const P1 = JACK_FRONT - 13.6
const BACK = -LEN / 2
const PAD = 2.4
const DRILL = 1.3

function BarrelJack10811Footprint({ children, ...rest }: FootprintProps) {
  return (
    <footprint id="vfdclock:BarrelJack_SparkFun_PRT-10811" value="DC jack 5.5/2.1" height={HEIGHT}
      model={{ kind: 'ic', w: LEN, h: 2 * HALF_W, height: HEIGHT, color: '#1c1c1c' }} {...rest}>
      {/* 1: centre pin (+), 2: sleeve (tip spring), 3: switch, closed to 2 with no plug */}
      <pad num="1" at={`${P1} 0`} shape="rect" size={PAD} drill={DRILL} />
      <pad num="2" at={`${JACK_FRONT - 7.8} 0`} shape="circle" size={PAD} drill={DRILL} />
      <pad num="3" at={`${JACK_FRONT - 10.6} -4.8`} shape="circle" size={PAD} drill={DRILL} />
      <rect layer="F.Fab" x={BACK} y={-HALF_W} w={JACK_FRONT - BACK} h={2 * HALF_W} />
      <rect layer="F.CrtYd" x={BACK - 0.3} y={-HALF_W - 0.3} w={JACK_FRONT - BACK + 0.6} h={2 * HALF_W + 0.6} />
      <path layer="F.SilkS" d={`M ${BACK - 0.15} -2.2 V ${-HALF_W - 0.15} H ${P1 + 1.3}`} width={0.15} />
      <path layer="F.SilkS" d={`M ${BACK - 0.15} 1.5 V ${HALF_W + 0.15} H ${JACK_FRONT - 1.2}`} width={0.15} />
      {children}
    </footprint>
  )
}

export const BarrelJack10811 = defineFootprint(BarrelJack10811Footprint, {
  pins: ['1', '2', '3'],
  prefix: 'J',
  id: 'vfdclock:BarrelJack_SparkFun_PRT-10811',
})
