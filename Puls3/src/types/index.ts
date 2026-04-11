export type ResetPeriod = 'daily' | 'weekly'

export type EventType =
    | 'app_opened' | 'app_closed'
    | 'milestone_5' | 'milestone_half'
    | 'warning_15' | 'critical_10'
    | 'group_death' | 'streak_record'
    | 'daily_reset' | 'weekly_reset'

export interface User {
    id: string
    username: string
    push_token?: string
    created_at: string
}

export interface Group {
    id: string
    name: string
    invite_code: string
    banned_apps: string[]
    time_per_person: number
    total_minutes: number
    used_minutes: number
    reset_period: ResetPeriod
    streak_days: number
    best_streak: number
    is_alive: boolean
    is_public: boolean
    killed_by?: string
    killed_at?: string
    max_members: number
    created_by: string
    created_at: string
}

export interface Membership {
    id: string
    user_id: string
    group_id: string
    joined_at: string
}

export interface Session {
    id: string
    group_id: string
    user_id: string
    app_name: string
    started_at: string
    ended_at?: string
    minutes_used: number
}

export interface GroupEvent {
    id: string
    group_id: string
    user_id?: string
    event_type: EventType
    app_name?: string
    minutes_left?: number
    metadata: Record<string, any>
    created_at: string
}

export interface CloseSessionResult {
    status: 'alive' | 'dead'
    minutes_left?: number
    minutes_used?: number
    user_name?: string
    app_name?: string
    killer_name?: string
    streak_lost?: number
}