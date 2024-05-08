#!/bin/bash
# Solves this error
# https://stackoverflow.com/questions/72513993/how-to-install-glibc-2-29-or-higher-in-ubuntu-18-04
wget -c https://ftp.gnu.org/gnu/glibc/glibc-2.29.tar.gz
tar -zxvf glibc-2.29.tar.gz
mkdir glibc-2.29/build
cd glibc-2.29/build
../configure --prefix=/opt/glibc
make 
make install

# Install apibara
curl -sL https://install.apibara.com | bash
apibara --version
apibara plugins install sink-postgres
apibara plugins list
