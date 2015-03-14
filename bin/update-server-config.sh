#!/bin/sh

CONFIG=$(cat domain-config.json | tr -d '\n')
dt config:set DOMAIN_CONFIG="'$CONFIG'"
