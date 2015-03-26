#!/bin/sh

VHOSTS=$(cat vhost-config.json | tr -d '\n')
dt config:set VHOSTS="'$VHOSTS'"

ALIASES=$(cat alias-config.json | tr -d '\n')
dt config:set ALIASES="'$ALIASES'"
