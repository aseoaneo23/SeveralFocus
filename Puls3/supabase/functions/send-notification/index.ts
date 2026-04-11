import "jsr:@supabase/functions-js/edge-runtime.d.ts"
// @ts-ignore: Deno HTTP imports are not recognized by the Node TypeScript compiler
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface EventRecord {
    id: string
    group_id: string
    user_id: string
    type: "app_opened" | "app_closed" | "milestone_5" | "critical_10" | "group_death" | "daily_reset"
    metadata: Record<string, any>
    created_at: string
}

interface WebhookPayload {
    type: "INSERT" | "UPDATE" | "DELETE"
    table: string
    record: EventRecord
    schema: "public"
    old_record: null | EventRecord
}

Deno.serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get("EXPO_PUBLIC_SUPABASE_URL")
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
        const onesignalAppId = Deno.env.get("ONESIGNAL_APP_ID")
        const onesignalApiKey = Deno.env.get("ONESIGNAL_API_KEY")

        if (!supabaseUrl || !supabaseServiceKey || !onesignalAppId || !onesignalApiKey) {
            throw new Error("Missing environment variables.")
        }

        const payload: WebhookPayload = await req.json()
        const event = payload.record

        // Verify it's an INSERT into events
        if (payload.type !== "INSERT" || payload.table !== "events" || !event) {
            throw new Error("Invalid payload: Function expects an INSERT webhook from the 'events' table.")
        }

        // Initialize Supabase admin client to bypass RLS (we need to fetch all members)
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Get the members of the group with their onesignal_player_ids
        const { data, error } = await supabase
            .from('group_members')
            .select(`
                user_id,
                users (
                    push_token
                )
            `)
            .eq('group_id', event.group_id)

        if (error) {
            throw new Error(`Failed to fetch group members: ${error.message}`)
        }

        // Filter out members without a OneSignal player ID
        const playerIds = members
            .map((m) => m.onesignal_player_id)
            .filter((id) => id !== null && id !== "")

        if (playerIds.length === 0) {
            return new Response(
                JSON.stringify({ message: "No members with valid OneSignal IDs found in this group." }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            )
        }

        // Grab username from metadata or fallback to shorten UUID
        const username = event.metadata?.username || `User ${event.user_id.substring(0, 4)}`

        // 2. Formatting the notification based on event.type
        let heading = "Notification"
        let content = "A new event occurred in your group."

        switch (event.type) {
            case "session_start":
                heading = "🛑 App Opened"
                content = `🚨 ${username} opened ${event.metadata?.app_name || "a forbidden app"}`
                break
            case "time_warning":
                heading = "⚠️ Time Warning"
                content = `⚠️ ${username} has consumed ${event.metadata?.minutes || 0} minutes`
                break
            case "critical":
                heading = "⛔ Critical Time"
                content = `⛔ Only ${event.metadata?.remaining_time || 0} minutes left`
                break
            case "group_dead":
                heading = "💀 Group Dead"
                content = `💀 ${username} destroyed the group`
                break
        }

        // 3. Send to OneSignal
        // Using include_player_ids array (for direct device targeting)
        const onesignalBody = {
            app_id: onesignalAppId,
            include_player_ids: playerIds,
            headings: { en: heading },
            contents: { en: content },
            data: {
                event_id: event.id,
                group_id: event.group_id,
                type: event.type,
            },
        }

        const onesignalResponse = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                Authorization: `Basic ${onesignalApiKey}`,
            },
            body: JSON.stringify(onesignalBody),
        })

        const onesignalResult = await onesignalResponse.json()

        if (!onesignalResponse.ok) {
            throw new Error(`OneSignal API Error: ${JSON.stringify(onesignalResult)}`)
        }

        return new Response(
            JSON.stringify({
                message: "Push notifications successfully dispatched.",
                recipients_count: playerIds.length,
                onesignal_response: onesignalResult,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    } catch (error: any) {
        console.error("Function error:", error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
    }
})
