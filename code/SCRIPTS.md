# Scripts disponibles - ArcadiaBox

## Workflow recommandé

```bash
# 1. Premier lancement / après un git pull
npm run setup

# 2. Développement quotidien
npm run dev:full
```

## Scripts principaux

| Commande | Description |
|----------|-------------|
| `npm run setup` | **Installation complète** - Installe npm, génère Prisma, vérifie la DB |
| `npm run dev:full` | **Développement** - Lance frontend + backend (cross-platform) |
| `npm run start` | **Production** - Build + serveur de production |

## Scripts individuels

| Commande | Description |
|----------|-------------|
| `npm run dev` | Frontend seul (Vite) |
| `npm run server` | Backend seul (Express) |
| `npm run build` | Build de production |

## Base de données

| Commande | Description |
|----------|-------------|
| `npm run db:generate` | Génère le client Prisma |
| `npm run db:push` | Synchronise schema → DB |
| `npm run db:migrate` | Crée une migration |

## Ports

| Service | Port |
|---------|------|
| Frontend (Vite) | 3000 |
| Backend (Express) | 8080 |

Le proxy Vite redirige automatiquement `/api/*` vers le backend.
