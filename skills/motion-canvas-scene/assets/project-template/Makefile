# Build rules for a Quarto deck with Canvas Commons animations.
# Run `make install` once, then `make preview` to work on the deck.

# The deck to render, and the port `make preview` serves it on
QMD_FILE = deck.qmd
PORT = 4200

# Source files. find -L follows the optional animations/src/lib symlink.
ANIM_SOURCES := $(shell find -L animations/src -name "*.ts" -o -name "*.tsx" -o -name "*.js" 2>/dev/null)
ROOT_SOURCES := $(wildcard package.json vite.player.config.ts motion-canvas-ts.html src/*.ts)

# Empty files whose timestamps record the last successful build
ANIM_BUILD_MARKER := dist/animations/.build-complete
ROOT_BUILD_MARKER := dist/.build-complete

.PHONY: all install anim force-build serve quarto preview publish clean

# Build, render and publish the deck
all: anim quarto publish

# Install npm dependencies in the root (player bundle) and in animations/ (scenes). Run once, and after changing a package.json
install:
	npm install
	npm --prefix ./animations install

# Build the player bundle and the scenes, skipping whichever is up to date
anim: $(ROOT_BUILD_MARKER) $(ANIM_BUILD_MARKER)

# The player bundle: dist/motion-canvas-ts.js, which the deck loads
$(ROOT_BUILD_MARKER): $(ROOT_SOURCES)
	@echo "Building the player bundle..."
	npm run build:player
	@mkdir -p dist
	@touch $(ROOT_BUILD_MARKER)

# The scenes: type-check with tsc, then bundle each into dist/animations/src/
$(ANIM_BUILD_MARKER): $(ANIM_SOURCES) animations/package.json animations/vite.config.ts
	@echo "Building animations..."
	npm --prefix ./animations run build
	@mkdir -p dist/animations
	@touch $(ANIM_BUILD_MARKER)

# Rebuild everything, ignoring timestamps
force-build:
	@rm -f $(ROOT_BUILD_MARKER) $(ANIM_BUILD_MARKER)
	$(MAKE) anim

# Start the Vite dev server (http://localhost:9000) with the scene editor and hot reload, for authoring scenes
serve:
	npm --prefix ./animations run serve

# Build, then render the deck to HTML
quarto: anim
	quarto render $(QMD_FILE)

# Build, then serve the deck with live reload on PORT (no browser opened)
preview: anim
	quarto preview $(QMD_FILE) --no-browser --port $(PORT)

# Build, render, then publish the deck with quarto publish
publish: anim
	quarto render $(QMD_FILE)
	quarto publish $(QMD_FILE) --no-prompt

# Delete dist/, which forces a full rebuild next time
clean:
	rm -rf dist
	@echo "Cleaned build outputs and markers"
