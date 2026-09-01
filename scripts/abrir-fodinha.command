#!/bin/bash
cd "$(dirname "$0")"
xattr -cr "Fodinha.app" 2>/dev/null || true
open "Fodinha.app"
