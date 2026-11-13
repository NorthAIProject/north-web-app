#!/bin/sh
# Fails when a copy of the 3D motion data drifts from design/.
# The canonical files are design/{emblem,mascot}-motion.json and their
# fixtures; the web copies live in src/lib/emblem3d/ and src/lib/mascot3d/. north-ios runs the same check against this
# repository's main branch (its scripts/emblem-guard.sh).
set -eu
cd "$(dirname "$0")/../.."
fail=0
check() {
	if ! cmp -s "$1" "$2"; then
		echo "::error::$2 differs from $1. Fix: cp $1 $2" >&2
		fail=1
	fi
}
check design/emblem-motion.json src/lib/emblem3d/emblem-motion.json
check design/mascot-motion.json src/lib/mascot3d/mascot-motion.json
exit $fail
