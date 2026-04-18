const EFFICIENCY_THRESHOLD = 3.5; // liters/hour — flag above this

export function computePowerEntry(
  fuelAtStart: number,
  fuelAtStop: number,
  startTime: Date,
  stopTime: Date
) {
  const fuelConsumed = fuelAtStart - fuelAtStop;
  const hoursRun = (stopTime.getTime() - startTime.getTime()) / 3_600_000;
  const litersPerHour = fuelConsumed / hoursRun;

  return {
    fuelConsumed: +fuelConsumed.toFixed(2),
    hoursRun: +hoursRun.toFixed(2),
    litersPerHour: +litersPerHour.toFixed(2),
    flagged: litersPerHour > EFFICIENCY_THRESHOLD ? 'high_consumption' : null,
  };
}