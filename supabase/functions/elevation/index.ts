import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { latitude, longitude } = await req.json();

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

    const elevationResponse = await fetch(
      `https://api.open-elevation.com/api/v1/lookup?locations=${latitude},${longitude}`
    );

    if (!elevationResponse.ok) {
      throw new Error("Failed to fetch elevation data");
    }

    const elevationData = await elevationResponse.json();
    const elevation = elevationData.results[0]?.elevation || 0;

    const slopeRadius = 0.001;
    const points = [
      { lat: latitude + slopeRadius, lng: longitude },
      { lat: latitude - slopeRadius, lng: longitude },
      { lat: latitude, lng: longitude + slopeRadius },
      { lat: latitude, lng: longitude - slopeRadius },
    ];

    const elevationPromises = points.map(async (point) => {
      const response = await fetch(
        `https://api.open-elevation.com/api/v1/lookup?locations=${point.lat},${point.lng}`
      );
      const data = await response.json();
      return data.results[0]?.elevation || elevation;
    });

    const elevations = await Promise.all(elevationPromises);
    const maxElevation = Math.max(...elevations);
    const minElevation = Math.min(...elevations);
    const elevationDiff = maxElevation - minElevation;

    const distance = slopeRadius * 111320;
    const slope = Math.atan(elevationDiff / distance) * (180 / Math.PI);

    return new Response(
      JSON.stringify({
        elevation,
        slope: Math.abs(slope),
        maxElevation,
        minElevation,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Elevation API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch elevation data",
        elevation: 0,
        slope: 0,
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
