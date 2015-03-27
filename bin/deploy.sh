#!/bin/sh

dt config:set VHOSTS="$(cat vhost-config.json | tr -d '\n ')" ALIASES="$(cat alias-config.json | tr -d '\n ')"
git push collekt master
