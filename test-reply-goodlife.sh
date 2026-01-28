#!/bin/bash

# ============================================
# Test de réponse WhatsApp - GoodLife Costa Rica
# (Pour répondre à un message entrant)
# ============================================

# Configuration
PHONE_NUMBER_ID="966520989876579"
ACCESS_TOKEN="EAAWFYOLTYjQBQD4AzKNUbtS26fSPOCqJn5e1MAQlvhSPfZAZBRvO3W8gb5Ehls4IEkdt49F7kppu11BXgRkhhYLd1UaFMrUVuoZCoL0Ch8j1KIsZAOXmrlx2PbUkUfptLg6kojKQC3gBGBLTRagmWIYUfUp8tQAeZBdp3Nv8e1fUZCSMJbNivPREoebltpi1GMCmCps2l7xQZCyvjiz2pMPvlsPKK0ZCm7ftiEdAwAjR"

# Numéro de destination
TO_NUMBER="${1:-}"
MESSAGE="${2:-Bonjour! Ceci est un message de test depuis GoodLife Costa Rica. 🇨🇷}"

if [ -z "$TO_NUMBER" ]; then
  echo "❌ Erreur: Veuillez fournir un numéro de destination"
  echo ""
  echo "Usage: ./test-reply-goodlife.sh 33768955510 [message]"
  exit 1
fi

echo "📱 Test d'envoi de message texte WhatsApp"
echo "=========================================="
echo "De: +506 6021 3707 (GoodLife)"
echo "Vers: +${TO_NUMBER}"
echo "Message: ${MESSAGE}"
echo ""

# Envoi d'un message texte libre (pas de template)
response=$(curl -s -X POST "https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"messaging_product\": \"whatsapp\",
    \"recipient_type\": \"individual\",
    \"to\": \"${TO_NUMBER}\",
    \"type\": \"text\",
    \"text\": {
      \"preview_url\": false,
      \"body\": \"${MESSAGE}\"
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
  if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
    error_message=$(echo "$response" | jq -r '.error.message')
    error_code=$(echo "$response" | jq -r '.error.code')
    error_subcode=$(echo "$response" | jq -r '.error.error_subcode // "N/A"')
    echo "Code erreur: $error_code (subcode: $error_subcode)"
    echo "Message: $error_message"
    echo ""

    # Suggestions selon l'erreur
    if [ "$error_code" = "131026" ] || [ "$error_subcode" = "2494002" ]; then
      echo "💡 Cette erreur signifie que le numéro est trop récent ou en attente d'approbation."
      echo "   Attendez 24-48h que Meta approuve complètement le numéro."
    elif [ "$error_code" = "133010" ]; then
      echo "💡 Cette erreur signifie que:"
      echo "   - Le destinataire n'a pas WhatsApp sur ce numéro"
      echo "   - OU il faut que le destinataire vous envoie un message FIRST"
    fi
  fi
fi
