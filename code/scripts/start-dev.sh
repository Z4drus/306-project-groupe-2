#!/bin/bash

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   ArcadiaBox - Démarrage Dev${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Fonction pour vérifier si un port est disponible
check_port() {
  lsof -i:$1 > /dev/null 2>&1
  return $?
}

# Vérifier si les ports sont déjà utilisés
if check_port 8080; then
  echo -e "${YELLOW}Port 8080 (backend) déjà utilisé. Arrêt du processus...${NC}"
  kill $(lsof -t -i:8080) 2>/dev/null
fi

if check_port 3000; then
  echo -e "${YELLOW}Port 3000 (frontend) déjà utilisé. Arrêt du processus...${NC}"
  kill $(lsof -t -i:3000) 2>/dev/null
fi

# Démarrer le serveur backend en arrière-plan
echo -e "${BLUE}[1/3]${NC} Démarrage du serveur backend..."
node --experimental-strip-types server/index.js &
SERVER_PID=$!

# Attendre que le serveur soit prêt
echo -e "${BLUE}[2/3]${NC} Attente du serveur..."
sleep 2

# Vérifier que le serveur est bien lancé
if ! check_port 8080; then
  echo -e "${YELLOW}Serveur en cours de démarrage...${NC}"
  sleep 2
fi

if check_port 8080; then
  echo -e "${GREEN}✓ Serveur backend prêt sur http://localhost:8080${NC}"
else
  echo -e "${YELLOW}⚠ Le serveur met du temps à démarrer...${NC}"
fi

# Démarrer le frontend
echo -e "${BLUE}[3/3]${NC} Démarrage du frontend Vite..."
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   ✓ ArcadiaBox prêt !${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "   Backend:  ${BLUE}http://localhost:8080${NC}"
echo -e "   Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Fonction pour cleanup à la fermeture
cleanup() {
  echo ""
  echo -e "${YELLOW}Arrêt des serveurs...${NC}"
  kill $SERVER_PID 2>/dev/null
  exit 0
}

trap cleanup SIGINT SIGTERM

# Lancer Vite (au premier plan pour voir les logs)
npx vite --host

# Cleanup si vite se termine
cleanup
