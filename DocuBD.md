# Base de datos — WholeLife
> Documentación del schema para el equipo. Stack: Supabase (PostgreSQL).

---

## Visión general

La BD tiene 5 tablas. El flujo es simple: un **user** pertenece a un **group** a través de **memberships**. Cuando usa una app prohibida se crea una **session**. Cada cosa importante que ocurre queda registrada en **events**.

```
users
  └── memberships ──► groups
                          └── sessions
                          └── events
```

---

## Tablas

### `users`
> Perfil de cada persona. Se crea automáticamente cuando alguien se registra con Supabase Auth.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid | PK. El mismo id que usa Supabase Auth |
| `username` | text | Nombre visible en el grupo y en notificaciones |
| `push_token` | text | Player ID de OneSignal para mandarle pushes |
| `created_at` | timestamptz | Fecha de registro |

**Nota:** no hay password aquí. La autenticación la gestiona Supabase Auth en su propia tabla `auth.users`. Esta tabla solo guarda los datos de la app.

---

### `groups`
> El corazón de la app. Representa un grupo activo o muerto.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid | PK |
| `name` | text | Nombre del grupo, visible en el leaderboard |
| `invite_code` | text | Código único de 8 caracteres para unirse |
| `banned_apps` | text[] | Lista de apps que disparan el timer: `['Instagram','TikTok']` |
| `time_per_person` | int | Minutos asignados a cada miembro por periodo |
| `total_minutes` | int | Tiempo total del grupo = `n_miembros × time_per_person` |
| `used_minutes` | int | Minutos ya consumidos en el periodo actual |
| `reset_period` | text | Cuándo se reinicia: `'daily'` o `'weekly'` |
| `streak_days` | int | Días consecutivos sin que el grupo muera |
| `best_streak` | int | Récord histórico de racha |
| `is_alive` | boolean | `false` cuando alguien agota el tiempo |
| `is_public` | boolean | Si aparece en el leaderboard público |
| `killed_by` | uuid | FK a `users.id` — quién destruyó el grupo |
| `killed_at` | timestamptz | Cuándo murió el grupo |
| `max_members` | int | Tope de personas (por defecto 6) |
| `created_by` | uuid | FK a `users.id` — quién creó el grupo |
| `created_at` | timestamptz | Fecha de creación |
| `last_reset_at` | timestamptz | Último reset de tiempo — usado por el cron |

**Cómo se calcula el tiempo restante:**
```
minutos_restantes = total_minutes - used_minutes
```

---

### `memberships`
> Tabla puente entre users y groups. Un usuario solo puede estar en un grupo vivo a la vez.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid | PK |
| `user_id` | uuid | FK a `users.id` |
| `group_id` | uuid | FK a `groups.id` |
| `joined_at` | timestamptz | Cuándo se unió al grupo |

**Restricción importante:** hay un trigger en la BD (`enforce_single_group`) que lanza un error si intentas unirte a un grupo estando ya en uno activo. No hay que validarlo en el frontend.

---

### `sessions`
> Cada vez que un miembro abre una app prohibida. Es la fuente de verdad para descontar tiempo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid | PK |
| `group_id` | uuid | FK a `groups.id` |
| `user_id` | uuid | FK a `users.id` |
| `app_name` | text | App que abrió: `'Instagram'`, `'TikTok'`... |
| `started_at` | timestamptz | Cuándo abrió la app |
| `ended_at` | timestamptz | Cuándo la cerró (null si sigue abierta) |
| `minutes_used` | int | **Columna calculada automáticamente** por PostgreSQL: `(ended_at - started_at) / 60` |

**Flujo de una sesión:**
1. Usuario abre app → INSERT en sessions con `ended_at = null`
2. Usuario cierra app → llamar a `close_session(session_id)`
3. La función cierra la sesión, calcula `minutes_used` y descuenta del grupo

---

### `events`
> Log de todo lo que ocurre en el grupo. Alimenta el feed de actividad y dispara las notificaciones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid | PK |
| `group_id` | uuid | FK a `groups.id` |
| `user_id` | uuid | FK a `users.id` (null si es evento de sistema) |
| `event_type` | text | Tipo de evento (ver tabla abajo) |
| `app_name` | text | App implicada, si aplica |
| `minutes_left` | int | Minutos restantes en el momento del evento |
| `metadata` | jsonb | Datos extra según el tipo de evento |
| `created_at` | timestamptz | Cuándo ocurrió |

