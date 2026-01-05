import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GeocodeRequest {
  location: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { location }: GeocodeRequest = await req.json();

    if (!location || typeof location !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Please provide a valid location.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const OPENCAGE_API_KEY = Deno.env.get('OPENCAGE_API_KEY');

    if (!OPENCAGE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenCage API key not configured.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    const opencageUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)},India&key=${OPENCAGE_API_KEY}&limit=1`;

    const response = await fetch(opencageUrl);

    if (!response.ok) {
      console.error('Geocoding API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to geocode location.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Location not found. Please try a different location.' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const result = data.results[0];

    return new Response(
      JSON.stringify({
        latitude: result.geometry.lat,
        longitude: result.geometry.lng,
        displayName: result.formatted,
        state: result.components.state || '',
        city: result.components.city || result.components.town || result.components.village || '',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Geocoding error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while geocoding.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});