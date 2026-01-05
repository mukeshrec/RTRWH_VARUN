import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WaterBody {
  name: string;
  distance: number;
  type: string;
  lat: number;
  lon: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { latitude, longitude, radius = 5000 } = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "Latitude and longitude are required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const overpassQuery = `
      [out:json][timeout:25];
      (
        way["natural"="water"](around:${radius},${latitude},${longitude});
        way["waterway"](around:${radius},${latitude},${longitude});
        way["landuse"="reservoir"](around:${radius},${latitude},${longitude});
        node["natural"="water"](around:${radius},${latitude},${longitude});
        node["waterway"](around:${radius},${latitude},${longitude});
      );
      out center;
    `;

    const overpassResponse = await fetch(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
      }
    );

    if (!overpassResponse.ok) {
      throw new Error("Failed to fetch water bodies data");
    }

    const data = await overpassResponse.json();

    const waterBodies: WaterBody[] = data.elements
      .map((element: any) => {
        const lat = element.center?.lat || element.lat;
        const lon = element.center?.lon || element.lon;

        if (!lat || !lon) return null;

        const distance = calculateDistance(latitude, longitude, lat, lon);

        const name =
          element.tags?.name ||
          element.tags?.waterway ||
          element.tags?.natural ||
          "Unnamed water body";

        let type = "Water Body";
        if (element.tags?.waterway) {
          type = element.tags.waterway === "river" ? "River" : "Stream";
        } else if (element.tags?.natural === "water") {
          type = element.tags.water || "Lake/Pond";
        } else if (element.tags?.landuse === "reservoir") {
          type = "Reservoir";
        }

        return {
          name,
          distance,
          type,
          lat,
          lon,
        };
      })
      .filter((wb: WaterBody | null) => wb !== null)
      .sort((a: WaterBody, b: WaterBody) => a.distance - b.distance)
      .slice(0, 10);

    return new Response(
      JSON.stringify({
        waterBodies,
        count: waterBodies.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Water bodies API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch water bodies data",
        waterBodies: [],
        count: 0,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
