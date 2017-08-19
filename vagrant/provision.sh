#!/bin/sh

echo "provision script"

apt-get update
apt-get install -y git vim curl build-essential cmake python-dev libpcre3-dev libssl-dev g++ moreutils mysql-client