**Tipos de evento:**

| `event_type` | Cuándo se crea | Lo crea |
|---|---|---|
| `app_opened` | Alguien abre una app prohibida | Frontend |
| `app_closed` | Alguien cierra la sesión | Función `close_session()` |
| `milestone_10` | Se alcanzan 10 min gastados en una sesión | Edge Function |
| `milestone_half` | Se usa el 50% del tiempo del grupo | Edge Function |
| `warning_15` | Quedan menos de 15 min | Edge Function |
| `critical_5` | Quedan menos de 5 min | Edge Function |
| `group_death` | El grupo muere | Función `close_session()` |
| `streak_record` | Nuevo récord de racha | Función `reset_groups()` |
| `daily_reset` | Reset diario | Función `reset_groups()` |
| `weekly_reset` | Reset semanal | Función `reset_groups()` |

---

## Funciones SQL

### `close_session(p_session_id)`
La función más importante. Hace todo en una sola llamada atómica:
1. Cierra la sesión y calcula `minutes_used`
2. Descuenta el tiempo del grupo
3. Si `used_minutes >= total_minutes` → mata el grupo, guarda `killed_by` y `killed_at`
4. Inserta el evento correspondiente (`app_closed` o `group_death`)
5. Devuelve un JSON con el estado

```typescript
// Cómo se llama desde React Native
const { data } = await supabase.rpc('close_session', { p_session_id: id })

// Respuesta si el grupo sigue vivo
{ status: 'alive', minutes_left: 45, minutes_used: 12, user_name: 'carlos', app_name: 'Instagram' }

// Respuesta si el grupo ha muerto
{ status: 'dead', killer_name: 'carlos', streak_lost: 23, minutes_left: 0 }
```

### `reset_groups()`
Cron job que se ejecuta cada medianoche (diario) o cada lunes (semanal). Para cada grupo vivo que lleva el periodo sin morir: resetea `used_minutes` a 0 y suma 1 a `streak_days`.

---

## Seguridad (RLS)

Cada tabla tiene Row Level Security activado. Las reglas son:

| Tabla | Regla |
|-------|-------|
| `users` | Solo puedes ver y editar tu propio perfil |
| `groups` | Ves los grupos donde eres miembro + todos los públicos (leaderboard) |
| `memberships` | Ves las memberships de tu grupo |
| `sessions` | Ves las sesiones de tu grupo |
| `events` | Ves los eventos de tu grupo |

**Importante:** estas reglas se aplican automáticamente en cada query. No hay que añadir filtros manuales de seguridad en el frontend.

---

## Realtime

Estas tablas tienen Realtime activado — el frontend puede suscribirse a cambios en tiempo real:

- `groups` — para actualizar el tiempo restante y el estado del grupo
- `events` — para el feed de actividad y disparar notificaciones en cliente
- `sessions` — para saber si alguien está usando una app ahora mismo

```typescript
// Ejemplo: escuchar muerte del grupo
supabase
  .channel('group-' + groupId)
  .on('postgres_changes', {
    event: 'INSERT',
    table: 'events',
    filter: `group_id=eq.${groupId}`
  }, (payload) => {
    if (payload.new.event_type === 'group_death') {
      navegarA('DeathScreen', payload.new.metadata)
    }
  })
  .subscribe()
```

---

## Vista pública: `leaderboard`

No es una tabla, es una vista calculada. Devuelve los grupos públicos activos ordenados por racha:

```typescript
const { data } = await supabase.from('leaderboard').select('*')
// [ { id, name, streak_days, best_streak, member_count, created_at } ]
```

---

## Resumen para cada persona del equipo

| Persona | Tablas que más usa | Función clave |
|---------|-------------------|---------------|
| P1 (backend) | Todas | `close_session()`, `reset_groups()` |
| P2 (UI) | `groups`, `memberships`, `leaderboard` | `.from('groups').select()` |
| P3 (notificaciones) | `events` | Realtime en `events` |
| P4 (integración) | `events`, `groups` | Realtime + `leaderboard` |