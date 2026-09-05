import { Injectable } from '@angular/core';

export interface RouteRerouteStop {
  name: string;
  latitude: number;
  longitude: number;
}

export interface RouteAlert {
  routeId: string;
  affectedStop: string;
  severity: string;
  message: string;
}

export interface RouteRerouteResult {
  routeId: string;
  affectedStop: string;
  severity: string;
  alertMessage: string;
  previousStops: RouteRerouteStop[];
  reroutedStops: RouteRerouteStop[];
  rerouted: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class RouteReroutingService {

  /*
   * Alternate checkpoints used by the current
   * StockFlow prototype.
   *
   * These can later be replaced with Google Maps
   * Routes API / real-time traffic data.
   */
  private readonly alternateStops: Record<
    string,
    RouteRerouteStop
  > = {

    'Nongpoh Checkpoint': {
      name: 'Umiam Alternate Checkpoint',
      latitude: 25.6758,
      longitude: 91.8933
    },

    'Shillong Hub': {
      name: 'Umiam Alternate Checkpoint',
      latitude: 25.6758,
      longitude: 91.8933
    },

    'Kolasib Checkpoint': {
      name: 'Mamit Alternate Checkpoint',
      latitude: 23.9296,
      longitude: 92.4918
    },

    'Nagaon Cross-dock': {
      name: 'Hojai Alternate Checkpoint',
      latitude: 26.0027,
      longitude: 92.8560
    }
  };


  /*
   * Main automatic rerouting function.
   *
   * Example:
   *
   * const alert: RouteAlert = {
   *   routeId: 'RTE-302',
   *   affectedStop: 'Shillong Hub',
   *   severity: 'HIGH',
   *   message: 'Road blockage detected'
   * };
   *
   * const result = this.reroute(routeStops, alert);
   */
  reroute(
    stops: RouteRerouteStop[],
    alert: RouteAlert
  ): RouteRerouteResult {

    const previousStops = [...stops];

    /*
     * Find the stop affected by the alert.
     */
    const affectedIndex = stops.findIndex(
      stop =>
        stop.name.trim().toLowerCase() ===
        alert.affectedStop.trim().toLowerCase()
    );


    /*
     * Alert refers to a stop that does not exist
     * on the current route.
     */
    if (affectedIndex === -1) {

      return {
        routeId: alert.routeId,
        affectedStop: alert.affectedStop,
        severity: alert.severity,
        alertMessage: alert.message,
        previousStops,
        reroutedStops: previousStops,
        rerouted: false,
        message:
          `No reroute applied. ` +
          `${alert.affectedStop} was not found on ` +
          `route ${alert.routeId}.`
      };
    }


    /*
     * A route needs at least:
     *
     * Origin → affected stop → destination
     */
    if (stops.length < 3) {

      return {
        routeId: alert.routeId,
        affectedStop: alert.affectedStop,
        severity: alert.severity,
        alertMessage: alert.message,
        previousStops,
        reroutedStops: previousStops,
        rerouted: false,
        message:
          `No reroute applied because ` +
          `route ${alert.routeId} does not contain ` +
          `enough stops.`
      };
    }


    const affectedStop =
      stops[affectedIndex];


    /*
     * Find an alternate checkpoint.
     */
    const alternateStop =
      this.findAlternateStop(
        affectedStop.name
      );


    const reroutedStops =
      [...stops];


    /*
     * If an alternate checkpoint exists,
     * replace the affected location.
     */
    if (alternateStop) {

      reroutedStops.splice(
        affectedIndex,
        1,
        alternateStop
      );


      /*
       * Shillong is a hub.
       *
       * Keep Shillong after the alternate checkpoint
       * so the shipment still reaches the hub.
       */
      if (
        affectedStop.name.toLowerCase() ===
        'shillong hub'
      ) {

        reroutedStops.splice(
          affectedIndex + 1,
          0,
          affectedStop
        );
      }

    } else {

      /*
       * If there is no predefined alternate,
       * remove an affected intermediate stop.
       *
       * Origin and final destination are never removed.
       */
      if (
        affectedIndex > 0 &&
        affectedIndex < stops.length - 1
      ) {

        reroutedStops.splice(
          affectedIndex,
          1
        );
      }
    }


    /*
     * Check whether the route actually changed.
     */
    const rerouted =
      !this.areStopsEqual(
        previousStops,
        reroutedStops
      );


    /*
     * If no change was possible.
     */
    if (!rerouted) {

      return {
        routeId: alert.routeId,
        affectedStop: alert.affectedStop,
        severity: alert.severity,
        alertMessage: alert.message,
        previousStops,
        reroutedStops,
        rerouted: false,
        message:
          `No alternate route is available for ` +
          `${alert.affectedStop}.`
      };
    }


    /*
     * Successful rerouting result.
     */
    return {
      routeId: alert.routeId,
      affectedStop: alert.affectedStop,
      severity: alert.severity,
      alertMessage: alert.message,
      previousStops,
      reroutedStops,
      rerouted: true,
      message:
        `Route ${alert.routeId} automatically rerouted ` +
        `because ${alert.affectedStop} is affected.`
    };
  }


  /*
   * Find an alternate stop without depending on
   * exact capitalization.
   */
  private findAlternateStop(
    stopName: string
  ): RouteRerouteStop | undefined {

    const key =
      Object.keys(
        this.alternateStops
      ).find(
        item =>
          item.trim().toLowerCase() ===
          stopName.trim().toLowerCase()
      );

    if (!key) {
      return undefined;
    }

    return {
      ...this.alternateStops[key]
    };
  }


  /*
   * Check whether an alternate route exists.
   */
  hasAlternateRoute(
    stopName: string
  ): boolean {

    return Object.keys(
      this.alternateStops
    ).some(
      key =>
        key.trim().toLowerCase() ===
        stopName.trim().toLowerCase()
    );
  }


  /*
   * Get the alternate checkpoint for a stop.
   */
  getAlternateRouteStop(
    stopName: string
  ): RouteRerouteStop | undefined {

    return this.findAlternateStop(
      stopName
    );
  }


  /*
   * Compare two complete route stop lists.
   */
  private areStopsEqual(
    first: RouteRerouteStop[],
    second: RouteRerouteStop[]
  ): boolean {

    if (
      first.length !==
      second.length
    ) {
      return false;
    }

    return first.every(
      (stop, index) => {

        const other =
          second[index];

        return (
          stop.name === other.name &&
          stop.latitude === other.latitude &&
          stop.longitude === other.longitude
        );
      }
    );
  }


  /*
   * Convenience method for creating a route alert.
   *
   * This lets the component do:
   *
   * this.routeReroutingService.createAlert(
   *   'RTE-302',
   *   'Shillong Hub',
   *   'HIGH',
   *   'Road blockage detected'
   * );
   */
  createAlert(
    routeId: string,
    affectedStop: string,
    severity: string,
    message: string
  ): RouteAlert {

    return {
      routeId,
      affectedStop,
      severity,
      message
    };
  }


  /*
   * Complete one-step automatic rerouting.
   *
   * Give it the current route stops and an alert.
   * It returns the updated route stops.
   */
  automaticallyReroute(
    stops: RouteRerouteStop[],
    routeId: string,
    affectedStop: string,
    severity: string,
    message: string
  ): RouteRerouteResult {

    const alert =
      this.createAlert(
        routeId,
        affectedStop,
        severity,
        message
      );

    return this.reroute(
      stops,
      alert
    );
  }
}