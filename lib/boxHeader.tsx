// J2: XFCN BH254VS-16P, a keyed 2 x 8 2.54 mm SMD box header, LCSC C19190396, placed by JLCPCB.
// Land pattern from the XFCN drawing (BH254VS-xxP, rev A1, 2024-07-19): 1.1 x 4.0 mm pads, 2.54 mm
// pitch, 10.5 mm across the two rows; leads 9.5 mm tip to tip; body 27.97 x 8.9 mm.
// Frame: JLCPCB's own library footprint for C19190396 (EasyEDA IDC-SMD_16P-P2.54_3020-16-0300-00),
// so the rotation in cpl.csv is the rotation JLCPCB places at: origin at the body centre, the long
// axis along x, pin 1 at -x, odd pins along +y with the key slot on that side, even pins along -y.
// Placed at 270deg, it stands like KiCad's IDC-Header_2x08 SMD: pin 1 at the top, odd pins and key at -x.
import { defineFootprint, type FootprintProps } from '@pcbjs/core'
import { kicadModel } from '@pcbjs/kicad'

const PITCH = 2.54
const PAD_W = 1.1
const PAD_L = 4.0
/** Pad centre from the body centre, across the rows: (10.5 - 4.0) / 2. */
export const BOX_ROW = 3.25
const BODY_L = 27.97
const BODY_W = 8.9
const HEIGHT = 9.05
const KEY_W = 4.5

function BoxHeader2x08Footprint({ children, ...rest }: FootprintProps) {
  const pads = []
  for (let n = 1; n <= 16; n++) {
    const x = (Math.floor((n - 1) / 2) - 3.5) * PITCH
    pads.push(<pad num={String(n)} at={`${x} ${n % 2 ? BOX_ROW : -BOX_ROW}`} shape="rect" size={[PAD_W, PAD_L]} />)
  }
  const hl = BODY_L / 2
  const hw = BODY_W / 2
  const cx = hl + 0.25
  const cy = BOX_ROW + PAD_L / 2 + 0.25
  return (
    <footprint id="vfdclock:BoxHeader_XFCN_BH254VS-16P" value="BH254VS-16P" height={HEIGHT}
      // KiCad's SMD IDC header model stands along y with its key gap in the -x wall (x -4.5 to -3.2,
      // y +-2.2 in its STEP), turned counter-clockwise into this frame. A model's rotate runs clockwise
      // as in KiCad, so -90.
      model={{ file: kicadModel('${KICAD10_3DMODEL_DIR}/Connector_IDC.3dshapes/IDC-Header_2x08_P2.54mm_Vertical_SMD.step'), rotate: [0, 0, -90] }} {...rest}>
      {pads}
      <path layer="F.Fab" d={`M ${-hl} ${-hw} H ${hl} V ${hw} H ${KEY_W / 2} V ${hw - 1} H ${-KEY_W / 2} V ${hw} H ${-hl} Z`} width={0.1} />
      <rect layer="F.CrtYd" x={-cx} y={-cy} w={2 * cx} h={2 * cy} />
      {children}
    </footprint>
  )
}

export const BoxHeader2x08 = defineFootprint(BoxHeader2x08Footprint, {
  pins: Array.from({ length: 16 }, (_, i) => String(i + 1)),
  prefix: 'J',
  id: 'vfdclock:BoxHeader_XFCN_BH254VS-16P',
})
