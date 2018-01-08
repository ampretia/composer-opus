#!/bin/bash

set -ev

# Grab the parent (root) directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

ROOT="${DIR}/../.."

# clean out the output directory
rm -rf "${DIR}/out"
mkdir -p "${DIR}/out"

"${ROOT}"/bin/opus --archive "${DIR}/commodity-network.bna"  --outdir "${DIR}/out" --config "${DIR}/config.yaml"