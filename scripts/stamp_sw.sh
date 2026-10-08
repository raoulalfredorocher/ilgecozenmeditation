#!/bin/sh
# Scrive in sw.js la versione dell'app: cambia solo se cambia il codice (non quando cambiano i prezzi in data/).
# Così il service worker svuota le copie sul telefono solo quando serve davvero.
set -e
cd "$(dirname "$0")/.."
H=$(git ls-files | grep -v '^data/' | xargs sha1sum | sha1sum | cut -c1-8)
sed -i "s/^const VERSION = .*/const VERSION = 'geco-$H';/" sw.js
echo "versione geco-$H"
