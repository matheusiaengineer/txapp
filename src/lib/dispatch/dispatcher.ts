import { eventBus } from "../events/bus";
import { mobilityEngine, Coordinates } from "../mobility/engine";
import { aiService } from "../ai/ai-service";
import { globalConfig } from "../config/global-config";

export interface DriverCandidate {
  driverId: string;
  lat: number;
  lng: number;
  rating: number;
  acceptanceRate: number;
  cancellationRate: number;
  onlineTimeHours: number;
  tripsCompleted: number;
  vehicleTypeId: string;
  batteryLevel: number;
  gpsAccuracy: number;
  lastTripEndedAt?: Date;
  isFavorite?: boolean;
  spokeWithPassenger?: boolean;
}

export interface DispatchScoreFactors {
  distance: number;
  eta: number;
  rating: number;
  acceptance: number;
  cancellation: number;
  history: number;
  vehicleMatch: number;
  battery: number;
  gpsQuality: number;
  idleTime: number;
}

interface ScoreWeights {
  distance: number;
  eta: number;
  rating: number;
  acceptance: number;
  cancellation: number;
  history: number;
  vehicleMatch: number;
  battery: number;
  gpsQuality: number;
  idleTime: number;
}

const DEFAULT_WEIGHTS: ScoreWeights = {
  distance: 20,
  eta: 15,
  rating: 15,
  acceptance: 10,
  cancellation: 8,
  history: 8,
  vehicleMatch: 10,
  battery: 5,
  gpsQuality: 4,
  idleTime: 5,
};

const MAX_DIST_METERS = 5000;
const MAX_ETA_SECONDS = 600;
const MAX_BATTERY = 100;
const MAX_GPS_ACCURACY = 50;
const MAX_IDLE_HOURS = 8;

export class ScoreDispatch3 {
  private weights: ScoreWeights;

  constructor(customWeights?: Partial<ScoreWeights>, private cityId?: string) {
    this.weights = { ...DEFAULT_WEIGHTS, ...customWeights };
  }

  async requestTrip(
    tripId: string,
    origin: Coordinates,
    requiredCategoryId: string,
    passengerId: string,
    destination?: Coordinates,
  ) {
    console.log(`[SCORE DISPATCH 3.0] Matching para Trip: ${tripId}`);

    eventBus.emit("trip.search.started", { tripId });

    const isFraud = false;
    if (isFraud) {
      eventBus.emit("trip.cancelled", { tripId, reason: "FRAUD_DETECTED" });
      return;
    }

    const candidates = await this.findAvailableDrivers(origin, requiredCategoryId);

    if (candidates.length === 0) {
      console.log(`[SCORE DISPATCH 3.0] Nenhum motorista disponível para Trip: ${tripId}`);
      eventBus.emit("trip.cancelled", { tripId, reason: "NO_DRIVER_FOUND" });
      return;
    }

    const aiRecommendations = await aiService.recommendDriver(passengerId, origin, requiredCategoryId);

    const scoredCandidates = await Promise.all(
      candidates.map(async (driver) => {
        const routeInfo = await mobilityEngine.calculateRoute(origin, { lat: driver.lat, lng: driver.lng });
        const factors = await this.calculateFactors(origin, driver, routeInfo);
        const score = this.computeScore(factors);
        const aiBoost = aiRecommendations.find(r => r.driverId === driver.driverId);
        const finalScore = score * (aiBoost ? aiBoost.score : 1);

        const etaMinutes = Math.round(routeInfo.duration_seconds / 60);
        const distanceKm = Math.round(routeInfo.distance_meters / 100) / 10;

        const cancelRisk = await aiService.predictCancelRisk(driver.driverId, {
          distanceKm, durationMin: etaMinutes, hour: new Date().getHours(),
          isWeekend: [0, 6].includes(new Date().getDay()),
          driverRating: driver.rating, driverCancellationRate: driver.cancellationRate,
          driverAcceptanceRate: driver.acceptanceRate,
          pickup: origin, dropoff: destination,
        });

        return {
          driverId: driver.driverId,
          score: Math.round(finalScore * 100) / 100,
          factors,
          etaMinutes,
          distanceKm: Math.round(routeInfo.distance_meters),
          cancelRisk,
          metrics: {
            rating: driver.rating,
            acceptanceRate: driver.acceptanceRate,
            cancellationRate: driver.cancellationRate,
            batteryLevel: driver.batteryLevel,
            gpsAccuracy: driver.gpsAccuracy,
            onlineHours: driver.onlineTimeHours,
            tripsCompleted: driver.tripsCompleted,
          },
        };
      })
    );

    scoredCandidates.sort((a, b) => {
      const cancelDiff = (a.cancelRisk.probability - b.cancelRisk.probability);
      if (Math.abs(cancelDiff) > 0.3) return a.cancelRisk.probability - b.cancelRisk.probability;
      return b.score - a.score;
    });

    const topCandidates = scoredCandidates.slice(0, 5);
    await this.batchOffer(tripId, topCandidates);
  }

