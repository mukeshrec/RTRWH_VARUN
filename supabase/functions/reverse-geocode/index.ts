import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ReverseGeocodeRequest {
  latitude: number;
  longitude: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { latitude, longitude }: ReverseGeocodeRequest = await req.json();

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Please provide valid latitude and longitude.' }),
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

    const opencageUrl = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${OPENCAGE_API_KEY}`;

    const response = await fetch(opencageUrl);

    if (!response.ok) {
      console.error('Reverse geocoding API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to reverse geocode location.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Location not found.' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const result = data.results[0];
    const components = result.components;

    const state = components.state || components.state_district || components.region || '';
    const city = components.city || components.town || components.village || components.county || '';
    const displayLocation = `${city}, ${state}`.replace(/^, |, $/g, '');

    console.log('Reverse geocode - State detected:', state);
    console.log('Reverse geocode - Components:', JSON.stringify(components));

    return new Response(
      JSON.stringify({
        state,
        city,
        displayLocation,
        formatted: result.formatted,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while reverse geocoding.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
