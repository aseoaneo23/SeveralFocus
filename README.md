<div align="center">

# 📱 Puls3

### App de responsabilidad de tiempo de pantalla
**Desarrollada para el Impacthon**

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-Expo-61DAFB?style=flat-square&logo=react&logoColor=black)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)

</div>

---

## 🧠 Sobre el proyecto

**Puls3** es una aplicación móvil de responsabilidad grupal para el control del tiempo de pantalla. Los usuarios se unen a grupos, establecen límites de uso de apps y se responsabilizan mutuamente: si alguien consume el tiempo del grupo en apps prohibidas, ¡el grupo muere! El objetivo es fomentar hábitos digitales saludables a través de la presión social positiva.

---

## ✨ Características

- 🔒 **Grupos de accountability** — Únete o crea grupos con límites de tiempo compartidos
- 📊 **Seguimiento en tiempo real** — Monitorización del uso de apps con Supabase Realtime
- 🔔 **Notificaciones push** — Alertas cuando el grupo se acerca al límite via OneSignal
- 🔥 **Sistema de rachas** — Mantén viva la racha diaria/semanal del grupo
- 💀 **Modo muerte** — Si alguien agota el tiempo del grupo, el grupo "muere" y pierde su racha
- 🔑 **Códigos de invitación** — Comparte tu grupo fácilmente con un código único

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React Native + Expo |
| Backend | Supabase (BD + Auth + Realtime + Edge Functions) |
| Notificaciones | OneSignal |
| Lenguaje | TypeScript |
| Control de versiones | GitHub |

---

## 🚀 Instalación

### Prerrequisitos

- Node.js
- Expo CLI
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [OneSignal](https://onesignal.com)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/aseoaneo23/SeveralFocus.git
cd SeveralFocus

# 2. Instalar dependencias
npm install

# 3. Crear el archivo de variables de entorno
# Crea un fichero .env.local en la raíz con:
# EXPO_PUBLIC_SUPABASE_URL=https://XXXXXXXX.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
# EXPO_PUBLIC_ONESIGNAL_APP_ID=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX

# 4. Arrancar el proyecto
npx expo start
```

Escanea el QR con la app **Expo Go** en tu móvil.

---

## 📁 Estructura del proyecto

```
SeveralFocus/
├── Puls3/                  # Código principal de la app
│   └── src/
│       ├── screens/        # Pantallas de la app
│       ├── components/     # Componentes reutilizables
│       ├── lib/            # Cliente Supabase y utilidades
│       ├── hooks/          # Custom hooks
│       └── types/          # Tipos TypeScript
├── DocuBD.md               # Documentación de la base de datos
├── roadmap.md              # Roadmap y guía de setup
└── README.md
```

---

## 👥 Equipo

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/aseoaneo23">
        <img src="https://github.com/aseoaneo23.png" width="100px" style="border-radius: 50%;" alt="Antonio Seoane"/><br/>
        <sub><b>Antonio Seoane de Ois</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/JorgeNeiraC2006">
        <img src="https://github.com/JorgeNeiraC2006.png" width="100px" style="border-radius: 50%;" alt="Jorge Neira"/><br/>
        <sub><b>Jorge Neira Cociña</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/angelfernandez911">
        <img src="https://github.com/angelfernandez911.png" width="100px" style="border-radius: 50%;" alt="Ángel Fernández"/><br/>
        <sub><b>Ángel Fernández Rodríguez</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/xoaqui">
        <img src="https://github.com/xoaqui.png" width="100px" style="border-radius: 50%;" alt="Xoaquín Montoto"/><br/>
        <sub><b>Xoaquín Montoto Diéguez</b></sub>
      </a>
    </td>
  </tr>
</table>

---

## 📄 Licencia

Este proyecto fue desarrollado con fines competitivos para el **Impacthon**.
