import type { KmReading, CalculatedKm } from '../types'

export function calculateKm(readings: KmReading): CalculatedKm {
  const { leaveHome, arriveFirstClient, arriveLastClient, arriveHome } = readings

  const totaal =
    leaveHome != null && arriveHome != null ? arriveHome - leaveHome : null

  const beroepsmatig =
    arriveFirstClient != null && arriveLastClient != null
      ? arriveLastClient - arriveFirstClient
      : null

  return { totaal, beroepsmatig }
}

export function isEntryComplete(readings: KmReading): boolean {
  return (
    readings.leaveHome != null &&
    readings.arriveFirstClient != null &&
    readings.arriveLastClient != null &&
    readings.arriveHome != null
  )
}

export function isEntryPartial(readings: KmReading): boolean {
  return (
    !isEntryComplete(readings) &&
    (readings.leaveHome != null ||
      readings.arriveFirstClient != null ||
      readings.arriveLastClient != null ||
      readings.arriveHome != null)
  )
}
