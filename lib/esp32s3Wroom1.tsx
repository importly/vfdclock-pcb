// ESP32-S3-WROOM-1 land pattern for hand soldering or reflow. Based on KiCad's
// RF_Module:ESP32-S3-WROOM-1 (KiCad 10, CC-BY-SA 4.0 with the design exception) and Espressif's
// datasheet; same pad centres along each edge, with these changes:
// - every castellated pad is 2.5 mm long instead of 1.5, reaching 1.5 mm past the module so an
//   iron can heat pad and castellation together;
// - the ground pad's 0.2 mm vias (under JLCPCB's 0.3 mm 2-layer minimum) are replaced by a 1.0 mm
//   hole in its centre, to feed solder from the back, and four 0.4 mm vias;
// - silk at 0.15 mm, and none over the antenna, which hangs over the board's notch.
// Frame: origin at the module centre, antenna end at -y (the module is 18 x 25.5).
// Pins: 1-14 down the left side, 15-26 along the bottom, 27-40 up the right side, 41 the ground pad.
import { defineFootprint, type FootprintProps } from '@pcbjs/core'
import { kicadModel } from '@pcbjs/kicad'
import { WROOM_PADS } from './pinout'

const PITCH = 1.27
const PAD_W = 0.9
const PAD_L = 2.5
/** Pad centre from the module centre: KiCad's 8.75 / 12.5, moved 0.5 mm out for the longer pad. */
const SIDE_X = 9.25
const BOTTOM_Y = 13.0
const EP: [number, number] = [-1.5, 2.46]
const EP_SIZE = 3.9

/** Module outline and the antenna area at its -y end, in footprint mm. */
export const WROOM_W = 18.0
export const WROOM_L = 25.5
/** The antenna area: the last 6 mm of the module at the -y end, kept clear of copper. */
export const WROOM_ANTENNA = 6.0

function ESP32S3Wroom1Footprint({ children, ...rest }: FootprintProps) {
  const pads = []
  for (let n = 1; n <= 14; n++) {
    pads.push(<pad num={String(n)} name={WROOM_PADS[n - 1]} at={`${-SIDE_X} ${-5.26 + (n - 1) * PITCH}`} shape="rect" size={[PAD_L, PAD_W]} />)
  }
  for (let n = 15; n <= 26; n++) {
    pads.push(<pad num={String(n)} name={WROOM_PADS[n - 1]} at={`${-6.985 + (n - 15) * PITCH} ${BOTTOM_Y}`} shape="rect" size={[PAD_W, PAD_L]} />)
  }
  for (let n = 27; n <= 40; n++) {
    pads.push(<pad num={String(n)} name={WROOM_PADS[n - 1]} at={`${SIDE_X} ${11.25 - (n - 27) * PITCH}`} shape="rect" size={[PAD_L, PAD_W]} />)
  }
  // ground pad: copper and mask as KiCad, paste in eight squares round the centre hole
  const paste: [number, number][][] = []
  for (const dx of [-1.4, 0, 1.4]) {
    for (const dy of [-1.4, 0, 1.4]) {
      if (dx === 0 && dy === 0) continue
      paste.push([[dx - 0.45, dy - 0.45], [dx + 0.45, dy - 0.45], [dx + 0.45, dy + 0.45], [dx - 0.45, dy + 0.45]])
    }
  }
  const half = WROOM_L / 2
  return (
    <footprint
      id="vfdclock:ESP32-S3-WROOM-1_HandSolder"
      value="ESP32-S3-WROOM-1"
      height={3.1}
      model={{ file: kicadModel('${KICAD10_3DMODEL_DIR}/RF_Module.3dshapes/ESP32-S3-WROOM-1.step') }}
      {...rest}
    >
      {pads}
      <pad num="41" name="GND" at={`${EP[0]} ${EP[1]}`} shape="rect" size={EP_SIZE} paste={paste} thermal="solid" />
      <pad num="41" name="GND" at={`${EP[0]} ${EP[1]}`} shape="circle" size={1.6} drill={1.0} thermal="solid" />
      {[[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].map(([dx, dy]) => (
        <pad num="41" name="GND" at={`${EP[0] + dx} ${EP[1] + dy}`} shape="circle" size={0.8} drill={0.4} thermal="solid" />
      ))}
      {/* pin 1 mark beside pad 1, and the two bottom corners */}
      <path layer="F.SilkS" d="M -9.3 -6.2 L -9.9 -6.2 L -9.3 -6.8 Z" width={0.15} fill />
      <path layer="F.SilkS" d="M -9.2 11.95 L -9.2 12.95 L -7.8 12.95" width={0.15} />
      <path layer="F.SilkS" d="M 9.2 11.95 L 9.2 12.95 L 7.8 12.95" width={0.15} />
      <path layer="F.Fab" d={`M -9 -${half} H 9 V ${half} H -9 Z`} width={0.1} />
      <path layer="F.Fab" d={`M -9 ${-half + WROOM_ANTENNA} H 9`} width={0.1} />
      <path layer="F.CrtYd" d={`M -10.75 -${half + 0.25} H 10.75 V ${BOTTOM_Y + PAD_L / 2 + 0.25} H -10.75 Z`} width={0.05} />
      {/* Espressif's keep-out round the antenna: 15 mm past each side and 15 mm beyond its end */}
      <keepout layers={['F.Cu', 'B.Cu']} d={`M -24 ${-half + WROOM_ANTENNA} L 24 ${-half + WROOM_ANTENNA} L 24 -27.75 L -24 -27.75 Z`} />
      {children}
    </footprint>
  )
}

/** The module, pins by name (lib/pinout.ts WROOM_PADS); GND is pads 1, 40 and 41. */
export const ESP32S3Wroom1 = defineFootprint(ESP32S3Wroom1Footprint, {
  pins: [...new Set(WROOM_PADS)],
  prefix: 'U',
  id: 'vfdclock:ESP32-S3-WROOM-1_HandSolder',
})
