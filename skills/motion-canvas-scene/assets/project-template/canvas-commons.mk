# Canvas Commons build rules (motion-canvas-scene skill).
#
# Include this from the project Makefile, after naming the deck:
#
#   CC_QMD_FILE = talk.qmd
#   include canvas-commons.mk
#
# Every target here starts with cc- and every variable with CC_, so it can sit
# next to an existing Makefile without clashing. CC_QMD_FILE falls back to
# QMD_FILE, which is what the template's own Makefile sets.

# Never take over the including Makefile's default goal.
CC_SAVED_DEFAULT_GOAL := $(.DEFAULT_GOAL)

CC_QMD_FILE ?= $(QMD_FILE)
CC_PORT ?= 4200

# Source file patterns. find -L follows the optional animations/src/lib symlink.
CC_ANIM_SOURCES := $(shell find -L animations/src -name "*.ts" -o -name "*.tsx" -o -name "*.js" 2>/dev/null)
CC_ROOT_SOURCES := $(wildcard package.json vite.player.config.ts motion-canvas-ts.html src/*.ts)

# Build output markers
CC_ANIM_BUILD_MARKER := dist/animations/.build-complete
CC_ROOT_BUILD_MARKER := dist/.build-complete

.PHONY: cc-install cc-build cc-anim cc-force-build cc-quarto cc-preview cc-publish cc-serve cc-clean cc-deck

cc-install:
	npm install
	npm --prefix ./animations install

# Build the player bundle only if its sources changed
$(CC_ROOT_BUILD_MARKER): $(CC_ROOT_SOURCES)
	@echo "Building the player bundle..."
	npm run build:player
	@mkdir -p dist
	@touch $(CC_ROOT_BUILD_MARKER)

# Build the animations only if their sources changed
$(CC_ANIM_BUILD_MARKER): $(CC_ANIM_SOURCES) animations/package.json animations/vite.config.ts
	@echo "Building animations..."
	npm --prefix ./animations run build
	@mkdir -p dist/animations
	@touch $(CC_ANIM_BUILD_MARKER)

cc-build: $(CC_ROOT_BUILD_MARKER) $(CC_ANIM_BUILD_MARKER)

cc-anim: cc-build

# Force rebuild (ignores timestamps)
cc-force-build:
	@rm -f $(CC_ROOT_BUILD_MARKER) $(CC_ANIM_BUILD_MARKER)
	$(MAKE) cc-build

cc-serve:
	npm --prefix ./animations run serve

# Print the deck that cc-quarto, cc-preview and cc-publish render
cc-deck:
	@echo $(CC_QMD_FILE)

# Expands to nothing when a deck is named; stops make otherwise.
CC_CHECK_DECK = $(if $(strip $(CC_QMD_FILE)),,$(error Set CC_QMD_FILE (or QMD_FILE) to the deck's .qmd file before including canvas-commons.mk))

cc-quarto: cc-anim
	$(CC_CHECK_DECK)
	quarto render $(CC_QMD_FILE)

cc-preview: cc-anim
	$(CC_CHECK_DECK)
	quarto preview $(CC_QMD_FILE) --no-browser --port $(CC_PORT)

cc-publish: cc-anim
	$(CC_CHECK_DECK)
	quarto render $(CC_QMD_FILE)
	quarto publish $(CC_QMD_FILE) --no-prompt

cc-clean:
	rm -rf dist
	@echo "Cleaned build outputs and markers"

.DEFAULT_GOAL := $(CC_SAVED_DEFAULT_GOAL)
