#!/bin/sh

dt config:set VHOSTS="'$(cat vhost-config.json | tr -d '\n ')'" \
ALIASES="'$(cat alias-config.json | tr -d '\n ')'" \
$(cat .env.production | sed 's/\n/ /')
git push collekt master
