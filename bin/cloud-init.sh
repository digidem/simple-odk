#!/bin/bash

# lock down ssh
echo 'PermitRootLogin without-password' >> /etc/ssh/sshd_config
echo 'PasswordAuthentication no' >> /etc/ssh/sshd_config
reload ssh

# setup swap
# create a 4 Gigabyte file
fallocate -l 4G /swapfile
# set permisisons
sudo chmod 600 /swapfile
# set up swap space
mkswap /swapfile
# enable swap
swapon /swapfile
# make permanent
echo "/swapfile   none    swap    sw    0   0" >> /etc/fstab
# set swappiness (0-100, lower value means prefer using RAM)
sysctl vm.swappiness=10
# persist swappiness
echo "vm.swappiness=10" >> /etc/sysctl.conf
# configure how much the system will choose to cache inode and dentry information over other data
# reducing vfs_cache_pressure from the default of 100 caches more
sysctl vm.vfs_cache_pressure=50
# persist vfs_cache_pressure
echo "vm.vfs_cache_pressure=50" >> /etc/sysctl.conf

# automatic updates
# APT::Periodic::Update-Package-Lists "1";
#  - Do "apt-get update" automatically every 1-days (0=disable)
# APT::Periodic::AutocleanInterval "7";
#  - Do "apt-get autoclean" every 7-days (0=disable)
# APT::Periodic::Unattended-Upgrade "1";
#  - Run the "unattended-upgrade" security upgrade script
#    every 1-days (0=disabled)
cat <<EOF > /etc/apt/apt.conf.d/10periodic
APT::Periodic::Enable "1";
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF

# update nginx repo to the latest (Ubuntu is out of date?)
nginx=stable
add-apt-repository ppa:nginx/$nginx
apt-get -y update

# install fail2ban to block repeated failed ssh login
# iptables-persistent saves iptables settings across reboots
apt-get -y -q install fail2ban iptables-persistent
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
# configure fail2ban to email me when an ip is banned
sed -i 's/^destemail.*/destemail = gregor@ddem.us/' /etc/fail2ban/jail.local

# make sure the connections we are already using are matched, accepted,
# and pulled out of the chain before reaching any DROP rules
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# open ports for ssh, http and https
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# allow loopback requests - inserted as first rule in chain
iptables -I INPUT 1 -i lo -j ACCEPT

# drop any packets that do not match the rest of the chain
iptables -A INPUT -j DROP

# Only allow local connections to docker
echo 'DOCKER_OPTS="$DOCKER_OPTS --ip=127.0.0.1"' >> /etc/default/docker

# nginx optimizations
# set max worker connections based on ulimit
sed -i "s/worker_connections .*/worker_connections $(ulimit -n);/" /etc/nginx/nginx.conf

# setup supervisord to restart process if it fails
# git clone https://github.com/statianzo/dokku-supervisord.git /var/lib/dokku/plugins/dokku-supervisord
# plugin for custom nginx config per VHOST
git clone https://github.com/neam/dokku-nginx-vhosts-custom-configuration.git /var/lib/dokku/plugins/nginx-vhosts-custom-configuration
# install plugins
dokku plugins-install

# Create an empty add
dokku apps:create simple-odk || true

# add custom domain to app
dokku domains:add simple-odk collekt.org
