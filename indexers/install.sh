#!/bin/bash
# Solves this error
# https://stackoverflow.com/questions/72513993/how-to-install-glibc-2-29-or-higher-in-ubuntu-18-04
# Check GLIBC_2.29
ldd --version | head -n1

# Build GLIBC_2.29 from sources
sudo apt-get install gawk bison -y
wget -c https://ftp.gnu.org/gnu/glibc/glibc-2.34.tar.gz
tar -zxvf glibc-2.34.tar.gz && cd glibc-2.34
mkdir glibc-build && cd glibc-build
../configure --prefix=/opt/glibc-2.34
make 
make install

# Install apibara
curl -sL https://install.apibara.com | bash
apibara --version
apibara plugins install sink-postgres
apibara plugins list
