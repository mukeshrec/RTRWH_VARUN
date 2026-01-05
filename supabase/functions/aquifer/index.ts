import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AquiferRequest {
  state: string;
  region?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { state, region }: AquiferRequest = await req.json();

    if (!state || typeof state !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Please provide a valid state.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    let query = supabaseClient
      .from('aquifer_mapping')
      .select('*')
      .ilike('state', `%${state}%`);

    if (region) {
      query = query.or(`region.ilike.%${region}%,region.eq.All regions`);
    } else {
      query = query.eq('region', 'All regions');
    }

    const { data, error } = await query.limit(1).maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch aquifer data.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({
          aquiferType: 'hard_rock',
          description: 'Default aquifer type (specific data not available for this location)',
          rechargePotential: 'Medium',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        aquiferType: data.aquifer_type,
        description: data.description,
        rechargePotential: data.recharge_potential,
        state: data.state,
        region: data.region,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Aquifer classification error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while classifying aquifer.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});