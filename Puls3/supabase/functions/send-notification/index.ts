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
    event_type: "app_opened" | "app_closed" | "milestone_5" | "milestone_half" | "warning_15" | "critical_5" | "group_death" | "streak_record" | "daily_reset" | "weekly_reset"
    app_name?: string
    minutes_left?: number
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
        const supabaseServiceKey = Deno.env.get("EXSUPABASE_SERVICE_ROLE_KEY")
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

        // 1. Get the members of the group
        const { data: members, error: membersError } = await supabase
            .from('memberships')
            .select('user_id')
            .eq('group_id', event.group_id)

        if (membersError) {
            throw new Error(`Failed to fetch group members: ${membersError.message}`)
        }

        // We only need the user_ids (which match the OneSignal external_id)
        const userIds = members.map((m) => m.user_id).filter(Boolean)

        if (userIds.length === 0) {
            return new Response(
                JSON.stringify({ message: "No members found in this group." }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            )
        }

        // Grab username from metadata or fallback to shorten UUID
        const username = event.metadata?.username || `User ${event.user_id.substring(0, 4)}`

        // 2. Formatting the notification based on event.event_type
        let heading = "Notificación"
        let content = "Ha ocurrido un evento nuevo."

        switch (event.event_type) {
            case "app_opened":
                heading = "🛑 App Abierta"
                content = `🚨 ${username} abrió ${event.app_name || "una app prohibida"}`
                break
            case "milestone_5":
                heading = "⚠️ Aviso de Tiempo"
                content = `⚠️ ${username} ha consumido 5 minutos`
                break
            case "critical_5":
                heading = "⛔ Tiempo Crítico"
                content = `⛔ Sólo os quedan ${event.minutes_left || 0} minutos`
                break
            case "group_death":
                heading = "💀 Grupo Destruido"
                content = `💀 ${username} la ha liado pero bien! Bye bye grupo!`
                break
        }

        // 3. Send to OneSignal
        // Usar include_aliases permite a OneSignal mapear los UUIDs de Supabase directamente a los celulares
        const onesignalBody = {
            app_id: onesignalAppId,
            target_channel: "push",
            include_aliases: {
                external_id: userIds
            },
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
                recipients_count: userIds.length,
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
