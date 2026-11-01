// scd41: mechanical-only reference of the Adafruit SCD-41 breakout (product 5190), 25.4 x 22.86,
// for the carrier's reference() mate. Never ordered: it is not in pcb.config.ts entries.
// Positions from Adafruit's Eagle board (github.com/adafruit/Adafruit-SCD-4x-PCB); frame in lib/breakoutRef.tsx.
import { breakoutBoard } from '../../lib/breakoutRef'
import { SCD41_DEPTH } from '../../lib/frame'

export default breakoutBoard({
  name: 'scd41',
  depth: SCD41_DEPTH,
  holeD: 3.0,
  holeU: [2.54, 20.32],
  bodies: [
    { ref: 'U1', value: 'SCD41', u: 12.192, v: 12.7, w: 10.1, h: 10.1, height: 6.5 },
    { ref: 'J2', value: 'STEMMA QT', u: 11.43, v: 2.54, w: 6.0, h: 4.25, height: 2.95 },
    { ref: 'J3', value: 'STEMMA QT', u: 11.43, v: 22.86, w: 6.0, h: 4.25, height: 2.95 },
  ],
})
