QMD_FILE = deck.qmd
PORT = 4200

# The build logic lives in canvas-commons.mk; this file only names the deck and
# gives its cc- targets short names.
CC_PORT = $(PORT)
include canvas-commons.mk

.PHONY: all install build anim force-build quarto preview publish serve clean

all: anim quarto publish

install: cc-install
build: cc-build
anim: cc-anim
force-build: cc-force-build
quarto: cc-quarto
preview: cc-preview
publish: cc-publish
serve: cc-serve
clean: cc-clean
