import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FixtureInput {
  id?: string;
  league: string;
  league_name: string;
  home_team: string;
  away_team: string;
  kickoff_time: string;
  commence_time?: string | null;
  market: string;
  home_odds: number;
  draw_odds: number;
  away_odds: number;
  sort_order: number;
  is_active: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { password, fixtures }: { password: string; fixtures: FixtureInput[] } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Read the admin password from app_config (service role bypasses RLS)
    const { data: configData, error: configError } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "odds_admin_password")
      .maybeSingle();

    if (configError) throw configError;
    const adminPassword = configData?.value;

    if (!adminPassword) {
      return new Response(
        JSON.stringify({ error: "Admin password not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!password || password !== adminPassword) {
      return new Response(
        JSON.stringify({ error: "Invalid password" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!Array.isArray(fixtures)) {
      return new Response(
        JSON.stringify({ error: "fixtures must be an array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const incomingIds = fixtures.filter((f) => f.id).map((f) => f.id) as string[];

    // Delete fixtures that were removed in the editor (not in the incoming set)
    if (incomingIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("fixtures")
        .delete()
        .not("id", "in", `(${incomingIds.join(",")})`);
      if (deleteError) throw deleteError;
    } else {
      const { error: deleteAllError } = await supabase
        .from("fixtures")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (deleteAllError) throw deleteAllError;
    }

    // Upsert each fixture
    for (const fixture of fixtures) {
      const row = {
        league: fixture.league,
        league_name: fixture.league_name,
        home_team: fixture.home_team,
        away_team: fixture.away_team,
        kickoff_time: fixture.kickoff_time,
        commence_time: fixture.commence_time ?? null,
        market: fixture.market || "Match Result",
        home_odds: Number(fixture.home_odds) || 2.0,
        draw_odds: Number(fixture.draw_odds) || 3.0,
        away_odds: Number(fixture.away_odds) || 3.0,
        sort_order: Number(fixture.sort_order) || 0,
        is_active: fixture.is_active !== false,
      };

      if (fixture.id) {
        const { error } = await supabase
          .from("fixtures")
          .update(row)
          .eq("id", fixture.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("fixtures")
          .insert({ ...row, source: "manual" });
        if (error) throw error;
      }
    }

    return new Response(
      JSON.stringify({ success: true, count: fixtures.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
