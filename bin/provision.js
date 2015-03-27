#!/usr/bin/env node

var dotenv = require('dotenv')
var fs = require('fs')
var fingerprint = require('ssh-fingerprint')
var DO = require('do-wrapper')

dotenv.load()

var api = new DO(process.env.DO_API_KEY)

var publickey = fs.readFileSync(process.env.HOME + '/.ssh/id_rsa.pub', 'utf-8')

var keyFingerprint = fingerprint(publickey)

var cloudInit = fs.readFileSync(__dirname + '/cloud-init.sh', 'utf-8')

var config = {
  name: 'simple-odk',
  region: 'nyc3',
  size: '1gb',
  image: 'dokku',
  ssh_keys: [
    keyFingerprint
  ],
  backups: true,
  ipv6: false,
  user_data: cloudInit
}

api.accountGetKeyByFingerprint(keyFingerprint, addKeyToAccount)

function addKeyToAccount (err) {
  if (!err) return createDroplet()
  api.accountAddKey({
    name: process.env.USER,
    public_key: publickey
  }, createDroplet)
}

function createDroplet (err) {
  if (err) return console.error(err)
  api.dropletsCreate(config, console.log)
}

