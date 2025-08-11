#!/bin/bash

echo "🚀 Configuration de l'environnement de test MySQL..."

# Arrêter et supprimer les anciens conteneurs de test
docker-compose -f docker-compose.test.yml down -v

echo "📦 Démarrage du conteneur MySQL de test..."
docker-compose -f docker-compose.test.yml up -d

echo "⏳ Attente du démarrage de MySQL..."
sleep 10

echo "🔍 Vérification de la connexion..."
docker exec portfolio-mysql-test mysqladmin ping -h localhost -u testuser -ptestuserpassword

if [ $? -eq 0 ]; then
    echo "✅ MySQL est prêt pour les tests!"
    echo "📊 Base de données disponible sur localhost:3307"
    echo "👤 Utilisateur: testuser / Mot de passe: testuserpassword"
else
    echo "❌ Erreur lors de la configuration de MySQL"
    exit 1
fi
