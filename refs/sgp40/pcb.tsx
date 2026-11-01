// sgp40: mechanical-only reference of the Adafruit SGP40 breakout (product 4829), 25.4 x 17.78,
// for the carrier's reference() mate. Never ordered: it is not in pcb.config.ts entries.
// Positions from Adafruit's Eagle board (github.com/adafruit/Adafruit-SGP40-PCB); frame in lib/breakoutRef.tsx.
import { breakoutBoard } from '../../lib/breakoutRef'
import { SGP40_DEPTH } from '../../lib/frame'

export default breakoutBoard({
  name: 'sgp40',
  depth: SGP40_DEPTH,
  holeD: 2.5,
  holeU: [2.54, 15.24],
  bodies: [
    { ref: 'U1', value: 'SGP40', u: 8.89, v: 12.7, w: 2.44, h: 2.44, height: 0.9 },
    { ref: 'J2', value: 'STEMMA QT', u: 8.89, v: 2.54, w: 6.0, h: 4.25, height: 2.95 },
    { ref: 'J3', value: 'STEMMA QT', u: 8.89, v: 22.86, w: 6.0, h: 4.25, height: 2.95 },
  ],
})
