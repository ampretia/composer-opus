#!/bin/bash

set -ev

# Grab the parent (root) directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

ROOT="${DIR}/../.."

# clean out the output directory
rm -rf "${DIR}/out"
mkdir -p "${DIR}/out"

"${ROOT}"/bin/opus --archive "${DIR}/network.bna"  --outdir "${DIR}/out" --config "${DIR}/sns-config.yaml" 

serve "${DIR}/out"