#!/bin/bash

# ============================================
# Enregistrement du numéro WhatsApp GoodLife
# ============================================

PHONE_NUMBER_ID="966520989876579"
ACCESS_TOKEN="EAAWFYOLTYjQBQD4AzKNUbtS26fSPOCqJn5e1MAQlvhSPfZAZBRvO3W8gb5Ehls4IEkdt49F7kppu11BXgRkhhYLd1UaFMrUVuoZCoL0Ch8j1KIsZAOXmrlx2PbUkUfptLg6kojKQC3gBGBLTRagmWIYUfUp8tQAeZBdp3Nv8e1fUZCSMJbNivPREoebltpi1GMCmCps2l7xQZCyvjiz2pMPvlsPKK0ZCm7ftiEdAwAjR"

# PIN à 6 chiffres (changez-le si vous voulez)
PIN="${1:-602137}"

echo "📱 Enregistrement du numéro WhatsApp"
echo "===================================="
echo "Phone Number ID: $PHONE_NUMBER_ID"
echo "Numéro: +506 6021 3707"
echo "PIN: $PIN"
echo ""

# Enregistrer le numéro avec le PIN
response=$(curl -s -X POST "https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/register" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"messaging_product\":\"whatsapp\",\"pin\":\"${PIN}\"}")

echo "📨 Réponse de l'API:"
echo "$response" | jq .

# Vérifier si l'enregistrement a réussi
if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
  echo ""
  echo "✅ Numéro enregistré avec succès!"
  echo ""
  echo "🔐 IMPORTANT: Gardez ce PIN en lieu sûr: $PIN"
  echo "   Vous en aurez besoin pour migrer le numéro plus tard."
  echo ""
  echo "🚀 Vous pouvez maintenant tester l'envoi de messages!"
else
  echo ""
  echo "❌ Échec de l'enregistrement"
  if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
    error_message=$(echo "$response" | jq -r '.error.message')
    error_code=$(echo "$response" | jq -r '.error.code')
    echo "Code erreur: $error_code"
    echo "Message: $error_message"
  fi
fi
