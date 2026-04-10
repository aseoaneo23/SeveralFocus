# Setup completo — Screentime Accountability App

## Stack
- **Frontend:** React Native + Expo
- **Backend:** Supabase (BD + Auth + Realtime + Edge Functions)
- **Notificaciones:** OneSignal
- **Repo:** GitHub

---

## PASO 1 — Una persona lo hace (el que tenga mejor wifi) ~20 min

### 1.1 Crear el repo en GitHub
1. github.com → New repository
2. Nombre: `screentime-app`
3. Privado, con README
4. Copiar la URL del repo

### 1.2 Crear el proyecto Expo
```bash
npx create-expo-app screentime-app --template blank-typescript
cd screentime-app
git init
git remote add origin TU_URL_DE_GITHUB
```

### 1.3 Instalar dependencias
```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage expo-secure-store
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
```

### 1.4 Crear el proyecto en Supabase
1. supabase.com → New project
2. Nombre: `screentime-app`, genera una password fuerte y **guárdala**
3. Región: Europe West
4. Esperar ~2 min a que arranque

### 1.5 Ejecutar el schema SQL
1. Supabase Dashboard → SQL Editor → New query
2. Pegar el contenido de `schema.sql` (el archivo que ya tenéis)
3. Run → debe devolver "Success"

### 1.6 Crear el archivo de variables de entorno
En Supabase: Settings → API → copiar `Project URL` y `anon public key`

Crear en la raíz del proyecto:
```bash
# .env.local
EXPO_PUBLIC_SUPABASE_URL=https://XXXXXXXX.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 1.7 Crear la estructura de carpetas
```bash
mkdir -p src/{screens,components,lib,hooks,types}
```

### 1.8 Crear el cliente de Supabase
Crear `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```

### 1.9 Crear los tipos base
Crear `src/types/index.ts`:
```typescript
export type ResetPeriod = 'daily' | 'weekly'

export type EventType =
  | 'app_opened' | 'app_closed'
  | 'milestone_10' | 'milestone_half'
  | 'warning_15' | 'critical_5'
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
```

### 1.10 Subir al repo
```bash
echo ".env.local" >> .gitignore
echo "node_modules" >> .gitignore
git add .
git commit -m "feat: project setup + supabase schema"
git push -u origin main
```

### 1.11 Compartir con el equipo
Mandar por el grupo:
- URL del repo de GitHub
- El archivo `.env.local` con las keys (por privado, nunca al repo)
- La password de Supabase (por privado)

---

## PASO 2 — Los otros 3 clonan ~5 min cada uno

```bash
git clone TU_URL_DE_GITHUB
cd screentime-app
npm install
```

Crear `.env.local` con las keys que os mandó el compañero.

Arrancar:
```bash
npx expo start
```

Escanear el QR con la app **Expo Go** en el móvil. Ya estáis todos dentro.

---

## PASO 3 — Cada uno coge su rama

```bash
# P1 - Backend logic
git checkout -b feat/backend-logic

# P2 - UI screens
git checkout -b feat/ui-screens

# P3 - Notifications
git checkout -b feat/notifications

# P4 - UX / integration
git checkout -b feat/ux-integration
```

---

## Cómo hacer PRs rápidos en 36h

No perdáis tiempo en reviews largas. El flujo es:
1. Trabajas en tu rama
2. Cuando algo funciona: `git push origin TU_RAMA`
3. GitHub → Pull Request → asignáis a P4 (integrador)
4. P4 mergea sin bloquear si no hay conflicto obvio
5. Todos hacen `git pull origin main` antes de empezar algo nuevo

---

## Comandos útiles del día a día

```bash
# Actualizar tu rama con los cambios de main
git pull origin main

# Subir tus cambios
git add .
git commit -m "feat: descripción corta"
git push origin TU_RAMA

# Ver qué ha cambiado
git status
git log --oneline -10
```

---

## Verificar que Supabase funciona

Desde cualquier pantalla de prueba, pegar esto y ver si llega algo:

```typescript
import { supabase } from '../lib/supabase'

// Test rápido — pegar en cualquier useEffect
const test = async () => {
  const { data, error } = await supabase.from('groups').select('*').limit(1)
  console.log('Supabase OK:', data, error)
}
```

Si en la consola de Expo aparece `Supabase OK: [] null` → todo funciona.

---

## OneSignal (P3 lo hace mientras P1 y P2 montan lo suyo)

1. onesignal.com → Create app → nombre: `screentime-app`
2. Plataforma: React Native
3. Copiar el **App ID**
4. Añadir al `.env.local`:
```bash
EXPO_PUBLIC_ONESIGNAL_APP_ID=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```
5. Instalar:
```bash
npm install react-native-onesignal
```

---

## Resumen visual de quién hace qué

| Persona | Rama | Primera tarea |
|---------|------|---------------|
| P1 | `feat/backend-logic` | Hook `useGroup` — cargar grupo y suscribirse a realtime |
| P2 | `feat/ui-screens` | Pantalla `HomeScreen` y `CreateGroupScreen` |
| P3 | `feat/notifications` | Inicializar OneSignal + función `sendNotification` |
| P4 | `feat/ux-integration` | Pantalla `DeathScreen` + navegación base en `App.tsx` |