  private async calculateFactors(
    origin: Coordinates,
    driver: DriverCandidate,
    routeInfo: { distance_meters: number; duration_seconds: number; polyline: string },
  ): Promise<DispatchScoreFactors> {
    const distMeters = routeInfo.distance_meters;
    const etaSeconds = routeInfo.duration_seconds;

    const distanceScore = Math.max(0, 1 - distMeters / MAX_DIST_METERS);
    const etaScore = Math.max(0, 1 - etaSeconds / MAX_ETA_SECONDS);
    const ratingScore = driver.rating / 5;
    const acceptanceScore = driver.acceptanceRate / 100;
    const cancellationScore = 1 - (driver.cancellationRate / 100);
    const historyScore = Math.min(driver.tripsCompleted / 500, 1);
    const vehicleMatch = 1;
    const batteryScore = driver.batteryLevel / MAX_BATTERY;
    const gpsScore = Math.max(0, 1 - driver.gpsAccuracy / MAX_GPS_ACCURACY);
    const idleScore = Math.min(driver.onlineTimeHours / MAX_IDLE_HOURS, 1);

    return {
      distance: distanceScore,
      eta: etaScore,
      rating: ratingScore,
      acceptance: acceptanceScore,
      cancellation: cancellationScore,
      history: historyScore,
      vehicleMatch,
      battery: batteryScore,
      gpsQuality: gpsScore,
      idleTime: idleScore,
    };
  }

  private computeScore(factors: DispatchScoreFactors): number {
    return (
      factors.distance * this.weights.distance +
      factors.eta * this.weights.eta +
      factors.rating * this.weights.rating +
      factors.acceptance * this.weights.acceptance +
      factors.cancellation * this.weights.cancellation +
      factors.history * this.weights.history +
      factors.vehicleMatch * this.weights.vehicleMatch +
      factors.battery * this.weights.battery +
      factors.gpsQuality * this.weights.gpsQuality +
      factors.idleTime * this.weights.idleTime
    ) / 100;
  }

  private async batchOffer(tripId: string, candidates: any[]) {
    const batch = candidates.slice(0, 3);
    const promises = batch.map((driver) =>
      this.offerToDriver(tripId, driver)
    );

    const result = await Promise.race(promises);

    if (!result) {
      for (const driver of candidates.slice(3)) {
        const accepted = await this.offerToDriver(tripId, driver);
        if (accepted) {
          eventBus.emit("trip.driver.accepted", { tripId, driverId: driver.driverId });
          return;
        }
      }
      console.log(`[SCORE DISPATCH 3.0] Ninguém aceitou a Trip ${tripId}.`);
      eventBus.emit("trip.cancelled", { tripId, reason: "NO_DRIVER_FOUND" });
    }
  }

  private async offerToDriver(tripId: string, driver: any): Promise<boolean> {
    console.log(
      `[SCORE DISPATCH 3.0] Oferta para Driver ${driver.driverId} ` +
      `(Score: ${driver.score}, ETA: ${driver.etaMinutes}min, CancelRisk: ${driver.cancelRisk.risk})`
    );
    eventBus.emit("trip.driver.notified", { tripId, driverId: driver.driverId });
    const accepted = await this.waitForAcceptance(tripId, driver.driverId, 15000);
    if (accepted) {
      return true;
    }
    eventBus.emit("trip.driver.timeout", { tripId, driverId: driver.driverId });
    return false;
  }

  private async findAvailableDrivers(origin: Coordinates, categoryId: string): Promise<DriverCandidate[]> {
    const drivers: DriverCandidate[] = [
      {
        driverId: "drv-1", lat: origin.lat + 0.01, lng: origin.lng,
        rating: 4.9, acceptanceRate: 98, cancellationRate: 2,
        onlineTimeHours: 4, tripsCompleted: 1240,
        vehicleTypeId: categoryId, batteryLevel: 85, gpsAccuracy: 8,
        isFavorite: true,
      },
      {
        driverId: "drv-2", lat: origin.lat + 0.02, lng: origin.lng + 0.01,
        rating: 4.7, acceptanceRate: 85, cancellationRate: 5,
        onlineTimeHours: 2, tripsCompleted: 520,
        vehicleTypeId: categoryId, batteryLevel: 60, gpsAccuracy: 15,
      },
      {
        driverId: "drv-3", lat: origin.lat - 0.01, lng: origin.lng + 0.02,
        rating: 4.3, acceptanceRate: 70, cancellationRate: 12,
        onlineTimeHours: 6, tripsCompleted: 180,
        vehicleTypeId: categoryId, batteryLevel: 30, gpsAccuracy: 35,
      },
      {
        driverId: "drv-4", lat: origin.lat + 0.005, lng: origin.lng - 0.005,
        rating: 4.8, acceptanceRate: 92, cancellationRate: 3,
        onlineTimeHours: 1, tripsCompleted: 890,
        vehicleTypeId: categoryId, batteryLevel: 95, gpsAccuracy: 5,
      },
      {
        driverId: "drv-5", lat: origin.lat + 0.03, lng: origin.lng + 0.02,
        rating: 4.5, acceptanceRate: 78, cancellationRate: 8,
        onlineTimeHours: 3, tripsCompleted: 340,
        vehicleTypeId: categoryId, batteryLevel: 50, gpsAccuracy: 20,
      },
    ];

    return drivers;
  }

  private waitForAcceptance(tripId: string, driverId: string, timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => setTimeout(() => resolve(false), timeoutMs));
  }
}

export const scoreDispatch3 = new ScoreDispatch3();
