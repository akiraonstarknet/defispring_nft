#!/bin/bash
curl -sL https://install.apibara.com | bash
apibara --version
apibara plugins install sink-postgres
apibara plugins list
