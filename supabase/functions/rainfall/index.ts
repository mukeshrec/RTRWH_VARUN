import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RainfallRequest {
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
    const { latitude, longitude }: RainfallRequest = await req.json();

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Please provide valid latitude and longitude.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    const openMeteoUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${lastYear}-01-01&end_date=${lastYear}-12-31&daily=precipitation_sum&timezone=Asia/Kolkata`;

    const response = await fetch(openMeteoUrl);

    if (!response.ok) {
      console.error('Rainfall API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch rainfall data.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();

    if (!data.daily || !data.daily.precipitation_sum) {
      return new Response(
        JSON.stringify({ error: 'No rainfall data available for this location.' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const precipitationData = data.daily.precipitation_sum;
    const totalRainfall = precipitationData.reduce((sum: number, val: number | null) => {
      return sum + (val || 0);
    }, 0);

    const monthlyRainfall = [];
    for (let month = 0; month < 12; month++) {
      const startIdx = month * 30;
      const endIdx = Math.min(startIdx + 30, precipitationData.length);
      const monthSum = precipitationData.slice(startIdx, endIdx).reduce((sum: number, val: number | null) => {
        return sum + (val || 0);
      }, 0);
      monthlyRainfall.push(Math.round(monthSum * 10) / 10);
    }

    return new Response(
      JSON.stringify({
        annualRainfall: Math.round(totalRainfall * 10) / 10,
        monthlyRainfall,
        year: lastYear,
        unit: 'mm',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Rainfall error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while fetching rainfall data.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});