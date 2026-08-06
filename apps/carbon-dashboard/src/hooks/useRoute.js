import { useState } from "react";

import { getOptimizedRoute } from "../services/osrmService";

export default function useRoute() {

  const [route, setRoute] = useState(null);

  const [loading, setLoading] = useState(false);

  async function calculate(origin, destination) {

    setLoading(true);

    try {

      const data = await getOptimizedRoute(

        origin,

        destination

      );

      setRoute(data);

    }

    catch (err) {

      console.log(err);

    }

    finally {

      setLoading(false);

    }

  }

  return {

    route,

    loading,

    calculate,

  };

}