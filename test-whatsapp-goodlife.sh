#!/bin/bash

# ============================================
# Test d'envoi WhatsApp - GoodLife Costa Rica
# ============================================

# Configuration
PHONE_NUMBER_ID="966520989876579"
ACCESS_TOKEN="EAAWFYOLTYjQBQD4AzKNUbtS26fSPOCqJn5e1MAQlvhSPfZAZBRvO3W8gb5Ehls4IEkdt49F7kppu11BXgRkhhYLd1UaFMrUVuoZCoL0Ch8j1KIsZAOXmrlx2PbUkUfptLg6kojKQC3gBGBLTRagmWIYUfUp8tQAeZBdp3Nv8e1fUZCSMJbNivPREoebltpi1GMCmCps2l7xQZCyvjiz2pMPvlsPKK0ZCm7ftiEdAwAjR"

# Numéro de destination (à modifier)
TO_NUMBER="${1:-}"

if [ -z "$TO_NUMBER" ]; then
  echo "❌ Erreur: Veuillez fournir un numéro de destination"
  echo ""
  echo "Usage: ./test-whatsapp-goodlife.sh 506XXXXXXXX"
  echo "Exemple: ./test-whatsapp-goodlife.sh 50671996544"
  exit 1
fi

echo "📱 Test d'envoi WhatsApp Business API"
echo "======================================"
echo "De: +506 6021 3707 (GoodLife)"
echo "Vers: +${TO_NUMBER}"
echo "Template: hello_world"
echo ""

# Envoi du message avec le template hello_world
response=$(curl -s -X POST "https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"messaging_product\": \"whatsapp\",
    \"to\": \"${TO_NUMBER}\",
    \"type\": \"template\",
    \"template\": {
      \"name\": \"hello_world\",
      \"language\": {
        \"code\": \"en_US\"
      }
    }
  }")

echo "📨 Réponse de l'API:"
echo "$response" | jq .

# Vérifier si l'envoi a réussi
if echo "$response" | jq -e '.messages[0].id' > /dev/null 2>&1; then
  message_id=$(echo "$response" | jq -r '.messages[0].id')
  echo ""
  echo "✅ Message envoyé avec succès!"
  echo "Message ID: $message_id"
  echo ""
  echo "👉 Vérifiez votre WhatsApp au numéro +${TO_NUMBER}"
else
  echo ""
  echo "❌ Échec de l'envoi"
  echo ""
  # Afficher l'erreur détaillée
  if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
    error_message=$(echo "$response" | jq -r '.error.message')
    error_code=$(echo "$response" | jq -r '.error.code')
    echo "Code erreur: $error_code"
    echo "Message: $error_message"
  fi
fi
