import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LEAGUE_MAP: Record<string, { league: string; league_name: string }> = {
  soccer_epl: { league: "epl", league_name: "Premier League" },
  soccer_uefa_champs_league: { league: "ucl", league_name: "Champions League" },
  soccer_spain_la_liga: { league: "laliga", league_name: "La Liga" },
  soccer_italy_serie_a: { league: "seriea", league_name: "Serie A" },
};

interface OddsApiEvent {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    markets: Array<{
      key: string;
      outcomes: Array<{ name: string; price: number }>;
    }>;
  }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ODDS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ODDS_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const sportKeys = Object.keys(LEAGUE_MAP);
    const allFixtures: Array<{
      league: string;
      league_name: string;
      home_team: string;
      away_team: string;
      kickoff_time: string;
      commence_time: string;
      home_odds: number;
      draw_odds: number;
      away_odds: number;
      sort_order: number;
    }> = [];

    let sortOrder = 0;

    for (const sportKey of sportKeys) {
      const mapping = LEAGUE_MAP[sportKey];
      const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=eu&markets=h2h&oddsFormat=decimal`;

      let events: OddsApiEvent[] = [];
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`Odds API returned ${response.status} for ${sportKey}`);
          continue;
        }
        events = await response.json() as OddsApiEvent[];
      } catch (err) {
        console.error(`Failed to fetch ${sportKey}:`, err);
        continue;
      }

      for (const event of events) {
        const bookmaker = event.bookmakers?.[0];
        if (!bookmaker) continue;
        const h2hMarket = bookmaker.markets?.find((m) => m.key === "h2h");
        if (!h2hMarket) continue;

        const homeOutcome = h2hMarket.outcomes.find((o) => o.name === event.home_team);
        const awayOutcome = h2hMarket.outcomes.find((o) => o.name === event.away_team);
        const drawOutcome = h2hMarket.outcomes.find((o) => o.name === "Draw");

        if (!homeOutcome || !awayOutcome) continue;

        const kickoffDate = new Date(event.commence_time);
        const kickoffTime = kickoffDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Windhoek" });

        sortOrder += 1;
        allFixtures.push({
          league: mapping.league,
          league_name: mapping.league_name,
          home_team: event.home_team,
          away_team: event.away_team,
          kickoff_time: kickoffTime,
          commence_time: event.commence_time,
          home_odds: homeOutcome.price,
          draw_odds: drawOutcome?.price ?? 3.0,
          away_odds: awayOutcome.price,
          sort_order: sortOrder,
        });
      }
    }

    if (allFixtures.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No fixtures fetched; keeping existing data" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Delete old API-sourced fixtures, then insert fresh ones
    const { error: deleteError } = await supabase
      .from("fixtures")
      .delete()
      .eq("source", "api");
    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase
      .from("fixtures")
      .insert(allFixtures.map((f) => ({ ...f, source: "api", is_active: true, market: "Match Result" })));
    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, count: allFixtures.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
